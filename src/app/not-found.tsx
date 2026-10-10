import HttpErrorPage from '@/components/HttpErrorPage';
import { buildHttpErrorMetadata } from '@/lib/http-error-metadata';

export const metadata = buildHttpErrorMetadata('404');

export default function NotFound() {
    return <HttpErrorPage code="404" />;
}
