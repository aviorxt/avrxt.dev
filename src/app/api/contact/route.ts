import { intakeRequest } from '@/lib/request-intake-handler';
import { NextResponse } from 'next/server';
import { isContactEnabled } from '@/lib/public-feature-config';
export const maxDuration = 60;
export async function POST(request: Request) { if (!await isContactEnabled()) return NextResponse.json({ error: 'CONTACT_DISABLED' }, { status: 403 }); return intakeRequest(request, 'contact'); }
