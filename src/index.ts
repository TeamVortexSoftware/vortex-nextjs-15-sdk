export { configureVortex, configureVortexAsync, configureVortexLazy, getVortexConfig, authenticateRequest, createAllowAllAccessControl } from './config';
export type {
  VortexConfig,
  AuthenticatedUser,
  AccessControlHook,
  InvitationResource,
  InvitationTargetResource,
  GroupResource,
  InvitationAccessHook,
  InvitationTargetAccessHook,
  GroupAccessHook,
  BasicAccessHook,
  JwtContext,
} from './config';

export {
  createVortexJwtRoute,
  createVortexInvitationsRoute,
  createVortexInvitationRoute,
  createVortexInvitationsAcceptRoute,
  createVortexInvitationsByGroupRoute,
  createVortexReinviteRoute,
  createVortexRoutes,
  VORTEX_ROUTES,
  NEXTJS_FILE_STRUCTURE,
  createVortexApiPath,
} from './routes';

export {
  handleJwtGeneration,
} from './handlers/jwt';

export {
  handleGetInvitationsByTarget,
  handleGetInvitation,
  handleRevokeInvitation,
  handleAcceptInvitations,
  handleGetInvitationsByGroup,
  handleDeleteInvitationsByGroup,
  handleReinvite,
} from './handlers/invitations';

export {
  createApiResponse,
  createErrorResponse,
  parseRequestBody,
  getQueryParam,
  validateRequiredFields,
  sanitizeInput,
} from './utils';

export * from '@teamvortexsoftware/vortex-node-22-sdk';
