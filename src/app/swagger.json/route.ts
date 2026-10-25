import { openApiJsonResponse } from '@/lib/public-openapi';

export const revalidate = 3600;

export function GET() {
  return openApiJsonResponse();
}
