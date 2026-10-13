import RequestConfirmation from '@/components/RequestConfirmation';
export const dynamic='force-dynamic';
export const metadata={title:'Verify contact request | avrxt',robots:{index:false,follow:false},referrer:'same-origin' as const};
export default async function Page({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <RequestConfirmation token={typeof token === 'string' ? token : ''} kind="contact"/>;}
