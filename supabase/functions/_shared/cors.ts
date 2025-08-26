// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://helixmd.ca',
  'https://www.helixmd.ca',
  'https://app.helixmd.ca',
  'http://localhost:3000',
  'http://localhost:5173'
];

export function corsHeaders(origin: string | null): Record<string, string> {
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}