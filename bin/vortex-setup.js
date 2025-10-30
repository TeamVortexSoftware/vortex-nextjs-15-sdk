#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VORTEX_ROUTES = [
  'jwt/route.ts',
  'invitations/route.ts',
  'invitations/[invitationId]/route.ts',
  'invitations/accept/route.ts',
  'invitations/by-group/[groupType]/[groupId]/route.ts',
  'invitations/[invitationId]/reinvite/route.ts'
];

function createRouteTemplates(baseDir) {
  const configImport = baseDir ? '@/lib/vortex-config' : '@/lib/vortex-config';

  return {
    'jwt/route.ts': `import '${configImport}';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().jwt;
`,

    'invitations/route.ts': `import '${configImport}';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET } = createVortexRoutes().invitations;
`,

    'invitations/[invitationId]/route.ts': `import '${configImport}';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET, DELETE } = createVortexRoutes().invitation;
`,

    'invitations/accept/route.ts': `import '${configImport}';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().invitationsAccept;
`,

    'invitations/by-group/[groupType]/[groupId]/route.ts': `import '${configImport}';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET, DELETE } = createVortexRoutes().invitationsByGroup;
`,

    'invitations/[invitationId]/reinvite/route.ts': `import '${configImport}';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().invitationReinvite;
`
  };
}

const CONFIG_TEMPLATE = `import {
  configureVortexLazy,
  createAllowAllAccessControl,
  type VortexConfig,
} from '@teamvortexsoftware/vortex-nextjs-15-sdk';

// Configure Vortex with lazy initialization - only runs when first API call is made
configureVortexLazy(async (): Promise<VortexConfig> => {
  return {
    apiKey: process.env.VORTEX_API_KEY!,

    // Required: How to authenticate users for JWT generation
    authenticateUser: async (request) => {
      // TODO: Replace this with your authentication logic
      //
      // Examples:
      // - NextAuth.js: const session = await getServerSession(request, authOptions);
      // - Supabase: const { data: { user } } = await supabase.auth.getUser();
      // - Custom JWT: const user = await verifyJwtToken(request);
      //
      // Expected return format:
      // return {
      //   userId: user.id,
      //   identifiers: [{ type: 'email', value: user.email }],
      //   groups: [{ type: 'team', id: 'team-123', name: 'My Team' }],
      // };

      throw new Error('TODO: Implement authenticateUser in lib/vortex-config.ts');
    },

    // Simple access control - allows all operations (customize for production)
    ...createAllowAllAccessControl(),

    // For production, replace createAllowAllAccessControl() with custom logic:
    // canDeleteInvitation: async (request, user, resource) => {
    //   return user?.role === 'admin';
    // },
    // canAccessInvitationsByGroup: async (request, user, resource) => {
    //   return user?.groups.some(g =>
    //     g.type === resource?.groupType && g.id === resource?.groupId
    //   );
    // },
    // ... other access control hooks
  };
});
`;

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

function writeFileIfNotExists(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(`⚠ File already exists, skipping: ${filePath}`);
    return false;
  }

  fs.writeFileSync(filePath, content);
  console.log(`✓ Created file: ${filePath}`);
  return true;
}

function main() {
  console.log('🚀 Setting up Vortex Next.js 15 SDK...\n');

  // Check if we're in a Next.js project
  if (!fs.existsSync('next.config.js') && !fs.existsSync('next.config.ts') && !fs.existsSync('next.config.mjs')) {
    console.error('❌ This doesn\'t appear to be a Next.js project. Make sure you\'re in the root directory.');
    process.exit(1);
  }

  // Check for app directory - support both root app/ and src/app/
  let baseDir = '';
  if (fs.existsSync('app')) {
    baseDir = '';
    console.log('✓ Found app directory at project root');
  } else if (fs.existsSync('src/app')) {
    baseDir = 'src';
    console.log('✓ Found app directory in src/');
  } else {
    console.error('❌ This setup requires Next.js App Router. Please ensure you have an "app" or "src/app" directory.');
    process.exit(1);
  }

  let filesCreated = 0;

  // Create API routes
  const apiDir = path.join(baseDir, 'app', 'api', 'vortex');
  createDirectory(apiDir);

  const routeTemplates = createRouteTemplates(baseDir);

  VORTEX_ROUTES.forEach(route => {
    const filePath = path.join(apiDir, route);
    const dirPath = path.dirname(filePath);

    createDirectory(dirPath);

    if (writeFileIfNotExists(filePath, routeTemplates[route])) {
      filesCreated++;
    }
  });

  // Create lib directory and config file
  const libDir = baseDir ? path.join(baseDir, 'lib') : 'lib';
  createDirectory(libDir);
  const configPath = path.join(libDir, 'vortex-config.ts');

  if (writeFileIfNotExists(configPath, CONFIG_TEMPLATE)) {
    filesCreated++;
  }

  console.log(`\n🎉 Setup complete! Created ${filesCreated} new files.`);
  console.log('\n📋 Next steps:');
  console.log('1. Add your VORTEX_API_KEY to .env.local:');
  console.log('   VORTEX_API_KEY=your_api_key_here');

  const layoutPath = baseDir ? `${baseDir}/app/layout.tsx` : 'app/layout.tsx';
  const configImportPath = baseDir ? '../lib/vortex-config' : '../lib/vortex-config';
  const configFilePath = baseDir ? `${baseDir}/lib/vortex-config.ts` : 'lib/vortex-config.ts';

  console.log(`2. Import the config in your ${layoutPath}:`);
  console.log(`   import '${configImportPath}';`);
  console.log(`3. Implement the authenticateUser function in ${configFilePath}`);
  console.log('4. Wrap your app in VortexProvider:');
  console.log('   <VortexProvider config={{ apiBaseUrl: \'/api/vortex\' }}>');

  console.log('\n✨ Features:');
  console.log('• Super simple - each route is just 3 lines!');
  console.log('• Lazy initialization - no database calls during build');
  console.log('• createAllowAllAccessControl() for easy development');
  console.log('• Full TypeScript support with IntelliSense');

  console.log('\n📚 See the README for examples and customization options.');
}

if (require.main === module) {
  main();
}

module.exports = { main };