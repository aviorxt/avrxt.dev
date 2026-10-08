import HttpErrorPage from '@/components/HttpErrorPage';
import { buildHttpErrorMetadata } from '@/lib/http-error-metadata';
export const metadata = buildHttpErrorMetadata('502');
export default function Page() { return <HttpErrorPage code="502" />; }
