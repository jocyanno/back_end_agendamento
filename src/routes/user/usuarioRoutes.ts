import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  createUsuario,
  createUsuarioAdmin,
  deleteUsuario,
  getAllUsuarios,
  getProfessionals,
  getUsuario,
  getUsuarioById,
  loginUsuario,
  updateUsuario,
  updateUsuarioByDoctor,
  addUserToOrganizationController,
  getUserOrganizationsController,
  getUsersFromCurrentOrganizationController,
  removeUserFromOrganizationController,
  getAllUsersFromSystemController,
  checkEmailAvailability,
  checkCpfAvailability
} from "@/controllers/usuarioController";
import { usuarioDocs } from "@/docs/usuario";

export async function usuarioRoutes(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/user", usuarioDocs.getUsuario, getUsuario);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/professionals", usuarioDocs.getProfessionals, getProfessionals);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/users", usuarioDocs.getAllUsuarios, getAllUsuarios);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/users/:id", usuarioDocs.getUsuarioById, getUsuarioById);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/user/login", usuarioDocs.loginUsuario, loginUsuario);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/user", usuarioDocs.postUsuario, createUsuario);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/user/admin", usuarioDocs.postUsuarioAdmin, createUsuarioAdmin);

  app
    .withTypeProvider<ZodTypeProvider>()
    .put("/user", usuarioDocs.putUsuario, updateUsuario);

  app
    .withTypeProvider<ZodTypeProvider>()
    .put("/user/:id", usuarioDocs.putUsuarioByDoctor, updateUsuarioByDoctor);

  app
    .withTypeProvider<ZodTypeProvider>()
    .delete("/user/:id", usuarioDocs.deleteUsuario, deleteUsuario);

  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      "/user/organization",
      usuarioDocs.addUserToOrganization,
      addUserToOrganizationController
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/user/:userId/organizations",
      usuarioDocs.getUserOrganizations,
      getUserOrganizationsController
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/user/organization/current",
      usuarioDocs.getUsersFromCurrentOrganization,
      getUsersFromCurrentOrganizationController
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .delete(
      "/user/organization/:userId",
      usuarioDocs.removeUserFromOrganization,
      removeUserFromOrganizationController
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/user/system/all",
      usuarioDocs.getAllUsersFromSystem,
      getAllUsersFromSystemController
    );

  // Rotas para verificar disponibilidade em tempo real
  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/user/check-email/:email", checkEmailAvailability);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/user/check-cpf/:cpf", checkCpfAvailability);
}
