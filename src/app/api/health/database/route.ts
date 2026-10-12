import { createPublicClient } from '@/utils/supabase/public';
import { databaseMonitorResponse } from '@/lib/database-monitor';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return databaseMonitorResponse(request, process.env.STATUS_MONITOR_TOKEN, signal => createPublicClient().from('documents').select('id').eq('published', true).limit(1).abortSignal(signal));
}
