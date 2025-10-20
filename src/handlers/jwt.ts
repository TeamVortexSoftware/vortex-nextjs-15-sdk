import { NextRequest } from 'next/server';
import { Vortex } from '@teamvortexsoftware/vortex-node-22-sdk';
import { getVortexConfig, JwtContext } from '../config';
import { createApiResponse, createErrorResponse, parseRequestBody } from '../utils';

export async function handleJwtGeneration(request: NextRequest) {
  try {
    if (request.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    const config = await getVortexConfig(request);

    if (!config.authenticateUser) {
      return createErrorResponse('JWT generation requires authentication configuration. Please configure authenticateUser hook.', 500);
    }

    const authenticatedUser = await config.authenticateUser(request);

    if (!authenticatedUser) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Parse request body to get optional context
    let context: JwtContext | undefined;
    try {
      const body = await parseRequestBody(request);
      context = body?.context;
      console.log('[handleJwtGeneration] Parsed request body:', {
        hasBody: !!body,
        hasContext: !!context,
        context,
      });
    } catch (err) {
      // Body is optional, ignore parse errors
      console.log('[handleJwtGeneration] Failed to parse request body:', err);
    }

    // Generate JWT attributes if hook is provided
    let attributes: Record<string, any> = {};
    console.log('[handleJwtGeneration] Checking for generateJwtAttributes hook:', {
      hasHook: !!config.generateJwtAttributes,
      hasContext: !!context,
    });
    if (config.generateJwtAttributes) {
      attributes = await config.generateJwtAttributes(request, context);
      console.log('[handleJwtGeneration] Generated attributes:', {
        hasAttributes: !!attributes && Object.keys(attributes).length > 0,
        attributeKeys: Object.keys(attributes),
        hasPassthrough: !!attributes?.passthrough,
        passthroughLength: attributes?.passthrough?.length,
      });
    } else {
      console.log('[handleJwtGeneration] No generateJwtAttributes hook configured');
    }

    const vortex = new Vortex(config.apiKey);

    const jwt = vortex.generateJwt({
      userId: authenticatedUser.userId,
      identifiers: authenticatedUser.identifiers,
      groups: authenticatedUser.groups,
      role: authenticatedUser.role,
      attributes,
    });

    console.log('[handleJwtGeneration] Generated JWT - attributes included:', {
      hasAttributes: !!attributes && Object.keys(attributes).length > 0,
      jwtLength: jwt.length,
    });

    return createApiResponse({ jwt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return createErrorResponse(message, 500);
  }
}