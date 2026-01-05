import { NextRequest } from 'next/server';
import { Vortex } from '@teamvortexsoftware/vortex-node-22-sdk';
import { getVortexConfig, authenticateRequest } from '../config';
import { createApiResponse, createErrorResponse, parseRequestBody, validateRequiredFields, getQueryParam, sanitizeInput } from '../utils';

export async function handleGetInvitationsByTarget(request: NextRequest) {
  try {
    if (request.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Get configuration and authenticate user
    const config = await getVortexConfig(request);
    const user = await authenticateRequest(request);

    // Check access control if hook is configured
    if (config.canAccessInvitationsByTarget) {
      const hasAccess = await config.canAccessInvitationsByTarget(request, user);
      if (!hasAccess) {
        return createErrorResponse('Access denied', 403);
      }
    } else if (!user) {
      // If no access control hook is configured, require authentication
      return createErrorResponse('Access denied. Configure access control hooks for invitation endpoints.', 403);
    }

    const targetType = sanitizeInput(getQueryParam(request, 'targetType')) as 'email' | 'username' | 'phoneNumber';
    const targetValue = sanitizeInput(getQueryParam(request, 'targetValue'));

    if (!targetType || !targetValue) {
      return createErrorResponse('targetType and targetValue query parameters are required', 400);
    }

    if (!['email', 'username', 'phoneNumber'].includes(targetType)) {
      return createErrorResponse('targetType must be email, username, or phoneNumber', 400);
    }

    const vortex = new Vortex(config.apiKey);
    const invitations = await vortex.getInvitationsByTarget(targetType, targetValue);
    return createApiResponse({ invitations });
  } catch (error) {
    console.error('Error in handleGetInvitationsByTarget:', error);
    return createErrorResponse('An error occurred while processing your request', 500);
  }
}

export async function handleGetInvitation(request: NextRequest, invitationId: string) {
  try {
    if (request.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    const sanitizedId = sanitizeInput(invitationId);
    if (!sanitizedId) {
      return createErrorResponse('Invalid invitation ID', 400);
    }

    // Get configuration and authenticate user
    const config = await getVortexConfig(request);
    const user = await authenticateRequest(request);

    // Check access control if hook is configured
    if (config.canAccessInvitation) {
      const hasAccess = await config.canAccessInvitation(request, user, { invitationId: sanitizedId });
      if (!hasAccess) {
        return createErrorResponse('Access denied', 403);
      }
    } else if (!user) {
      return createErrorResponse('Access denied. Configure access control hooks for invitation endpoints.', 403);
    }

    const vortex = new Vortex(config.apiKey);
    const invitation = await vortex.getInvitation(sanitizedId);
    return createApiResponse(invitation);
  } catch (error) {
    console.error('Error in handleGetInvitation:', error);
    return createErrorResponse('An error occurred while processing your request', 500);
  }
}

export async function handleRevokeInvitation(request: NextRequest, invitationId: string) {
  try {
    if (request.method !== 'DELETE') {
      return createErrorResponse('Method not allowed', 405);
    }

    const sanitizedId = sanitizeInput(invitationId);
    if (!sanitizedId) {
      return createErrorResponse('Invalid invitation ID', 400);
    }

    const config = await getVortexConfig(request);
    const user = await authenticateRequest(request);

    if (config.canDeleteInvitation) {
      const hasAccess = await config.canDeleteInvitation(request, user, { invitationId: sanitizedId });
      if (!hasAccess) {
        return createErrorResponse('Access denied', 403);
      }
    } else if (!user) {
      return createErrorResponse('Access denied. Configure access control hooks for invitation endpoints.', 403);
    }

    const vortex = new Vortex(config.apiKey);
    await vortex.revokeInvitation(sanitizedId);
    return createApiResponse({ success: true });
  } catch (error) {
    console.error('Error in handleRevokeInvitation:', error);
    return createErrorResponse('An error occurred while processing your request', 500);
  }
}

export async function handleAcceptInvitations(request: NextRequest) {
  try {
    if (request.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    const body = await parseRequestBody(request);

    const { invitationIds, target, user } = body;

    if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
      return createErrorResponse('invitationIds must be a non-empty array', 400);
    }

    // Sanitize invitation IDs
    const sanitizedIds: string[] = invitationIds.map((id: string) => sanitizeInput(id)).filter((id): id is string => Boolean(id));
    if (sanitizedIds.length !== invitationIds.length) {
      return createErrorResponse('Invalid invitation IDs provided', 400);
    }

    // Support both new format (user) and legacy format (target)
    if (!user && !target) {
      return createErrorResponse('Either user or target must be provided', 400);
    }

    let acceptData: any;

    if (user) {
      // New format: user object with email/phone
      if (!user.email && !user.phone) {
        return createErrorResponse('user must have either email or phone', 400);
      }
      acceptData = {
        email: user.email ? sanitizeInput(user.email) : undefined,
        phone: user.phone ? sanitizeInput(user.phone) : undefined,
        name: user.name ? sanitizeInput(user.name) : undefined,
      };
    } else {
      // Legacy format: target object
      if (!target.type || !target.value) {
        return createErrorResponse('target must have type and value properties', 400);
      }

      if (!['email', 'username', 'phoneNumber', 'sms'].includes(target.type)) {
        return createErrorResponse('target.type must be email, username, phoneNumber, or sms', 400);
      }

      acceptData = {
        type: target.type,
        value: sanitizeInput(target.value) || target.value
      };
    }

    const config = await getVortexConfig(request);
    const authenticatedUser = await authenticateRequest(request);

    if (config.canAcceptInvitations) {
      const hasAccess = await config.canAcceptInvitations(request, authenticatedUser, { invitationIds: sanitizedIds, target, user });
      if (!hasAccess) {
        return createErrorResponse('Access denied', 403);
      }
    } else if (!authenticatedUser) {
      return createErrorResponse('Access denied. Configure access control hooks for invitation endpoints.', 403);
    }

    const vortex = new Vortex(config.apiKey);
    const result = await vortex.acceptInvitations(sanitizedIds, acceptData);
    return createApiResponse(result);
  } catch (error) {
    console.error('Error in handleAcceptInvitations:', error);
    return createErrorResponse('An error occurred while processing your request', 500);
  }
}

export async function handleGetInvitationsByGroup(request: NextRequest, groupType: string, groupId: string) {
  try {
    if (request.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    const sanitizedGroupType = sanitizeInput(groupType);
    const sanitizedGroupId = sanitizeInput(groupId);

    if (!sanitizedGroupType || !sanitizedGroupId) {
      return createErrorResponse('Invalid group parameters', 400);
    }

    const config = await getVortexConfig(request);
    const user = await authenticateRequest(request);

    if (config.canAccessInvitationsByGroup) {
      const hasAccess = await config.canAccessInvitationsByGroup(request, user, {
        groupType: sanitizedGroupType,
        groupId: sanitizedGroupId
      });
      if (!hasAccess) {
        return createErrorResponse('Access denied', 403);
      }
    } else if (!user) {
      return createErrorResponse('Access denied. Configure access control hooks for invitation endpoints.', 403);
    }

    const vortex = new Vortex(config.apiKey);
    const invitations = await vortex.getInvitationsByGroup(sanitizedGroupType, sanitizedGroupId);
    return createApiResponse({ invitations });
  } catch (error) {
    console.error('Error in handleGetInvitationsByGroup:', error);
    return createErrorResponse('An error occurred while processing your request', 500);
  }
}

export async function handleDeleteInvitationsByGroup(request: NextRequest, groupType: string, groupId: string) {
  try {
    if (request.method !== 'DELETE') {
      return createErrorResponse('Method not allowed', 405);
    }

    const sanitizedGroupType = sanitizeInput(groupType);
    const sanitizedGroupId = sanitizeInput(groupId);

    if (!sanitizedGroupType || !sanitizedGroupId) {
      return createErrorResponse('Invalid group parameters', 400);
    }

    const config = await getVortexConfig(request);
    const user = await authenticateRequest(request);

    if (config.canDeleteInvitationsByGroup) {
      const hasAccess = await config.canDeleteInvitationsByGroup(request, user, {
        groupType: sanitizedGroupType,
        groupId: sanitizedGroupId
      });
      if (!hasAccess) {
        return createErrorResponse('Access denied', 403);
      }
    } else if (!user) {
      return createErrorResponse('Access denied. Configure access control hooks for invitation endpoints.', 403);
    }

    const vortex = new Vortex(config.apiKey);
    await vortex.deleteInvitationsByGroup(sanitizedGroupType, sanitizedGroupId);
    return createApiResponse({ success: true });
  } catch (error) {
    console.error('Error in handleDeleteInvitationsByGroup:', error);
    return createErrorResponse('An error occurred while processing your request', 500);
  }
}

export async function handleReinvite(request: NextRequest, invitationId: string) {
  try {
    if (request.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    const sanitizedId = sanitizeInput(invitationId);
    if (!sanitizedId) {
      return createErrorResponse('Invalid invitation ID', 400);
    }

    const config = await getVortexConfig(request);
    const user = await authenticateRequest(request);

    if (config.canReinvite) {
      const hasAccess = await config.canReinvite(request, user, { invitationId: sanitizedId });
      if (!hasAccess) {
        return createErrorResponse('Access denied', 403);
      }
    } else if (!user) {
      return createErrorResponse('Access denied. Configure access control hooks for invitation endpoints.', 403);
    }

    const vortex = new Vortex(config.apiKey);
    const invitation = await vortex.reinvite(sanitizedId);
    return createApiResponse(invitation);
  } catch (error) {
    console.error('Error in handleReinvite:', error);
    return createErrorResponse('An error occurred while processing your request', 500);
  }
}