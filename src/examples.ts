/**
 * Example Next.js API route setups for Vortex integration
 *
 * To use these examples in your Next.js app, create the corresponding
 * files in your app/api directory with the following structure:
 */

// app/api/vortex/jwt/route.ts
export const jwtRouteExample = `
import { createVortexJwtRoute } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const POST = createVortexJwtRoute();
`;

// app/api/vortex/invitations/route.ts
export const invitationsRouteExample = `
import { createVortexInvitationsRoute } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET } = createVortexInvitationsRoute();
`;

// app/api/vortex/invitations/[invitationId]/route.ts
export const invitationByIdRouteExample = `
import { createVortexInvitationRoute } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET, DELETE } = createVortexInvitationRoute();
`;

// app/api/vortex/invitations/accept/route.ts
export const acceptInvitationsRouteExample = `
import { createVortexInvitationsAcceptRoute } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexInvitationsAcceptRoute();
`;

// app/api/vortex/invitations/by-group/[groupType]/[groupId]/route.ts
export const invitationsByGroupRouteExample = `
import { createVortexInvitationsByGroupRoute } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET, DELETE } = createVortexInvitationsByGroupRoute();
`;

// app/api/vortex/invitations/[invitationId]/reinvite/route.ts
export const reinviteRouteExample = `
import { createVortexReinviteRoute } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexReinviteRoute();
`;

// Configuration example
export const configurationExample = `
// In your app initialization (e.g., in a layout.tsx or _app.tsx equivalent):
import { configureVortex, type AuthenticatedUser } from '@teamvortexsoftware/vortex-nextjs-15-sdk';
import { NextRequest } from 'next/server';

// Example with custom authentication logic
configureVortex({
  apiKey: process.env.VORTEX_API_KEY!,
  apiBaseUrl: process.env.VORTEX_API_BASE_URL, // optional
  authenticateUser: async (request: NextRequest): Promise<AuthenticatedUser | null> => {
    // Your authentication logic here - extract user from session, JWT, etc.
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return null;
    }

    // Example: decode your session token and get user info
    const user = await validateSessionAndGetUser(sessionToken);

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      identifiers: [{ type: 'email', value: user.email }],
      groups: user.organizations.map(org => ({
        type: 'organization',
        id: org.id,
        name: org.name
      })),
      role: user.role
    };
  }
});

// Minimal setup with environment variables only (JWT endpoint will require authenticateUser hook):
configureVortex({
  apiKey: process.env.VORTEX_API_KEY!,
});
`;

/**
 * Complete API Routes Summary:
 *
 * POST /api/vortex/jwt
 * - Generate JWT token for authentication
 *
 * GET /api/vortex/invitations?targetType={email|username|phoneNumber}&targetValue={value}
 * - Get invitations by target
 *
 * GET /api/vortex/invitations/[invitationId]
 * - Get specific invitation
 *
 * DELETE /api/vortex/invitations/[invitationId]
 * - Revoke/delete invitation
 *
 * POST /api/vortex/invitations/accept
 * - Accept invitations
 *
 * GET /api/vortex/invitations/by-group/[groupType]/[groupId]
 * - Get invitations by group
 *
 * DELETE /api/vortex/invitations/by-group/[groupType]/[groupId]
 * - Delete invitations by group
 *
 * POST /api/vortex/invitations/[invitationId]/reinvite
 * - Resend invitation
 */