import { FastifyRequest } from "fastify";
import { OrganizationRole } from "@prisma/client";

export interface AuthenticatedRequest {
  usuario: {
    id: string;
    primaryRole: OrganizationRole;
    primaryOrganizationId?: string;
    userOrganizations?: Array<{
      organizationId: string;
      role: OrganizationRole;
      organizationName: string;
    }>;
  };
}
