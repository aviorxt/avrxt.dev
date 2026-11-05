import { confirmationEmail, welcomeEmail } from './newsletter-email.mjs';
const newsletterOrigins = new Set(['https://muzix.avrxt.dev', 'http://localhost:3000']);
const newsletterResponse = (body, status=200) => Response.json(body, {status, headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const encoder = new TextEncoder();
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unbase64 = value => Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')), c=>c.charCodeAt(0));
async function signingKey(secret) { return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']); }
export async function newsletterToken(secret, email, purpose, expires) {
  const payload=base64url(encoder.encode(JSON.stringify({email,purpose,expires})));
  return payload+'.'+base64url(await crypto.subtle.sign('HMAC',await signingKey(secret),encoder.encode(payload)));
}
export async function readNewsletterToken(secret, token, purpose, now=Date.now()) {
  try {
    if(typeof token!=='string'||token.length>1500) return null;
    const [payload,signature,...extra]=token.split('.');
    if(extra.length||!signature||!await crypto.subtle.verify('HMAC',await signingKey(secret),unbase64(signature),encoder.encode(payload)))return null;
    const value=JSON.parse(new TextDecoder().decode(unbase64(payload)));
    if(value.purpose!==purpose||!validEmail(value.email)||!Number.isFinite(value.expires)||(value.expires!==0&&value.expires<=now))return null;
    return value;
  } catch { return null; }
}
function validEmail(value) { return typeof value==='string'&&value.length<=254&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value); }
async function newsletterHash(value) { return base64url(await crypto.subtle.digest('SHA-256',encoder.encode(value))); }
async function newsletterResend(env,path,{method='GET',body,idempotency}={}) {
  for(let attempt=0;attempt<3;attempt++) {
    const response=await fetch('https://api.resend.com'+path,{method,headers:{Authorization:'Bearer '+env.MUZIX_RESEND_API_KEY,'Content-Type':'application/json',...(idempotency?{'Idempotency-Key':idempotency}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
    if(response.status===429&&attempt<2){await new Promise(r=>setTimeout(r,Math.min(5000,Math.max(1000,Number(response.headers.get('retry-after')||1)*1000))));continue;}
    const data=await response.json();
    if(!response.ok){const error=new Error('newsletter_provider_error');error.status=response.status;throw error;}
    return data;
  }
}
export async function handleNewsletter(request,env) {
  if(request.method!=='POST')return newsletterResponse({error:'Method not allowed'},405);
  if(!newsletterOrigins.has(request.headers.get('Origin')))return newsletterResponse({error:'Origin not allowed'},403);
  if(!env.MUZIX_RESEND_API_KEY||!env.MUZIX_SEGMENT_ID||!env.MUZIX_NEWSLETTER_SECRET)return newsletterResponse({error:'Subscriptions are temporarily unavailable.'},503);
  if(!request.headers.get('Content-Type')?.includes('application/json'))return newsletterResponse({error:'Expected JSON'},415);
  if(Number(request.headers.get('Content-Length')||0)>4096)return newsletterResponse({error:'Request too large'},413);
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  if(env.MAIL_AI_LIMITER&&!((await env.MAIL_AI_LIMITER.limit({key:'muzix-newsletter:'+ip})).success))return newsletterResponse({error:'Please wait a minute before trying again.'},429);
  let input;try{const raw=await request.text();if(raw.length>4096)return newsletterResponse({error:'Request too large'},413);input=JSON.parse(raw);}catch{return newsletterResponse({error:'Invalid request'},400);}
  const path=new URL(request.url).pathname;
  try {
    if(path==='/v1/music/subscribe') {
      if(input.website)return newsletterResponse({ok:true,message:'Check your inbox to confirm your email.'});
      const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
      if(!validEmail(email)||input.consent!==true)return newsletterResponse({error:'Enter a valid email and agree to receive the monthly snapshot.'},400);
      // Stable within one day: provider idempotency suppresses repeated mail requests.
      const expires=(Math.floor(Date.now()/86400000)+2)*86400000;
      const token=await newsletterToken(env.MUZIX_NEWSLETTER_SECRET,email,'confirm',expires);
      const content=confirmationEmail('https://muzix.avrxt.dev/subscribe#token='+token);
      await newsletterResend(env,'/emails',{method:'POST',body:{from:'Muzix <notes@muzix.avrxt.dev>',to:[email],...content},idempotency:'muzix-confirm-'+await newsletterHash(token)});
      return newsletterResponse({ok:true,message:'Check your inbox to confirm your email. The link expires within 48 hours.'});
    }
    const unsubscribe=path==='/v1/music/unsubscribe';
    const value=await readNewsletterToken(env.MUZIX_NEWSLETTER_SECRET,input.token,unsubscribe?'unsubscribe':'confirm');
    if(!value)return newsletterResponse({error:'This link is invalid or expired. Please subscribe again for a fresh link.'},400);
    const emailPath='/contacts/'+encodeURIComponent(value.email);
    if(unsubscribe) {
      try{await newsletterResend(env,emailPath+'/segments/'+env.MUZIX_SEGMENT_ID,{method:'DELETE'});}catch(error){if(error.status!==404)throw error;}
      return newsletterResponse({ok:true,message:'You’re unsubscribed from Muzix. You can rejoin any time.'});
    }
    let contact;try{contact=await newsletterResend(env,emailPath);}catch(error){if(error.status!==404)throw error;}
    if(contact?.unsubscribed)return newsletterResponse({error:'You previously unsubscribed from this sender in Resend. Your preference has been preserved. Contact notes@muzix.avrxt.dev if you want to rejoin.'},409);
    if(!contact)await newsletterResend(env,'/contacts',{method:'POST',body:{email:value.email,unsubscribed:false}});
    await newsletterResend(env,emailPath+'/segments/'+env.MUZIX_SEGMENT_ID,{method:'POST'});
    const unsubscribeToken=await newsletterToken(env.MUZIX_NEWSLETTER_SECRET,value.email,'unsubscribe',0);
    const unsubscribeUrl='https://muzix.avrxt.dev/subscribe#unsubscribe='+unsubscribeToken;
    const content=welcomeEmail(unsubscribeUrl);
    // The segment join is already committed. A welcome failure must not claim signup failed.
    try{await newsletterResend(env,'/emails',{method:'POST',body:{from:'Muzix <notes@muzix.avrxt.dev>',to:[value.email],...content},idempotency:'muzix-welcome-'+await newsletterHash(input.token)});}catch{/* Subscription remains active. */}
    return newsletterResponse({ok:true,message:'You’re in the rotation. Your monthly Muzix snapshot starts with the next edition.'});
  } catch {return newsletterResponse({error:'Could not reach the email service. Please try again shortly.'},502);}
}
