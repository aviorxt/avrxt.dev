import 'server-only';
import { createHash,randomBytes,randomUUID } from 'node:crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { createResendClient } from './newsletter-broadcast';
import { requestWebhook,notifyRequest } from './discord-requests';
import { requestEmail } from './request-emails';
import { type Intake,type RequestKind,validRequestToken } from './request-intake-core';
import { completeRequestConfirmation } from './request-confirmation-core';
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function submitVerifiedRequest(kind:RequestKind,payload:Intake) {
 requestWebhook(kind);
 const resend=createResendClient(),db=createAdminClient(),id=randomUUID(),token=randomBytes(32).toString('base64url');
 await db.from('verified_requests').delete().is('confirmed_at',null).lt('expires_at',new Date().toISOString());
 const inserted=await db.from('verified_requests').insert({id,kind,email:payload.email,payload,token_hash:hash(token),expires_at:new Date(Date.now()+86400000).toISOString()});
 if(inserted.error) throw new Error('Request storage unavailable');
 const route=kind === 'deletion' ? '/delete-request/confirm' : '/contact/confirm';
 const result=await resend.emails.send({...requestEmail(kind,id,`https://www.avrxt.dev${route}?token=${token}`),to:payload.email},{idempotencyKey:`request-verify/${id}`});
 if(result.error || !result.data) {await db.from('verified_requests').delete().eq('id',id).is('confirmed_at',null);throw new Error('Verification delivery unavailable');}
 return id;
}
export async function confirmVerifiedRequest(token:string,kind:RequestKind) {
 if(!validRequestToken(token)) return {state:'unavailable'};
 const db=createAdminClient();
 return completeRequestConfirmation({
  find:async()=>{const result=await db.from('verified_requests').select('*').eq('token_hash',hash(token)).eq('kind',kind).maybeSingle();if(result.error)throw new Error('Request lookup unavailable');return result.data as (import('./request-confirmation-core').RequestRecord & {kind:RequestKind;email:string;payload:Intake}) | null;},
  claim:async row=>{const now=new Date().toISOString();const result=await db.from('verified_requests').update({confirmed_at:row.confirmed_at || now,processing_until:new Date(Date.now()+600000).toISOString()}).eq('id',row.id).is('notified_at',null).or(`processing_until.is.null,processing_until.lt.${now}`).select('id').maybeSingle();if(result.error)throw new Error('Request verification unavailable');return Boolean(result.data);},
  notify:row=>notifyRequest(row.id,row.kind,row.payload),
  markNotified:async(row,messageId)=>{const result=await db.from('verified_requests').update({notified_at:new Date().toISOString(),discord_message_id:messageId}).eq('id',row.id);if(result.error)throw new Error('Request completion unavailable');},
  receipt:async row=>{for(let attempt=0;attempt<3;attempt++){try{const sent=await createResendClient().emails.send({...requestEmail(row.kind,row.id),to:row.email},{idempotencyKey:`request-receipt/${row.id}`});if(!sent.error && sent.data){const saved=await db.from('verified_requests').update({receipt_sent_at:new Date().toISOString()}).eq('id',row.id);return !saved.error;}}catch{/* bounded retry, no sensitive logging */}await new Promise(resolve=>setTimeout(resolve,300));}return false;}
 });
}
