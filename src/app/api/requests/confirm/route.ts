import { confirmationRequest } from '@/lib/request-intake-handler';
export const maxDuration=60;
export async function POST(request:Request) {return confirmationRequest(request);}
