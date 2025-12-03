/**
 * Integration test for Vortex Next.js 15 SDK
 * Tests the full flow with Next.js route handlers
 */

import { describe, test, expect, beforeAll } from "@jest/globals";
import {
  configureVortex,
  createVortexInvitationsRoute,
  createVortexInvitationRoute,
  createVortexInvitationsAcceptRoute,
  Vortex,
} from "@teamvortexsoftware/vortex-nextjs-15-sdk";
import { NextRequest } from "next/server";

describe("Vortex Next.js SDK Integration", () => {
  let clientApiUrl: string;
  let publicApiUrl: string;
  let apiKey: string;
  let sessionId: string;
  let invitationId: string;
  let testUserEmail: string;
  let testUserId: string;
  let testGroupType: string;
  let testGroupId: string;
  let testGroupName: string;
  let routes: {
    invitations: { GET: (req: NextRequest) => Promise<Response> };
    invitation: {
      GET: (
        req: NextRequest,
        context: { params: Promise<{ invitationId: string }> },
      ) => Promise<Response>;
      DELETE: (
        req: NextRequest,
        context: { params: Promise<{ invitationId: string }> },
      ) => Promise<Response>;
    };
    accept: { POST: (req: NextRequest) => Promise<Response> };
  };

  beforeAll(async () => {
    // Validate required environment variables
    const key = process.env.TEST_INTEGRATION_SDKS_VORTEX_API_KEY;
    if (!key) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_VORTEX_API_KEY",
      );
    }
    apiKey = key;

    const clientUrl = process.env.TEST_INTEGRATION_SDKS_VORTEX_CLIENT_API_URL;
    if (!clientUrl) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_VORTEX_CLIENT_API_URL",
      );
    }
    clientApiUrl = clientUrl;

    const publicUrl = process.env.TEST_INTEGRATION_SDKS_VORTEX_PUBLIC_API_URL;
    if (!publicUrl) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_VORTEX_PUBLIC_API_URL",
      );
    }
    publicApiUrl = publicUrl;

    const session = process.env.TEST_INTEGRATION_SDKS_VORTEX_SESSION_ID;
    if (!session) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_VORTEX_SESSION_ID",
      );
    }
    sessionId = session;

    const userEmail = process.env.TEST_INTEGRATION_SDKS_USER_EMAIL;
    if (!userEmail) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_USER_EMAIL",
      );
    }
    testUserEmail = userEmail.replace("{timestamp}", Date.now().toString());

    const userId = process.env.TEST_INTEGRATION_SDKS_USER_ID;
    if (!userId) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_USER_ID",
      );
    }
    testUserId = userId.replace("{timestamp}", Date.now().toString());

    const groupType = process.env.TEST_INTEGRATION_SDKS_GROUP_TYPE;
    if (!groupType) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_GROUP_TYPE",
      );
    }
    testGroupType = groupType;

    const groupName = process.env.TEST_INTEGRATION_SDKS_GROUP_NAME;
    if (!groupName) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_GROUP_NAME",
      );
    }
    testGroupName = groupName;

    testGroupId = `test-group-${Date.now()}`;

    // Set environment variable for Vortex SDK
    process.env.VORTEX_API_BASE_URL = publicApiUrl;

    // Configure Vortex SDK
    configureVortex({
      apiKey: apiKey,
      apiBaseUrl: publicApiUrl,
      authenticateUser: async () => ({
        userId: testUserId,
        userEmail: testUserEmail,
      }),
      // Allow all access for testing
      canAccessInvitationsByTarget: async () => true,
      canAccessInvitation: async () => true,
      canAcceptInvitations: async () => true,
    });

    // Create Next.js route handlers
    routes = {
      invitations: createVortexInvitationsRoute(),
      invitation: createVortexInvitationRoute(),
      accept: createVortexInvitationsAcceptRoute(),
    };
  });

  test("Full invitation flow using Next.js route handlers", async () => {
    if (!apiKey) {
      console.log("⚠️  Test skipped - environment not configured");
      return;
    }

    console.log("\n--- Starting Next.js SDK Integration Test ---");

    // Step 1: Create invitation via Client API
    console.log("Step 1: Creating invitation...");
    invitationId = await createInvitation();
    expect(invitationId).toBeTruthy();
    console.log(`✓ Created invitation: ${invitationId}`);

    // Step 2: Get invitation by ID via Next.js route handler
    console.log("Step 2a: Getting invitation by ID via Next.js handler...");
    const invitation = await getInvitationById();
    expect(invitation).toBeDefined();
    expect(invitation.id).toBe(invitationId);
    console.log("✓ Retrieved invitation by ID successfully");

    // Step 2b: Get invitations by target via Next.js route handler
    console.log(
      "Step 2b: Getting invitations by target via Next.js handler...",
    );
    const invitations = await getInvitations();
    expect(invitations).toBeDefined();
    expect(invitations.length).toBeGreaterThan(0);
    const foundInList = invitations.some((inv: any) => inv.id === invitationId);
    expect(foundInList).toBe(true);
    console.log(
      "✓ Retrieved invitations by target successfully and verified invitation is in list",
    );

    // Step 3: Accept invitation via Next.js route handler
    console.log("Step 3: Accepting invitation via Next.js handler...");
    const result = await acceptInvitation();
    expect(result).toBeDefined();
    console.log("✓ Accepted invitation successfully");

    console.log("--- Next.js SDK Integration Test Complete ---\n");
  }, 30000);

  async function createInvitation(): Promise<string> {
    const vortex = new Vortex(apiKey);
    const jwt = vortex.generateJwt({
      user: {
        id: testUserId,
        email: testUserEmail,
      },
    });

    const componentId = process.env.TEST_INTEGRATION_SDKS_VORTEX_COMPONENT_ID;
    if (!componentId) {
      throw new Error(
        "Missing required environment variable: TEST_INTEGRATION_SDKS_VORTEX_COMPONENT_ID",
      );
    }

    const widgetResponse = await fetch(
      `${clientApiUrl}/api/v1/widgets/${componentId}?templateVariables=lzstr:N4Ig5gTg9grgDgfQHYEMC2BTEAuEBlAEQGkACAFQwGcAXEgcWnhABoQBLJANzeowmXRZcBCCQBqUCLwAeLcI0SY0AIz4IAxrCTUcIAMxzNaOCiQBPAZl0SpGaSQCSSdQDoQAXyA`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          "x-session-id": sessionId,
        },
      },
    );

    if (!widgetResponse.ok) {
      throw new Error(
        `Failed to fetch widget configuration: ${widgetResponse.status} ${await widgetResponse.text()}`,
      );
    }

    const widgetData: any = await widgetResponse.json();
    const widgetConfigId = widgetData?.data?.widgetConfiguration?.id;
    const sessionAttestation = widgetData?.data?.sessionAttestation;

    if (!widgetConfigId) {
      throw new Error("Widget configuration ID not found in response");
    }

    if (!sessionAttestation) {
      throw new Error("Session attestation not found in widget response");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      "x-session-id": sessionId,
      "x-session-attestation": sessionAttestation,
    };

    const response = await fetch(`${clientApiUrl}/api/v1/invitations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        payload: {
          emails: {
            value: testUserEmail,
            type: "email",
            role: "member",
          },
        },
        group: {
          type: testGroupType,
          groupId: testGroupId,
          name: testGroupName,
        },
        source: "email",
        templateVariables: {
          group_name: "SDK Test Group",
          inviter_name: "Dr Vortex",
          group_member_count: "3",
          company_name: "Vortex Inc.",
        },
        widgetConfigurationId: widgetConfigId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Create invitation failed: ${response.status} ${await response.text()}`,
      );
    }

    const result: any = await response.json();
    const extractedId = result?.data?.invitationEntries?.[0]?.id || result.id;

    if (extractedId) {
      console.log(`Successfully extracted invitation ID: ${extractedId}`);
    }

    return extractedId;
  }

  async function getInvitationById(): Promise<any> {
    const request = new NextRequest(
      `http://localhost/api/vortex/invitations/${invitationId}`,
      {
        method: "GET",
      },
    );

    const response = await routes.invitation.GET(request, {
      params: Promise.resolve({ invitationId }),
    });

    if (!response.ok) {
      throw new Error(
        `Get invitation failed: ${response.status} ${await response.text()}`,
      );
    }

    return await response.json();
  }

  async function getInvitations(): Promise<any[]> {
    const request = new NextRequest(
      `http://localhost/api/vortex/invitations?targetType=email&targetValue=${encodeURIComponent(testUserEmail)}`,
      {
        method: "GET",
      },
    );

    const response = await routes.invitations.GET(request);

    if (!response.ok) {
      throw new Error(
        `Get invitations failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = await response.json();
    return data?.invitations || [];
  }

  async function acceptInvitation(): Promise<any> {
    const request = new NextRequest(
      `http://localhost/api/vortex/invitations/accept`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationIds: [invitationId],
          target: {
            type: "email",
            value: testUserEmail,
          },
        }),
      },
    );

    const response = await routes.accept.POST(request);

    if (!response.ok) {
      throw new Error(
        `Accept invitation failed: ${response.status} ${await response.text()}`,
      );
    }

    return await response.json();
  }
});
