import 'server-only';
import { requestEmbed, type RequestKind, type Intake } from './request-intake-core';
export function requestWebhook(kind: RequestKind) {
 const raw=process.env[kind === 'deletion' ? 'DISCORD_DELETE_REQUEST_WEBHOOK_URL' : 'DISCORD_CONTACT_WEBHOOK_URL']?.trim();
 if(!raw) throw new Error('Request channel unavailable');
 const url=new URL(raw);
 if(url.origin !== 'https://discord.com' || !/^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname) || url.username || url.password) throw new Error('Invalid request channel');
 url.search='?wait=true';return url;
}
export async function notifyRequest(id:string,kind:RequestKind,input:Intake) {
 const response=await fetch(requestWebhook(kind),{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'AVRXT-request-configuration/1.0'},body:JSON.stringify(requestEmbed(id,kind,input)),signal:AbortSignal.timeout(12000),cache:'no-store'});
 const result=await response.json().catch(()=>null) as {id?:string}|null;
 if(!response.ok || !result?.id) throw new Error('Request delivery unavailable');
 return result.id;
}
