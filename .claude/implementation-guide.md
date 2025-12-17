# Vortex Next.js 15 SDK Integration Guide

This guide provides step-by-step instructions for integrating Vortex into a Next.js 15 application using the Next.js SDK. This SDK is unique as it handles **both backend (API routes) and frontend (React components)** integration.

## SDK Information

- **Package**: `@teamvortexsoftware/vortex-nextjs-15-sdk`
- **Depends on**: `@teamvortexsoftware/vortex-node-22-sdk`
- **Requires**: Next.js 13.0.0+, Node.js 18.0.0+
- **Type**: Full-stack SDK (Backend API Routes + Frontend React Provider)
- **CLI Tool**: `npx vortex-setup` for automatic file generation

## Expected Input Context

This guide expects to receive the following context from the orchestrator:

### Integration Contract
```yaml
Integration Contract:
  API Endpoints:
    Prefix: /api/vortex
    JWT: POST {prefix}/jwt
    Get Invitations: GET {prefix}/invitations
    Get Invitation: GET {prefix}/invitations/:id
    Accept Invitations: POST {prefix}/invitations/accept
  Scope:
    Entity: "workspace"
    Type: "workspace"
    ID Field: "workspace.id"
  File Paths:
    Backend:
      Vortex Config: lib/vortex-config.ts
      API Routes: app/api/vortex/**/route.ts
      Layout: app/layout.tsx
    Frontend:
      Components: components/ or app/
      Vortex Widget Usage: Where users will send invitations
  Authentication:
    Pattern: "NextAuth" | "Clerk" | "Custom Session" | "JWT"
    User Extraction: Custom per auth provider
  Database:
    ORM: "Prisma" | "Drizzle" | "TypeORM" | "Kysely" | "Raw SQL"
    User Model: User model
    Membership Model: WorkspaceMember model (or equivalent)
```

### Discovery Data
- Backend technology stack (Next.js version, App Router vs Pages Router)
- Frontend framework (React Server Components, Client Components)
- Authentication provider in use
- Database ORM/library
- Existing API route structure
- Environment variable management

## Implementation Overview

The Next.js SDK provides:

1. **Backend API Routes**: File-based routing with pre-built handlers
2. **Frontend React Provider**: `VortexProvider` from `@teamvortexsoftware/vortex-react-provider`
3. **Automatic Setup**: `npx vortex-setup` CLI tool
4. **Full-Stack Integration**: Seamless backend-frontend communication

## Critical Next.js SDK Specifics

### Key Patterns
- **File-Based Routing**: Create route files in `app/api/vortex/`
- **Lazy Configuration**: Use `configureVortexLazy()` to avoid build errors
- **App Router**: Next.js 13+ App Router with Server/Client Components
- **Route Handlers**: Export named HTTP methods (GET, POST, DELETE)
- **Request/Response**: Uses Next.js `NextRequest` and `NextResponse`
- **Setup CLI**: `npx vortex-setup` generates all required files

### Basic Pattern
```typescript
// lib/vortex-config.ts
import { configureVortexLazy, createAllowAllAccessControl } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

configureVortexLazy(async () => ({
  apiKey: process.env.VORTEX_API_KEY!,
  authenticateUser: async (request) => {
    const user = await getCurrentUser(request);
    return user ? {
      userId: user.id,
      userEmail: user.email,
      adminScopes: user.isAdmin ? ['autojoin'] : undefined
    } : null;
  },
  ...createAllowAllAccessControl(),
}));

// app/api/vortex/jwt/route.ts
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().jwt;
```

## Step-by-Step Implementation

### Step 1: Install SDK and Dependencies

```bash
npm install @teamvortexsoftware/vortex-nextjs-15-sdk @teamvortexsoftware/vortex-react-provider
# or
yarn add @teamvortexsoftware/vortex-nextjs-15-sdk @teamvortexsoftware/vortex-react-provider
# or
pnpm add @teamvortexsoftware/vortex-nextjs-15-sdk @teamvortexsoftware/vortex-react-provider
```

### Step 2: Run Automatic Setup (Recommended)

The SDK includes a CLI tool that generates all required files:

```bash
npx vortex-setup
```

This creates:
- `lib/vortex-config.ts` - Your configuration file
- `app/api/vortex/jwt/route.ts` - JWT generation endpoint
- `app/api/vortex/invitations/route.ts` - Get invitations endpoint
- `app/api/vortex/invitations/[invitationId]/route.ts` - Get/delete invitation
- `app/api/vortex/invitations/accept/route.ts` - Accept invitations
- `app/api/vortex/invitations/[invitationId]/reinvite/route.ts` - Reinvite endpoint
- `app/api/vortex/invitations/by-group/[groupType]/[groupId]/route.ts` - Group operations

**Skip to Step 6 if you used `npx vortex-setup`**

### Step 3: Manual Setup - Environment Variables

Add to your `.env.local` file:

```bash
VORTEX_API_KEY=VRTX.your-api-key-here.secret
```

**IMPORTANT**: Never commit your API key to version control.

### Step 4: Manual Setup - Create Configuration File

Create `lib/vortex-config.ts`:

```typescript
import {
  configureVortexLazy,
  createAllowAllAccessControl,
} from '@teamvortexsoftware/vortex-nextjs-15-sdk';

// Use configureVortexLazy to avoid build-time errors
configureVortexLazy(async () => ({
  apiKey: process.env.VORTEX_API_KEY!,

  // Required: Extract authenticated user from request
  authenticateUser: async (request) => {
    // Adjust based on your authentication provider

    // Example with NextAuth:
    // const session = await getServerSession(authOptions);
    // if (!session?.user) return null;
    // return {
    //   userId: session.user.id,
    //   userEmail: session.user.email,
    //   adminScopes: session.user.role === 'admin' ? ['autojoin'] : undefined
    // };

    // Example with Clerk:
    // const { userId } = auth();
    // if (!userId) return null;
    // const user = await currentUser();
    // return {
    //   userId: user.id,
    //   userEmail: user.emailAddresses[0]?.emailAddress,
    //   adminScopes: user.publicMetadata.isAdmin ? ['autojoin'] : undefined
    // };

    // Example with custom session:
    // const user = await getUserFromRequest(request);
    // if (!user) return null;
    // return {
    //   userId: user.id,
    //   userEmail: user.email,
    //   adminScopes: user.isAdmin ? ['autojoin'] : undefined
    // };

    // Placeholder - implement your auth logic
    return null;
  },

  // Optional: Access control (use createAllowAllAccessControl() for development)
  ...createAllowAllAccessControl(),

  // Or implement custom access control:
  // canDeleteInvitation: async (request, user, resource) => {
  //   return user?.adminScopes?.includes('autojoin') || false;
  // },
  // canAcceptInvitations: async (request, user, resource) => {
  //   return user !== null;
  // },
  // ... other hooks
}));
```

### Step 5: Manual Setup - Create API Route Files

Create these files in `app/api/vortex/`:

#### `app/api/vortex/jwt/route.ts`

```typescript
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().jwt;
```

#### `app/api/vortex/invitations/route.ts`

```typescript
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET } = createVortexRoutes().invitations;
```

#### `app/api/vortex/invitations/[invitationId]/route.ts`

```typescript
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET, DELETE } = createVortexRoutes().invitation;
```

#### `app/api/vortex/invitations/accept/route.ts`

```typescript
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().invitationsAccept;
```

#### `app/api/vortex/invitations/[invitationId]/reinvite/route.ts`

```typescript
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().invitationReinvite;
```

#### `app/api/vortex/invitations/by-group/[groupType]/[groupId]/route.ts`

```typescript
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET, DELETE } = createVortexRoutes().invitationsByGroup;
```

### Step 6: Implement Accept Invitations with Database Logic (CRITICAL)

The accept invitations endpoint requires custom business logic to add users to your database. Override the default:

```typescript
// app/api/vortex/invitations/accept/route.ts
import '@/lib/vortex-config';
import { NextRequest } from 'next/server';
import { VortexClient } from '@teamvortexsoftware/vortex-node-22-sdk';
import { authenticateRequest, createErrorResponse } from '@teamvortexsoftware/vortex-nextjs-15-sdk';
import { db } from '@/lib/db'; // Your database client

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // 2. Parse request body
    const body = await request.json();
    const { invitationIds, target } = body;

    // 3. Accept invitations via Vortex API
    const vortex = new VortexClient(process.env.VORTEX_API_KEY!);
    const results = await vortex.acceptInvitations(invitationIds, target);

    // 4. Add user to your database for each group
    // CRITICAL: Adjust based on your database ORM

    // Example with Prisma:
    for (const result of results) {
      for (const group of result.groups) {
        await db.workspaceMember.create({
          data: {
            userId: user.userId,
            workspaceId: group.groupId, // Customer's group ID
            role: 'member',
            joinedAt: new Date(),
          },
        });
      }
    }

    // Example with Drizzle:
    // for (const result of results) {
    //   for (const group of result.groups) {
    //     await db.insert(workspaceMembers).values({
    //       userId: user.userId,
    //       workspaceId: group.groupId,
    //       role: 'member',
    //       joinedAt: new Date(),
    //     });
    //   }
    // }

    // Example with Raw SQL:
    // for (const result of results) {
    //   for (const group of result.groups) {
    //     await db.execute(
    //       'INSERT INTO workspace_members (user_id, workspace_id, role, joined_at) VALUES ($1, $2, $3, $4)',
    //       [user.userId, group.groupId, 'member', new Date()]
    //     );
    //   }
    // }

    // 5. Return success
    return Response.json(results);
  } catch (error) {
    console.error('Failed to accept invitations:', error);
    return createErrorResponse('Failed to accept invitations', 500);
  }
}
```

### Step 7: Set Up Frontend - Add VortexProvider

Update your root layout to include the `VortexProvider`:

#### `app/layout.tsx`

```typescript
import './globals.css';
import '@/lib/vortex-config'; // Import config at app startup
import { VortexProvider } from '@teamvortexsoftware/vortex-react-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <VortexProvider config={{ apiBaseUrl: '/api/vortex' }}>
          {children}
        </VortexProvider>
      </body>
    </html>
  );
}
```

### Step 8: Frontend - Use Vortex in Components

Now you can use Vortex hooks and components in your React components:

#### Example: Display JWT

```typescript
'use client';

import { useVortexJWT } from '@teamvortexsoftware/vortex-react-provider';

export function VortexStatus() {
  const { jwt, isLoading, error } = useVortexJWT();

  if (isLoading) return <div>Loading JWT...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!jwt) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Authenticated!</p>
      <p>JWT: {jwt.substring(0, 20)}...</p>
    </div>
  );
}
```

#### Example: Send Invitations

```typescript
'use client';

import { VortexInvite } from '@teamvortexsoftware/vortex-react';
import { useVortexJWT } from '@teamvortexsoftware/vortex-react-provider';

export function InviteMembersModal({ workspace }: { workspace: { id: string; name: string } }) {
  const { jwt, isLoading } = useVortexJWT();

  if (isLoading || !jwt) return null;

  return (
    <VortexInvite
      componentId="workspace-invite"
      jwt={jwt}
      scope={workspace.id}
      scopeType="workspace"
      isLoading={false}
      onInvite={(data) => {
        console.log('Invitation sent:', data);
        // Handle success (e.g., show toast, refresh data)
      }}
      onError={(error) => {
        console.error('Invitation error:', error);
        // Handle error (e.g., show error message)
      }}
    />
  );
}
```

#### Example: Manage Invitations

```typescript
'use client';

import { useState, useEffect } from 'react';

export function InvitationsList({ workspaceId }: { workspaceId: string }) {
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    fetch(`/api/vortex/invitations/by-group/workspace/${workspaceId}`)
      .then((res) => res.json())
      .then((data) => setInvitations(data.invitations));
  }, [workspaceId]);

  const handleRevoke = async (invitationId: string) => {
    await fetch(`/api/vortex/invitations/${invitationId}`, {
      method: 'DELETE',
    });
    // Refresh list
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  };

  return (
    <div>
      <h2>Pending Invitations</h2>
      {invitations.map((invitation) => (
        <div key={invitation.id}>
          <span>{invitation.target[0]?.value}</span>
          <button onClick={() => handleRevoke(invitation.id)}>Revoke</button>
        </div>
      ))}
    </div>
  );
}
```

### Step 9: Add CORS Configuration (If Needed - Usually Not Required)

Next.js API routes typically don't require CORS configuration when frontend and backend are on the same domain. Only add if needed:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/vortex')) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  return NextResponse.next();
}
```

## Build and Validation

### Build Your Application

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Test the Integration

Start your development server and test:

```bash
npm run dev

# Test JWT endpoint
curl -X POST http://localhost:3000/api/vortex/jwt \
  -H "Cookie: your-session-cookie"

# Test get invitations
curl -X GET "http://localhost:3000/api/vortex/invitations?targetType=email&targetValue=user@example.com" \
  -H "Cookie: your-session-cookie"

# Test accept invitations
curl -X POST http://localhost:3000/api/vortex/invitations/accept \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{
    "invitationIds": ["invitation-id-1"],
    "target": { "type": "email", "value": "user@example.com" }
  }'
```

### Validation Checklist

- [ ] SDK and React provider installed
- [ ] Environment variable `VORTEX_API_KEY` is set
- [ ] `lib/vortex-config.ts` configured with authenticateUser
- [ ] All API route files created in `app/api/vortex/`
- [ ] VortexProvider added to root layout
- [ ] Config imported in layout (`import '@/lib/vortex-config'`)
- [ ] Accept invitations endpoint adds users to database
- [ ] Frontend components can fetch JWT
- [ ] Vortex widget renders and sends invitations
- [ ] Application builds without errors

## Implementation Report

After completing the integration, provide this summary:

```markdown
## Next.js SDK Integration Complete

### Files Modified/Created

**Backend (API Routes):**
- `lib/vortex-config.ts` - Vortex configuration with authenticateUser
- `app/api/vortex/jwt/route.ts` - JWT generation endpoint
- `app/api/vortex/invitations/route.ts` - Get invitations endpoint
- `app/api/vortex/invitations/[invitationId]/route.ts` - Get/delete invitation
- `app/api/vortex/invitations/accept/route.ts` - Accept invitations (custom logic)
- `app/api/vortex/invitations/[invitationId]/reinvite/route.ts` - Reinvite endpoint
- `app/api/vortex/invitations/by-group/[groupType]/[groupId]/route.ts` - Group operations

**Frontend (React Components):**
- `app/layout.tsx` - Added VortexProvider and config import
- `components/InviteMembersModal.tsx` - Vortex invitation widget
- `components/InvitationsList.tsx` - Manage invitations UI

### Endpoints Registered
- POST /api/vortex/jwt - Generate JWT for authenticated user
- GET /api/vortex/invitations - Get invitations by target
- GET /api/vortex/invitations/:id - Get invitation by ID
- POST /api/vortex/invitations/accept - Accept invitations (custom logic)
- DELETE /api/vortex/invitations/:id - Revoke invitation
- POST /api/vortex/invitations/:id/reinvite - Resend invitation
- GET /api/vortex/invitations/by-group/:type/:id - Get invitations for group
- DELETE /api/vortex/invitations/by-group/:type/:id - Delete invitations for group

### Database Integration
- ORM: [Prisma/Drizzle/TypeORM/etc.]
- Accept invitations adds users to: [workspace_members table]
- Group association field: [workspaceId/teamId/etc.]

### Authentication
- Provider: [NextAuth/Clerk/Custom]
- User extraction: [session/auth()/custom function]
- Admin scope detection: [role field/custom logic]

### Frontend Integration
- VortexProvider configured at root layout
- JWT fetched automatically via useVortexJWT hook
- Invitation widget integrated in workspace settings
- Invitation management UI created

### Next Steps
The full-stack integration is complete:
1. Users can send invitations via the Vortex widget
2. Invitations are accepted via POST /api/vortex/invitations/accept
3. Database automatically updated with new members
4. Admin UI displays and manages pending invitations
```

## Common Issues and Solutions

### Issue: "Vortex not configured" error during build
**Solution**: Use `configureVortexLazy()` instead of `configureVortex()`:
```typescript
configureVortexLazy(async () => ({ /* config */ }));
```

### Issue: Route handlers not found (404)
**Solution**: Ensure file paths exactly match the structure:
```
app/api/vortex/jwt/route.ts               ✅
app/api/vortex/jwt.ts                     ❌
```

### Issue: "Cannot find module '@/lib/vortex-config'"
**Solution**: Ensure the import path matches your tsconfig paths:
```typescript
import '@/lib/vortex-config';  // If using @ alias
import '../../../lib/vortex-config';  // Or relative path
```

### Issue: Authentication always returns null
**Solution**: Verify your auth provider is configured and the user is authenticated before calling Vortex endpoints.

### Issue: "Hooks can only be called inside the body of a function component"
**Solution**: Mark components using hooks with `'use client'`:
```typescript
'use client';

import { useVortexJWT } from '@teamvortexsoftware/vortex-react-provider';
```

### Issue: Accept invitations succeeds but user not added to database
**Solution**: Override the accept invitations route with custom database logic (see Step 6).

### Issue: VortexProvider context not available
**Solution**: Ensure VortexProvider wraps your components in the layout:
```typescript
<VortexProvider config={{ apiBaseUrl: '/api/vortex' }}>
  {children}
</VortexProvider>
```

## Best Practices

### 1. Environment Variables
Use Next.js environment variable conventions:
```bash
# .env.local
VORTEX_API_KEY=VRTX.your-key.secret

# .env.production
VORTEX_API_KEY=${VORTEX_API_KEY}
```

### 2. Error Handling
Use Next.js error boundaries:
```typescript
// app/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### 3. Loading States
Use React Suspense for better UX:
```typescript
import { Suspense } from 'react';

<Suspense fallback={<LoadingSpinner />}>
  <VortexInvite {...props} />
</Suspense>
```

### 4. Type Safety
Use TypeScript for all Vortex components:
```typescript
import type { InvitationResult } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

const [invitations, setInvitations] = useState<InvitationResult[]>([]);
```

### 5. Database Transactions
Use transactions for accept invitations:
```typescript
// Prisma example
await db.$transaction(async (tx) => {
  for (const group of result.groups) {
    await tx.workspaceMember.create({
      data: { userId: user.userId, workspaceId: group.groupId, role: 'member' }
    });
  }
});
```

### 6. Server Components vs Client Components
- Use Server Components for data fetching
- Use Client Components for interactive UI
- Mark client components with `'use client'`

### 7. API Route Organization
Keep API routes clean and focused:
```typescript
// Good: Simple route file
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { POST } = createVortexRoutes().jwt;

// Bad: Complex logic in route file ❌
```

## Additional Resources

- [Next.js SDK Documentation](https://docs.vortexsoftware.com/sdks/nextjs-15)
- [Node.js SDK Documentation](https://docs.vortexsoftware.com/sdks/node-22)
- [React Provider Documentation](https://docs.vortexsoftware.com/react-provider)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Vortex API Reference](https://api.vortexsoftware.com/api)

## Support

For questions or issues:
- GitHub Issues: https://github.com/teamvortexsoftware/vortex-nextjs-15-sdk/issues
- Email: support@vortexsoftware.com
- Documentation: https://docs.vortexsoftware.com
