import * as NextServer from 'next/server';

const { NextResponse } = NextServer;

export function createApiResponse(data: any, status: number = 200): NextServer.NextResponse {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(message: string, status: number = 400): NextServer.NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function parseRequestBody(request: NextServer.NextRequest): Promise<any> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

export function getQueryParam(request: NextServer.NextRequest, param: string): string | null {
  return request.nextUrl.searchParams.get(param);
}

export function validateRequiredFields(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function sanitizeInput(input: string | null): string | null {
  if (!input) return null;

  // Basic input sanitization - remove potential XSS/injection characters
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove basic XSS characters
    .substring(0, 1000); // Limit length to prevent DoS
}