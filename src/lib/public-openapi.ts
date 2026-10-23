export const publicOpenApiDocument = {
  openapi: '3.1.1',
  info: {
    title: 'AVRXT Public API',
    version: 'v1',
    description: 'The public AVRXT API gateway. Use HTTPS and JSON for all requests and responses.',
    contact: { name: 'AVRXT', url: 'https://www.avrxt.dev/contact' },
    license: { name: 'AVRXT Terms', url: 'https://www.avrxt.dev/legal/terms' },
  },
  servers: [{ url: 'https://api.avrxt.dev/v1', description: 'Production' }],
  externalDocs: {
    description: 'Read the complete AVRXT API reference',
    url: 'https://www.avrxt.dev/system/api/doc',
  },
  tags: [
    { name: 'System', description: 'Service availability and public status.' },
    { name: 'Content', description: 'Public metadata and media output.' },
    { name: 'Integrations', description: 'Read-only public integration data.' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'], summary: 'Check API health', operationId: 'getHealth',
        responses: { '200': { description: 'The API is healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } } }, '503': { $ref: '#/components/responses/ServiceUnavailable' } },
      },
    },
    '/status': {
      get: {
        tags: ['System'], summary: 'Read public system status', operationId: 'getStatus',
        responses: { '200': { description: 'Current public system status', content: { 'application/json': { schema: { $ref: '#/components/schemas/Status' } } } }, '503': { $ref: '#/components/responses/ServiceUnavailable' } },
      },
    },
    '/link-preview': {
      get: {
        tags: ['Content'], summary: 'Get public URL metadata', operationId: 'getLinkPreview',
        parameters: [{ name: 'url', in: 'query', required: true, description: 'Public HTTP or HTTPS URL to inspect.', schema: { type: 'string', format: 'uri', maxLength: 2048 } }],
        responses: { '200': { description: 'Resolved link metadata', content: { 'application/json': { schema: { $ref: '#/components/schemas/LinkPreview' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '429': { $ref: '#/components/responses/RateLimited' }, '502': { $ref: '#/components/responses/UpstreamUnavailable' } },
      },
    },
    '/og': {
      get: {
        tags: ['Content'], summary: 'Generate Open Graph output', operationId: 'getOpenGraphImage',
        parameters: [{ name: 'path', in: 'query', required: false, description: 'AVRXT route used to select the output content.', schema: { type: 'string', example: '/about' } }],
        responses: { '200': { description: 'Generated social preview image', content: { 'image/png': { schema: { type: 'string', format: 'binary' } } } }, '400': { $ref: '#/components/responses/BadRequest' } },
      },
    },
    '/spotify/now-playing': {
      get: {
        tags: ['Integrations'], summary: 'Read the current or latest Spotify track', operationId: 'getNowPlaying',
        responses: { '200': { description: 'Spotify listening state', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } }, '503': { $ref: '#/components/responses/ServiceUnavailable' } },
      },
    },
  },
  components: {
    schemas: {
      Health: { type: 'object', required: ['status', 'timestamp'], properties: { status: { type: 'string', example: 'healthy' }, timestamp: { type: 'string', format: 'date-time' } } },
      Status: { type: 'object', required: ['status', 'label'], properties: { status: { type: 'string', example: 'operational' }, label: { type: 'string', example: 'All systems operational' } } },
      LinkPreview: { type: 'object', required: ['url', 'resolvedUrl', 'host'], properties: { url: { type: 'string', format: 'uri' }, resolvedUrl: { type: 'string', format: 'uri' }, host: { type: 'string' }, title: { type: ['string', 'null'] }, description: { type: ['string', 'null'] }, image: { type: ['string', 'null'], format: 'uri' }, favicon: { type: ['string', 'null'], format: 'uri' }, siteName: { type: ['string', 'null'] } } },
      Error: { type: 'object', required: ['error'], properties: { error: { type: 'string' } } },
    },
    responses: {
      BadRequest: { description: 'The request is invalid.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      RateLimited: { description: 'Too many requests were sent in a short period.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      ServiceUnavailable: { description: 'The service or an upstream integration is unavailable.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      UpstreamUnavailable: { description: 'The requested upstream content could not be read.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  },
} as const;

export function openApiJsonResponse() {
  return Response.json(publicOpenApiDocument, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Disposition': 'inline; filename="openapi.json"',
    },
  });
}
