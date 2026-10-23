const SECURITY_CONTACT = "mailto:avrxt.dev@elvnx.tech";

export function GET() {
  const document = [
    `Contact: ${SECURITY_CONTACT}`,
    "Expires: 2027-01-23T00:00:00.000Z",
    "Preferred-Languages: en",
    "Canonical: https://www.avrxt.dev/.well-known/security.txt",
    "Policy: https://www.avrxt.dev/legal/security",
    "",
  ].join("\n");

  return new Response(document, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
