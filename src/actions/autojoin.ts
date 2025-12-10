'use server';

import {
  Vortex,
  AutojoinDomainsResponse,
  ConfigureAutojoinRequest,
} from '@teamvortexsoftware/vortex-node-22-sdk';
import { getVortexConfig } from '../config';

/**
 * Get autojoin domains configured for a specific scope
 *
 * This Server Action fetches the current autojoin domain configuration
 * for an organization, team, or other scope type.
 *
 * @param scopeType - The type of scope (e.g., "organization", "team", "project")
 * @param scope - The scope identifier (customer's group ID)
 * @returns Autojoin domains and associated invitation
 *
 * @example
 * ```typescript
 * import { getAutojoinDomains } from '@teamvortexsoftware/vortex-nextjs-15-sdk';
 *
 * // In a Server Component or Client Component
 * const result = await getAutojoinDomains('organization', 'acme-org');
 * console.log(result.autojoinDomains);
 * ```
 */
export async function getAutojoinDomains(
  scopeType: string,
  scope: string
): Promise<AutojoinDomainsResponse> {
  const config = await getVortexConfig();

  if (!config.apiKey) {
    throw new Error('Vortex API key not configured');
  }

  const vortex = new Vortex(config.apiKey);
  return vortex.getAutojoinDomains(scopeType, scope);
}

/**
 * Configure autojoin domains for a specific scope
 *
 * This Server Action syncs autojoin domains - it will add new domains,
 * remove domains not in the provided list, and deactivate the autojoin
 * invitation if all domains are removed (empty array).
 *
 * @param params - Configuration parameters
 * @param params.scope - The scope identifier (customer's group ID)
 * @param params.scopeType - The type of scope (e.g., "organization", "team")
 * @param params.scopeName - Optional display name for the scope
 * @param params.domains - Array of domains to configure for autojoin
 * @param params.widgetId - The widget configuration ID
 * @returns Updated autojoin domains and associated invitation
 *
 * @example
 * ```typescript
 * import { configureAutojoin } from '@teamvortexsoftware/vortex-nextjs-15-sdk';
 *
 * // In a Server Action or Client Component
 * const result = await configureAutojoin({
 *   scope: 'acme-org',
 *   scopeType: 'organization',
 *   scopeName: 'Acme Corporation',
 *   domains: ['acme.com', 'acme.org'],
 *   widgetId: 'widget-123',
 * });
 * ```
 */
export async function configureAutojoin(
  params: ConfigureAutojoinRequest
): Promise<AutojoinDomainsResponse> {
  const config = await getVortexConfig();

  if (!config.apiKey) {
    throw new Error('Vortex API key not configured');
  }

  // Validate required fields
  if (!params.scope || !params.scopeType) {
    throw new Error('scope and scopeType are required');
  }
  if (!params.domains) {
    throw new Error('domains array is required');
  }
  if (!params.widgetId) {
    throw new Error('widgetId is required');
  }

  const vortex = new Vortex(config.apiKey);
  return vortex.configureAutojoin(params);
}
