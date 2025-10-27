import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  userId: string;
  identifiers: { type: 'email' | 'sms'; value: string }[];
  groups: { type: string; id?: string; groupId?: string; name: string }[];
  role?: string;
  attributes?: Record<string, any>;
}

// Resource types for access control hooks
export interface InvitationResource {
  invitationId: string;
}

export interface InvitationTargetResource {
  invitationIds: string[];
  target: {
    type: string;
    value: string;
  };
}

export interface GroupResource {
  groupType: string;
  groupId: string;
}

// Generic access control hook
export interface AccessControlHook<T = any> {
  (request: NextRequest, user: AuthenticatedUser | null, resource?: T): Promise<boolean>;
}

// Specific hook types for better type safety
export interface InvitationAccessHook extends AccessControlHook<InvitationResource> {}
export interface InvitationTargetAccessHook extends AccessControlHook<InvitationTargetResource> {}
export interface GroupAccessHook extends AccessControlHook<GroupResource> {}
export interface BasicAccessHook extends AccessControlHook<void> {}

export interface JwtContext {
  widgetId?: string;
  groupId?: string;
  groupType?: string;
}

export interface VortexConfig {
  apiKey: string;
  apiBaseUrl?: string;
  authenticateUser?: (request: NextRequest) => Promise<AuthenticatedUser | null>;
  // Hook to generate JWT attributes based on invitation context (server-side)
  generateJwtAttributes?: (request: NextRequest, context?: JwtContext) => Promise<Record<string, any>>;
  // Access control hooks for invitation endpoints
  canAccessInvitationsByTarget?: BasicAccessHook;
  canAccessInvitation?: InvitationAccessHook;
  canDeleteInvitation?: InvitationAccessHook;
  canAcceptInvitations?: InvitationTargetAccessHook;
  canAccessInvitationsByGroup?: GroupAccessHook;
  canDeleteInvitationsByGroup?: GroupAccessHook;
  canReinvite?: InvitationAccessHook;
}

// Store configuration template (immutable after first set)
let configTemplate: VortexConfig | null = null;
let isConfigLocked = false;
let configPromise: Promise<void> | null = null;
let lazyConfigFactory: (() => Promise<VortexConfig>) | null = null;

export function configureVortex(config: VortexConfig): void {
  if (isConfigLocked && configTemplate) {
    throw new Error('Vortex configuration is already locked. Configuration can only be set once for security reasons.');
  }

  // Validate required config
  if (!config.apiKey && !process.env.VORTEX_API_KEY) {
    throw new Error('API key is required in config or VORTEX_API_KEY environment variable');
  }

  configTemplate = { ...config };
  isConfigLocked = true;
}

export function configureVortexAsync(configPromiseOrConfig: Promise<VortexConfig> | VortexConfig): void | Promise<void> {
  if (configPromiseOrConfig instanceof Promise) {
    configPromise = configPromiseOrConfig.then(config => {
      configureVortex(config);
    });
  } else {
    configureVortex(configPromiseOrConfig);
  }
}

export function configureVortexLazy(configFactory: () => Promise<VortexConfig>): void {
  if (isConfigLocked && configTemplate) {
    throw new Error('Vortex configuration is already locked. Configuration can only be set once for security reasons.');
  }
  lazyConfigFactory = configFactory;
}

export async function getVortexConfig(request?: NextRequest): Promise<VortexConfig> {
  // Initialize lazily if lazy factory is set and config hasn't been initialized
  if (lazyConfigFactory && !configTemplate && !configPromise) {
    // Lazy initializing Vortex configuration
    configPromise = lazyConfigFactory().then(config => {
      configureVortex(config);
    });
  }

  // Wait for async configuration to complete if it's in progress
  if (configPromise && !configTemplate) {
    await configPromise;
  }

  // Create a fresh config for each request
  const baseConfig: VortexConfig = {
    apiKey: configTemplate?.apiKey || process.env.VORTEX_API_KEY!,
    apiBaseUrl: configTemplate?.apiBaseUrl || process.env.VORTEX_API_BASE_URL,
  };
  
  if (!baseConfig.apiKey) {
    throw new Error('Vortex not configured. Call configureVortex() or set VORTEX_API_KEY environment variable');
  }

  // Copy hooks from template if they exist
  if (configTemplate) {
    return {
      ...baseConfig,
      authenticateUser: configTemplate.authenticateUser,
      generateJwtAttributes: configTemplate.generateJwtAttributes,
      canAccessInvitationsByTarget: configTemplate.canAccessInvitationsByTarget,
      canAccessInvitation: configTemplate.canAccessInvitation,
      canDeleteInvitation: configTemplate.canDeleteInvitation,
      canAcceptInvitations: configTemplate.canAcceptInvitations,
      canAccessInvitationsByGroup: configTemplate.canAccessInvitationsByGroup,
      canDeleteInvitationsByGroup: configTemplate.canDeleteInvitationsByGroup,
      canReinvite: configTemplate.canReinvite,
    };
  }

  return baseConfig;
}

// Helper function to authenticate user for any request
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const config = await getVortexConfig(request);

  if (!config.authenticateUser) {
    return null;
  }

  try {
    return await config.authenticateUser(request);
  } catch (error) {
    // Log error but don't expose details
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Creates a set of access control hooks that allow all operations.
 * Useful for demos, development, or when you want to handle authorization elsewhere.
 */
export function createAllowAllAccessControl() {
  const allowAll = async () => true;

  return {
    canAccessInvitationsByTarget: allowAll,
    canAccessInvitation: allowAll,
    canDeleteInvitation: allowAll,
    canAcceptInvitations: allowAll,
    canAccessInvitationsByGroup: allowAll,
    canDeleteInvitationsByGroup: allowAll,
    canReinvite: allowAll,
  } satisfies Partial<VortexConfig>;
}