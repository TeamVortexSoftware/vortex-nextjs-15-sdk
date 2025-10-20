# Vortex Configuration Guide

This guide explains how to properly configure the Vortex Next.js SDK in your application.

## When and Where to Configure

The `configureVortex()` function needs to be called **before** any Vortex API endpoints are accessed. Here are the recommended approaches:

### Option 1: Global Configuration (Recommended)

Create a configuration file that runs during app initialization:

**File:** `lib/vortex-config.ts`
```typescript
import { configureVortex, type AuthenticatedUser } from '@teamvortexsoftware/vortex-nextjs-15-sdk';
import { NextRequest } from 'next/server';

// This configuration will be applied globally to all Vortex endpoints
configureVortex({
  apiKey: process.env.VORTEX_API_KEY!,
  apiBaseUrl: process.env.VORTEX_API_BASE_URL, // optional
  authenticateUser: async (request: NextRequest): Promise<AuthenticatedUser | null> => {
    // Your authentication logic here
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return null; // Unauthenticated
    }

    // Validate session and get user data from your auth system
    const user = await validateSessionAndGetUser(sessionToken);

    if (!user) {
      return null; // Invalid session
    }

    // Return user data in the expected format
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
```

Then import this configuration file in your root layout to ensure it runs on app startup:

**File:** `app/layout.tsx`
```typescript
import './globals.css';
import '../lib/vortex-config'; // Import to initialize Vortex configuration

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Option 2: Per-Route Configuration

If you prefer to configure Vortex within individual API routes:

**File:** `app/api/vortex/jwt/route.ts`
```typescript
import { configureVortex, createVortexJwtRoute, type AuthenticatedUser } from '@teamvortexsoftware/vortex-nextjs-15-sdk';
import { NextRequest } from 'next/server';

// Configure Vortex for this route (runs before the handler)
configureVortex({
  apiKey: process.env.VORTEX_API_KEY!,
  authenticateUser: async (request: NextRequest): Promise<AuthenticatedUser | null> => {
    // Your authentication logic
    const user = await getCurrentUser(request);
    return user ? {
      userId: user.id,
      identifiers: [{ type: 'email', value: user.email }],
      groups: user.groups,
      role: user.role
    } : null;
  }
});

export const POST = createVortexJwtRoute();
```

## Authentication Hook Examples

Here are examples for common authentication patterns:

### With NextAuth.js
```typescript
import { getToken } from 'next-auth/jwt';

const authenticateUser = async (request: NextRequest): Promise<AuthenticatedUser | null> => {
  const token = await getToken({ req: request });

  if (!token || !token.sub) {
    return null;
  }

  return {
    userId: token.sub,
    identifiers: [{ type: 'email', value: token.email! }],
    groups: token.organizations || [],
    role: token.role
  };
};
```

### With Custom JWT Tokens
```typescript
import jwt from 'jsonwebtoken';

const authenticateUser = async (request: NextRequest): Promise<AuthenticatedUser | null> => {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    return {
      userId: decoded.userId,
      identifiers: [{ type: 'email', value: decoded.email }],
      groups: decoded.groups || [],
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
};
```

### With Supabase Auth
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const authenticateUser = async (request: NextRequest): Promise<AuthenticatedUser | null> => {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    userId: user.id,
    identifiers: [{ type: 'email', value: user.email! }],
    groups: user.user_metadata?.groups || [],
    role: user.user_metadata?.role
  };
};
```