# Vortex Next.js 15 SDK Implementation Guide


**Package:** `@teamvortexsoftware/vortex-nextjs-15-sdk`
**Depends on:** `@teamvortexsoftware/vortex-node-22-sdk`
**Requires:** Next.js 13.0.0+, Node.js 18.0.0+

## Prerequisites
From integration contract you need: API endpoint prefix, scope entity, authentication pattern
From discovery data you need: App/Pages Router, auth provider, database ORM, environment variable pattern

## Key Facts
- Full-stack SDK (Backend API Routes + Frontend React)
- Use `configureVortexLazy()` to avoid build errors
- CLI tool: `npx vortex-setup` generates all files
- Accept invitations requires custom database logic (must override)
- Install ONLY `@teamvortexsoftware/vortex-react` for frontend (NOT vortex-react-provider)
- Self-closing component: `<VortexInvite />` must be self-closing

---

## Step 1: Install

```bash
npm install @teamvortexsoftware/vortex-nextjs-15-sdk @teamvortexsoftware/vortex-react
# or
pnpm add @teamvortexsoftware/vortex-nextjs-15-sdk @teamvortexsoftware/vortex-react
```

---

## Step 2: Set Environment Variable

Add to `.env.local`:

```bash
VORTEX_API_KEY=VRTX.your-api-key-here.secret
```

**Never commit API key to version control.**

---

## Step 3: Run Automatic Setup (Recommended)

```bash
npx vortex-setup
```

This creates:
- `lib/vortex-config.ts`
- `app/api/vortex/jwt/route.ts`
- `app/api/vortex/invitations/route.ts`
- `app/api/vortex/invitations/[invitationId]/route.ts`
- `app/api/vortex/invitations/accept/route.ts`
- `app/api/vortex/invitations/[invitationId]/reinvite/route.ts`
- `app/api/vortex/invitations/by-group/[groupType]/[groupId]/route.ts`

**Skip to Step 5 if you used `npx vortex-setup`**

---

## Step 4: Manual Setup - Create Configuration and Routes

### `lib/vortex-config.ts`

```typescript
import { configureVortexLazy, createAllowAllAccessControl } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

configureVortexLazy(async () => ({
  apiKey: process.env.VORTEX_API_KEY!,

  authenticateUser: async (request) => {
    // NextAuth example:
    // const session = await getServerSession(authOptions);
    // if (!session?.user) return null;
    // return {
    //   userId: session.user.id,
    //   userEmail: session.user.email,
    //   adminScopes: session.user.role === 'admin' ? ['autojoin'] : undefined
    // };

    // Clerk example:
    // const { userId } = auth();
    // if (!userId) return null;
    // const user = await currentUser();
    // return {
    //   userId: user.id,
    //   userEmail: user.emailAddresses[0]?.emailAddress,
    //   adminScopes: user.publicMetadata.isAdmin ? ['autojoin'] : undefined
    // };

    // Custom session example:
    // const user = await getUserFromRequest(request);
    // if (!user) return null;
    // return {
    //   userId: user.id,
    //   userEmail: user.email,
    //   adminScopes: user.isAdmin ? ['autojoin'] : undefined
    // };

    return null; // Adapt to your auth
  },

  ...createAllowAllAccessControl(),
}));
```

**Adapt to their patterns:**
- Match their auth provider (NextAuth, Clerk, custom)
- Match their user ID/email extraction pattern
- Match their admin role detection

### Create Route Files

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

---

## Step 5: Override Accept Invitations with Database Logic (CRITICAL)

```typescript
// app/api/vortex/invitations/accept/route.ts
import '@/lib/vortex-config';
import { NextRequest } from 'next/server';
import { VortexClient } from '@teamvortexsoftware/vortex-node-22-sdk';
import { authenticateRequest, createErrorResponse } from '@teamvortexsoftware/vortex-nextjs-15-sdk';
import { db } from '@/lib/db'; // Your database client

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // 2. Parse request
    const { invitationIds, user } = await request.json();

    // 3. Accept via Vortex API
    const vortex = new VortexClient(process.env.VORTEX_API_KEY!);
    const results = await vortex.acceptInvitations(invitationIds, user);

    // 4. Add to database - adapt to your ORM
    // Prisma example:
    for (const result of results) {
      for (const group of result.groups) {
        await db.workspaceMember.create({
          data: {
            userId: user.userId,
            workspaceId: group.groupId, // Adapt field names
            role: 'member',
            joinedAt: new Date(),
          },
        });
      }
    }

    // Drizzle example:
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

    // Raw SQL example:
    // for (const result of results) {
    //   for (const group of result.groups) {
    //     await db.execute(
    //       'INSERT INTO workspace_members (user_id, workspace_id, role, joined_at) VALUES ($1, $2, $3, $4)',
    //       [user.userId, group.groupId, 'member', new Date()]
    //     );
    //   }
    // }

    return Response.json(results);
  } catch (error) {
    console.error('Failed to accept invitations:', error);
    return createErrorResponse('Failed to accept invitations', 500);
  }
}
```

**Critical - Adapt database logic:**
- Use their actual table/model names (from discovery)
- Use their actual field names
- Use their ORM pattern (Prisma, Drizzle, TypeORM, Kysely, raw SQL)
- Handle duplicate memberships if needed

---

## Step 6: Create JWT Fetching Hook

Create `hooks/useVortexJwt.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useVortexJwt(componentId: string) {
  const [jwt, setJwt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchJwt = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/vortex/jwt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentId }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch JWT');
        }

        const data = await response.json();
        setJwt(data.jwt);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchJwt();
  }, [componentId]);

  return { jwt, isLoading, error };
}
```

---

## Step 7: Use Vortex Widget in Components

### App Router Example

```typescript
'use client';

import { VortexInvite } from '@teamvortexsoftware/vortex-react';
import { useVortexJwt } from '@/hooks/useVortexJwt';

export function InviteMembersModal({ workspace }: { workspace: { id: string } }) {
  const { jwt, isLoading } = useVortexJwt('workspace-invite');

  if (!jwt && !isLoading) {
    return <div>Failed to authenticate</div>;
  }

  return (
    <VortexInvite
      componentId="workspace-invite"
      jwt={jwt}
      isLoading={isLoading}
      scope={workspace.id}
      scopeType="workspace"
      onInvite={(data) => console.log('Invite sent:', data)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

**IMPORTANT:** Do NOT specify `apiHost` prop - uses default `https://api.vortexsoftware.com`. Only set if using custom Vortex deployment.

### Pages Router Example

```typescript
import { VortexInvite } from '@teamvortexsoftware/vortex-react';
import { useRouter } from 'next/router';
import { useVortexJwt } from '@/hooks/useVortexJwt';

export default function TeamPage() {
  const router = useRouter();
  const { teamId } = router.query;
  const { jwt, isLoading } = useVortexJwt('team-invite');

  return (
    <VortexInvite
      componentId="team-invite"
      jwt={jwt}
      isLoading={isLoading}
      scope={teamId as string}
      scopeType="team"
      onInvite={(data) => console.log('Sent:', data)}
    />
  );
}
```

---

## Step 8: Build and Test

```bash
# Build
npm run build

# Start
npm run dev

# Test JWT endpoint
curl -X POST http://localhost:3000/api/vortex/jwt \
  -H "Cookie: your-session-cookie"
```

Expected response:
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Common Errors

**"Vortex not configured" during build** → Use `configureVortexLazy()` instead of `configureVortex()`

**Route handlers not found (404)** → Ensure file paths match exactly:
```
app/api/vortex/jwt/route.ts               ✅
app/api/vortex/jwt.ts                     ❌
```

**"Cannot find module '@/lib/vortex-config'"** → Check tsconfig paths or use relative import

**Authentication always returns null** → Verify auth provider configured and user authenticated

**"Hooks can only be called inside function component"** → Add `'use client'` directive

**User not added to database** → Must override accept endpoint with custom DB logic (see Step 5)

---

## After Implementation Report

List files created/modified:
- Configuration: lib/vortex-config.ts
- API Routes: app/api/vortex/**/route.ts (7 files)
- Hook: hooks/useVortexJwt.ts
- Components: [component files with VortexInvite]
- Database: Accept endpoint creates memberships in [table name]

Confirm:
- `configureVortexLazy()` called before routes
- All API route files created in app/api/vortex/
- Accept invitations endpoint overridden with DB logic
- JWT endpoint returns valid JWT
- Frontend components can fetch JWT and render widget
- Build succeeds with `npm run build`

## Endpoints Registered

All endpoints at `/api/vortex`:
- `POST /jwt` - Generate JWT for authenticated user
- `GET /invitations` - Get invitations by target
- `GET /invitations/:id` - Get invitation by ID
- `POST /invitations/accept` - Accept invitations (custom DB logic)
- `DELETE /invitations/:id` - Revoke invitation
- `POST /invitations/:id/reinvite` - Resend invitation
- `GET /invitations/by-group/:type/:id` - Get group invitations
- `DELETE /invitations/by-group/:type/:id` - Delete group invitations
