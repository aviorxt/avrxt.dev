import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIntake,requestEmbed,validRequestToken } from '../src/lib/request-intake-core';
import { requestEmail } from '../src/lib/request-emails';
import { completeRequestConfirmation } from '../src/lib/request-confirmation-core';
const fixture={name:'Test requester',email:'FIXTURE@example.com',message:'Find my old messages.',scopes:['contact'],authorized:true};
test('deletion requires authority, scope, and locator for accounts/media without collecting identity documents',()=>{
 assert.equal(validateIntake(fixture,'deletion').email,'fixture@example.com');
 for(const patch of [{authorized:false},{scopes:[]},{scopes:['unknown']},{scopes:['account']},{email:'bad'},{name:'a\nb'},{message:'x'.repeat(2001)},{website:'bot'}])assert.throws(()=>validateIntake({...fixture,...patch},'deletion'));
 assert.doesNotThrow(()=>validateIntake({...fixture,scopes:['media'],identifier:'https://cdn.avrxt.dev/i/example.png'},'deletion'));
 assert.equal(validRequestToken('a'.repeat(43)),true);assert.equal(validRequestToken('../token'),false);
});
test('Discord embeds fit limits and disable mentions even at maximum contact length',()=>{
 const payload=requestEmbed('fixture-reference','contact',validateIntake({...fixture,name:'x'.repeat(120),message:'@everyone '+ 'x'.repeat(4990)},'contact'));
 assert.deepEqual(payload.allowed_mentions.parse,[]);
 const embed=payload.embeds[0];assert.ok(embed.fields.every(f=>f.value.length<=1024));
 assert.ok(embed.title.length+embed.footer.text.length+embed.fields.reduce((n,f)=>n+f.name.length+f.value.length,0)<6000);
});
test('verification mail has a private link and receipt distinguishes review from actual erasure',()=>{
 const email=requestEmail('deletion','fixture','https://www.avrxt.dev/delete-request/confirm?token='+'a'.repeat(43));
 assert.match(email.from,/security@avrxt.dev/);assert.match(email.html,/Verify my request/);assert.match(email.text,/24 hours/);
 const receipt=requestEmail('deletion','fixture');assert.match(receipt.text,/72 hours/);assert.match(receipt.text,/does not delete/);assert.doesNotMatch(receipt.html,/Verify my request/);
});
test('confirmation expiration and concurrent claims prevent premature notifications',async()=>{
 let notices=0;const record={id:'fixture',expires_at:new Date(Date.now()-1000).toISOString(),confirmed_at:null,notified_at:null,receipt_sent_at:null};
 const dependencies={find:async()=>record,claim:async()=>true,notify:async()=>{notices++;return 'message';},markNotified:async()=>{},receipt:async()=>true};
 assert.equal((await completeRequestConfirmation(dependencies)).state,'expired');assert.equal(notices,0);
 record.expires_at=new Date(Date.now()+60000).toISOString();assert.equal((await completeRequestConfirmation({...dependencies,claim:async()=>false})).state,'processing');assert.equal(notices,0);
});
test('confirmed requests notify once, completed tokens stay idempotent, and receipt failure is explicit',async()=>{
 const record={id:'fixture',expires_at:new Date(Date.now()+60000).toISOString(),confirmed_at:null,notified_at:null as string|null,receipt_sent_at:null as string|null};let notices=0;
 const dependencies={find:async()=>record,claim:async()=>true,notify:async()=>{notices++;return 'message';},markNotified:async()=>{record.notified_at='done';},receipt:async()=>false};
 const first=await completeRequestConfirmation(dependencies);assert.equal(first.state,'confirmed');assert.equal(first.receiptDelivered,false);
 await completeRequestConfirmation(dependencies);assert.equal(notices,1);
});
test('a failed Discord delivery does not create a success record or send a receipt',async()=>{
 let saved=0,receipts=0;await assert.rejects(()=>completeRequestConfirmation({find:async()=>({id:'fixture',expires_at:new Date(Date.now()+60000).toISOString(),confirmed_at:null,notified_at:null,receipt_sent_at:null}),claim:async()=>true,notify:async()=>{throw new Error('Unavailable');},markNotified:async()=>{saved++;},receipt:async()=>{receipts++;return true;}}));assert.equal(saved,0);assert.equal(receipts,0);
});
