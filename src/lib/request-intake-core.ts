export const deletionScopes = ['newsletter', 'contact', 'account', 'media', 'other'] as const;
export type RequestKind = 'contact' | 'deletion';
export type Intake = { name: string; email: string; message: string; scopes: string[]; identifier: string; authorized: boolean };
export function validateIntake(body: unknown, kind: RequestKind): Intake {
 if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request.');
 const input = body as Record<string, unknown>;
 const field = (key: string, max: number, required = false) => {
  const value = typeof input[key] === 'string' ? input[key].trim() : '';
  if (value.length > max || (required && !value)) throw new Error(`Check the ${key} field.`);
  return value;
 };
 const name = field('name',120,true), email = field('email',254,true).toLowerCase();
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(name)) throw new Error('Enter a valid name and email.');
 const message = field('message',kind === 'contact' ? 5000 : 2000,kind === 'contact'), identifier = field('identifier',400);
 const scopes = Array.isArray(input.scopes) ? [...new Set(input.scopes)].filter((v): v is string => typeof v === 'string') : [];
 const authorized = input.authorized === true || input.authorized === 'on';
 if (kind === 'deletion') {
  if (!authorized || !scopes.length || scopes.some(v => !deletionScopes.includes(v as typeof deletionScopes[number]))) throw new Error('Select the records and confirm your authority to request deletion.');
  if (scopes.includes('other') && !message) throw new Error('Provide details to locate the other records.');
  if ((scopes.includes('account') || scopes.includes('media')) && !identifier) throw new Error('Provide an account ID or public content URL to locate those records.');
 }
 if (field('website',200)) throw new Error('Invalid request.');
 return { name,email,message,identifier,scopes:kind === 'deletion' ? scopes : [],authorized };
}
export const validRequestToken = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v);
export function requestEmbed(id: string, kind: RequestKind, input: Intake) {
 const fields = [{name:'Reference',value:id},{name:'Name',value:input.name},{name:'Verified email',value:input.email}];
 if (kind === 'deletion') fields.push({name:'Records requested',value:input.scopes.join(', ')},{name:'Account / content identifiers',value:input.identifier || 'Not supplied'},{name:'Authorization',value:'Requester affirmed authority. Inbox verified; ownership and scope still require manual review.'});
 for(let offset=0;offset<input.message.length;offset+=1000) fields.push({name:offset ? 'Details continued' : 'Details',value:input.message.slice(offset,offset+1000)});
 return {allowed_mentions:{parse:[]},embeds:[{title:kind === 'deletion' ? 'Verified data-deletion request' : 'Verified contact request',color:0x252525,fields,footer:{text:'Review and respond within 72 hours. Manual ownership review required before deletion.'},timestamp:new Date().toISOString()}]};
}
