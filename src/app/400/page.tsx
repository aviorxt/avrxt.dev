import HttpErrorPage from '@/components/HttpErrorPage';
import { buildHttpErrorMetadata } from '@/lib/http-error-metadata';
export const metadata = buildHttpErrorMetadata('400');
export default function Page() { return <HttpErrorPage code="400" />; }
