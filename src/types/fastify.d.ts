import "@fastify/jwt";
import { OrganizationRole } from "@prisma/client";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string; register: OrganizationRole };
    user: { userId: string; register: OrganizationRole };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    user: {
      userId: string;
      primaryRole: OrganizationRole;
      primaryOrganizationId?: string;
      userOrganizations?: Array<{
        organizationId: string;
        role: OrganizationRole;
        organizationName: string;
      }>;
    };
  }

  interface FastifyReply {
    user: {
      userId: string;
      primaryRole: OrganizationRole;
      primaryOrganizationId?: string;
      userOrganizations?: Array<{
        organizationId: string;
        role: OrganizationRole;
        organizationName: string;
      }>;
    };
  }
}
