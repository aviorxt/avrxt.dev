export type RequestRecord={id:string;expires_at:string;confirmed_at:string|null;notified_at:string|null;receipt_sent_at:string|null};
export async function completeRequestConfirmation<T extends RequestRecord>(dependencies:{find:()=>Promise<T|null>;claim:(row:T)=>Promise<boolean>;notify:(row:T)=>Promise<string>;markNotified:(row:T,messageId:string)=>Promise<void>;receipt:(row:T)=>Promise<boolean>;now?:number}){
 const row=await dependencies.find();if(!row)return {state:'unavailable'};
 if(!row.notified_at){
  if(!row.confirmed_at && (!Number.isFinite(Date.parse(row.expires_at)) || Date.parse(row.expires_at)<(dependencies.now ?? Date.now())))return {state:'expired'};
  if(!await dependencies.claim(row))return {state:'processing'};
  const messageId=await dependencies.notify(row);await dependencies.markNotified(row,messageId);
 }
 const receiptDelivered=Boolean(row.receipt_sent_at) || await dependencies.receipt(row);
 return {state:'confirmed',reference:row.id,receiptDelivered};
}
