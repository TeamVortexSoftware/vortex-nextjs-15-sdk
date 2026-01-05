# Vortex Next.js 15 SDK

Drop-in Next.js integration for Vortex invitations and JWT functionality. Get up and running in under 2 minutes!

## 🚀 Quick Start

```bash
npm install @teamvortexsoftware/vortex-nextjs-15-sdk @teamvortexsoftware/vortex-react-provider
npx vortex-setup
```

That's it! The setup wizard creates all required files automatically.

## ⚡ What You Get

- **JWT Authentication**: Secure user authentication with Vortex
- **Invitation Management**: Create, accept, and manage invitations
- **Full Node.js SDK Access**: All `@teamvortexsoftware/vortex-node-22-sdk` functionality
- **TypeScript Support**: Fully typed with IntelliSense
- **React Integration**: Works seamlessly with `@teamvortexsoftware/vortex-react-provider`

## 📁 Generated Files

After running `npx vortex-setup`, you'll have:

```
app/api/vortex/
├── jwt/route.ts                                    # JWT generation
├── invitations/route.ts                            # Get invitations by target
├── invitations/accept/route.ts                     # Accept invitations
├── invitations/[invitationId]/route.ts            # Get/delete single invitation
├── invitations/[invitationId]/reinvite/route.ts   # Resend invitation
└── invitations/by-group/[groupType]/[groupId]/route.ts  # Group operations

lib/
└── vortex-config.ts                               # Your configuration
```

Each route file is just 3 lines:

```typescript
import '@/lib/vortex-config';
import { createVortexRoutes } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export const { GET, DELETE } = createVortexRoutes().invitation;
```

## ⚙️ Configuration

### 1. Environment Variables

Add to your `.env.local`:

```bash
VORTEX_API_KEY=your_api_key_here
```

### 2. App Layout

Import the config in your `app/layout.tsx`:

```typescript
import '../lib/vortex-config'; // Add this line

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <VortexProvider config={{ apiBaseUrl: '/api/vortex' }}>
          {children}
        </VortexProvider>
      </body>
    </html>
  );
}
```

### 3. Customize Configuration

Edit `lib/vortex-config.ts` to implement your authentication and access control:

#### New Format (Recommended)

```typescript
import {
  configureVortexLazy,
  createAllowAllAccessControl,
} from '@teamvortexsoftware/vortex-nextjs-15-sdk';

configureVortexLazy(async () => ({
  apiKey: process.env.VORTEX_API_KEY!,

  // Required: How to authenticate users (new format)
  authenticateUser: async (request) => {
    const user = await getCurrentUser(request); // Your auth logic
    return user
      ? {
          userId: user.id,
          userEmail: user.email,
          adminScopes: user.isAdmin ? ['autojoin'] : [], // Optional: grant admin capabilities
        }
      : null;
  },

  // Simple: Allow all operations (customize for production)
  ...createAllowAllAccessControl(),
}));
```

#### Legacy Format (Deprecated)

The legacy format is still supported for backward compatibility:

```typescript
configureVortexLazy(async () => ({
  apiKey: process.env.VORTEX_API_KEY!,

  // Legacy format (deprecated)
  authenticateUser: async (request) => {
    const user = await getCurrentUser(request);
    return user
      ? {
          userId: user.id,
          identifiers: [{ type: 'email', value: user.email }],
          groups: user.groups, // [{ type: 'team', groupId: '123', name: 'My Team' }]
          role: user.role,
        }
      : null;
  },

  ...createAllowAllAccessControl(),
}));
```

## 🔧 Production Security

For production apps, replace `createAllowAllAccessControl()` with proper authorization:

```typescript
configureVortexLazy(async () => ({
  apiKey: process.env.VORTEX_API_KEY!,
  authenticateUser: async (request) => {
    /* your auth */
  },

  // Custom access control
  canDeleteInvitation: async (request, user, resource) => {
    return user?.role === 'admin'; // Only admins can delete
  },

  canAccessInvitationsByGroup: async (request, user, resource) => {
    return user?.groups.some(
      (g) => g.type === resource?.groupType && g.groupId === resource?.groupId
    );
  },

  // ... other access control hooks
}));
```

## 📚 API Endpoints

Your app automatically gets these API routes:

| Endpoint                                       | Method     | Description                             |
| ---------------------------------------------- | ---------- | --------------------------------------- |
| `/api/vortex/jwt`                              | POST       | Generate JWT for authenticated user     |
| `/api/vortex/invitations`                      | GET        | Get invitations by target (email/phone) |
| `/api/vortex/invitations/accept`               | POST       | Accept multiple invitations             |
| `/api/vortex/invitations/[id]`                 | GET/DELETE | Get or delete specific invitation       |
| `/api/vortex/invitations/[id]/reinvite`        | POST       | Resend invitation                       |
| `/api/vortex/invitations/by-group/[type]/[id]` | GET/DELETE | Group-based operations                  |

## 🎯 Common Use Cases

### Frontend: Get User's JWT

```typescript
import { useVortexJWT } from '@teamvortexsoftware/vortex-react-provider';

function MyComponent() {
  const { jwt, isLoading } = useVortexJWT();

  if (isLoading) return <div>Loading...</div>;
  if (!jwt) return <div>Not authenticated</div>;

  return <div>Authenticated! JWT: {jwt.substring(0, 20)}...</div>;
}
```

### Frontend: Manage Invitations

```typescript
const { data: invitations } = useFetch('/api/vortex/invitations/by-group/team/my-team-id');

// Delete invitation
await fetch(`/api/vortex/invitations/${invitationId}`, { method: 'DELETE' });
```

### Backend: Direct SDK Usage

```typescript
import { Vortex } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

// All Node.js SDK functionality is available
const vortex = new Vortex(process.env.VORTEX_API_KEY!);
const invitations = await vortex.getInvitationsByGroup('team', 'team-123');
```

## 🛠️ Advanced: Custom Routes

Need custom logic? Create your own routes:

```typescript
// app/api/custom-invitation/route.ts
import '@/lib/vortex-config';
import { handleGetInvitation, createErrorResponse } from '@teamvortexsoftware/vortex-nextjs-15-sdk';

export async function GET(request: NextRequest) {
  // Add custom validation
  const user = await validateUser(request);
  if (!user.isAdmin) {
    return createErrorResponse('Admin required', 403);
  }

  // Use SDK handler
  return handleGetInvitation(request, 'invitation-id');
}
```

## 🆘 Troubleshooting

### Build Errors

If you see configuration errors during build:

- Make sure you're importing `'@/lib/vortex-config'` (or `'../lib/vortex-config'`) in your layout
- Check that your `.env.local` has `VORTEX_API_KEY`
- Ensure you're using lazy initialization (`configureVortexLazy`)

### Authentication Issues

- Verify your `authenticateUser` function returns the correct format
- Check that your authentication provider is working
- Make sure JWT requests include authentication cookies/headers

### TypeScript Errors

- All types are exported from the main package
- Resource parameters are fully typed for access control hooks
- Use the generated configuration template as a starting point

## 📦 What's Included

This SDK re-exports everything from `@teamvortexsoftware/vortex-node-22-sdk`, so you get:

- ✅ `Vortex` class for direct API access
- ✅ All invitation management methods
- ✅ JWT generation utilities
- ✅ TypeScript definitions
- ✅ Next.js optimized route handlers

## 🔗 Links

- [Node.js SDK Documentation](../vortex-node-22-sdk/README.md)
- [React Provider Documentation](../../packages/vortex-react-provider/README.md)
- [Example Implementation](../../apps/acmetasks)

---

**Need help?** Open an issue or check the example implementation in `apps/acmetasks`
