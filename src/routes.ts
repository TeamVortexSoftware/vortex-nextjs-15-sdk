import { NextRequest } from 'next/server';
import { handleJwtGeneration } from './handlers/jwt';
import {
  handleGetInvitationsByTarget,
  handleGetInvitation,
  handleRevokeInvitation,
  handleAcceptInvitations,
  handleGetInvitationsByGroup,
  handleDeleteInvitationsByGroup,
  handleReinvite,
} from './handlers/invitations';

/**
 * Expected route paths that match the React provider's API calls
 * This ensures the Next.js routes and React provider stay in sync
 */
export const VORTEX_ROUTES = {
  JWT: '/jwt',
  INVITATIONS: '/invitations',
  INVITATION: '/invitations/[invitationId]',
  INVITATIONS_ACCEPT: '/invitations/accept',
  INVITATIONS_BY_GROUP: '/invitations/by-group/[groupType]/[groupId]',
  INVITATION_REINVITE: '/invitations/[invitationId]/reinvite',
} as const;

/**
 * Utility to create the full API path based on base URL
 */
export function createVortexApiPath(baseUrl: string, route: keyof typeof VORTEX_ROUTES): string {
  return `${baseUrl.replace(/\/$/, '')}${VORTEX_ROUTES[route]}`;
}

export function createVortexJwtRoute() {
  return async function POST(request: NextRequest) {
    return handleJwtGeneration(request);
  };
}

export function createVortexInvitationsRoute() {
  return {
    async GET(request: NextRequest) {
      return handleGetInvitationsByTarget(request);
    },
  };
}

export function createVortexInvitationRoute() {
  return {
    async GET(request: NextRequest, { params }: { params: Promise<{ invitationId: string }> }) {
      const { invitationId } = await params;
      return handleGetInvitation(request, invitationId);
    },
    async DELETE(request: NextRequest, { params }: { params: Promise<{ invitationId: string }> }) {
      const { invitationId } = await params;
      return handleRevokeInvitation(request, invitationId);
    },
  };
}

export function createVortexInvitationsAcceptRoute() {
  return {
    async POST(request: NextRequest) {
      return handleAcceptInvitations(request);
    },
  };
}

export function createVortexInvitationsByGroupRoute() {
  return {
    async GET(request: NextRequest, { params }: { params: Promise<{ groupType: string; groupId: string }> }) {
      const { groupType, groupId } = await params;
      return handleGetInvitationsByGroup(request, groupType, groupId);
    },
    async DELETE(request: NextRequest, { params }: { params: Promise<{ groupType: string; groupId: string }> }) {
      const { groupType, groupId } = await params;
      return handleDeleteInvitationsByGroup(request, groupType, groupId);
    },
  };
}

export function createVortexReinviteRoute() {
  return {
    async POST(request: NextRequest, { params }: { params: Promise<{ invitationId: string }> }) {
      const { invitationId } = await params;
      return handleReinvite(request, invitationId);
    },
  };
}

/**
 * Creates all Vortex routes with enforced path structure
 * This ensures perfect compatibility with the React provider
 *
 * Usage:
 * ```typescript
 * // In your Next.js app, create these files with the exact structure:
 *
 * // app/api/vortex/jwt/route.ts
 * export const { POST } = createVortexRoutes().jwt;
 *
 * // app/api/vortex/invitations/route.ts
 * export const { GET } = createVortexRoutes().invitations;
 *
 * // app/api/vortex/invitations/[invitationId]/route.ts
 * export const { GET, DELETE } = createVortexRoutes().invitation;
 *
 * // etc...
 * ```
 */
export function createVortexRoutes() {
  return {
    jwt: createVortexJwtRoute(),
    invitations: createVortexInvitationsRoute(),
    invitation: createVortexInvitationRoute(),
    invitationsAccept: createVortexInvitationsAcceptRoute(),
    invitationsByGroup: createVortexInvitationsByGroupRoute(),
    invitationReinvite: createVortexReinviteRoute(),
  };
}

/**
 * File structure guide for Next.js App Router
 * Create these files in your app/api/vortex/ directory:
 */
export const NEXTJS_FILE_STRUCTURE = {
  'jwt/route.ts': VORTEX_ROUTES.JWT,
  'invitations/route.ts': VORTEX_ROUTES.INVITATIONS,
  'invitations/[invitationId]/route.ts': VORTEX_ROUTES.INVITATION,
  'invitations/accept/route.ts': VORTEX_ROUTES.INVITATIONS_ACCEPT,
  'invitations/by-group/[groupType]/[groupId]/route.ts': VORTEX_ROUTES.INVITATIONS_BY_GROUP,
  'invitations/[invitationId]/reinvite/route.ts': VORTEX_ROUTES.INVITATION_REINVITE,
} as const;