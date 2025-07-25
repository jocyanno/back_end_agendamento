import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  createUsuario,
  createUsuarioAdmin,
  deleteUsuario,
  getAllUsuarios,
  getDoctors,
  getUsuario,
  getUsuarioById,
  getUsuariosByRegistrar,
  loginUsuario,
  updateUsuario,
  updateUsuarioByDoctor
} from "@/controllers/usuarioController";
import { usuarioDocs } from "@/docs/usuario";

export async function usuarioRoutes(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/user", usuarioDocs.getUsuario, getUsuario);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/doctors", usuarioDocs.getDoctors, getDoctors);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/users", usuarioDocs.getAllUsuarios, getAllUsuarios);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/users/registrar/:registrarId",
      usuarioDocs.getUsuariosByRegistrar,
      getUsuariosByRegistrar
    );

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
}
