import { intakeRequest } from '@/lib/request-intake-handler';
export const maxDuration = 60;
export async function POST(request: Request) { return intakeRequest(request, 'contact'); }
