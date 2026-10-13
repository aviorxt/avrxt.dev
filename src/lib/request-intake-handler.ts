import { readJsonLimited,RequestBodyError } from './read-json-limited';
import { trustedConfirmationOrigin } from './newsletter-confirmation-request';
import { isRateLimited } from './api-rate-limit';
import { validateIntake,validRequestToken,type RequestKind } from './request-intake-core';
import { submitVerifiedRequest,confirmVerifiedRequest } from './verified-requests';
export const requestResponse=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
export async function intakeRequest(request:Request,kind:RequestKind) {
 if(!trustedConfirmationOrigin(request)) return requestResponse({error:'Submit this form from avrxt.dev.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json')) return requestResponse({error:'Use the website form.'},415);
 try {
  if(await isRateLimited(request.headers,`request-${kind}`,3,3600000)) return requestResponse({error:'Too many requests. Try again later.'},429);
  let payload;
  try {payload=validateIntake(await readJsonLimited(request,16384),kind);} catch(error) {return requestResponse({error:error instanceof Error ? error.message : 'Check the form.'},error instanceof RequestBodyError ? error.status : 400);}
  if(await isRateLimited(request.headers,`request-email-${kind}`,3,86400000,payload.email)) return requestResponse({error:'Please check your inbox or try again tomorrow.'},429);
  const reference=await submitVerifiedRequest(kind,payload);
  return requestResponse({success:true,reference,message:'Check your inbox to verify your request. We will review and respond within 72 hours after verification.'});
 } catch {return requestResponse({error:'We could not accept this request. Please try again or contact support@avrxt.dev.'},503);}
}
export async function confirmationRequest(request:Request) {
 if(!trustedConfirmationOrigin(request)) return requestResponse({error:'Confirm your request from avrxt.dev.'},403);
 try {
  if(!request.headers.get('content-type')?.startsWith('application/json')) return requestResponse({error:'Invalid confirmation.'},415);
  if(await isRateLimited(request.headers,'request-confirm',10,60000)) return requestResponse({error:'Too many attempts. Try again shortly.'},429);
  const body=await readJsonLimited(request,1024) as {token?:unknown;kind?:unknown};
  if(!validRequestToken(body?.token) || !['contact','deletion'].includes(String(body?.kind))) return requestResponse({state:'unavailable'},400);
  return requestResponse(await confirmVerifiedRequest(body.token,body.kind as RequestKind));
 } catch {return requestResponse({error:'Confirmation is temporarily unavailable. Retry in ten minutes or contact support with your reference.'},503);}
}
