import { FastifyInstance } from "fastify";
import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  getUserOrganizations,
  addUserToOrganization,
  updateUserOrganization,
  removeUserFromOrganization,
  getOrganizationUsers
} from "@/controllers/organizationController";
import { autenticarToken } from "@/middlewares/auth";

export async function organizationRoutes(fastify: FastifyInstance) {
  // Rotas públicas (se necessário)
  fastify.get("/organizations", getOrganizations);
  fastify.get("/organizations/:id", getOrganization);

  // Rotas protegidas
  fastify.addHook("preHandler", autenticarToken);

  // Rotas de organizações
  fastify.post("/organizations", createOrganization);
  fastify.put("/organizations/:id", updateOrganization);
  fastify.delete("/organizations/:id", deleteOrganization);

  // Rotas de relacionamentos usuário-organização
  fastify.get("/user/organizations", getUserOrganizations);
  fastify.post("/user-organizations", addUserToOrganization);
  fastify.put("/user-organizations/:id", updateUserOrganization);
  fastify.delete("/user-organizations/:id", removeUserFromOrganization);

  // Rotas de usuários de uma organização
  fastify.get("/organizations/:organizationId/users", getOrganizationUsers);
}
