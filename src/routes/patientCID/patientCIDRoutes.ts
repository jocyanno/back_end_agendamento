import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  createPatientCIDController,
  updatePatientCIDController,
  deletePatientCIDController,
  getPatientCIDsController,
  getProfessionalCIDsController,
  getPatientCIDByIdController
} from "@/controllers/patientCIDController";
import { autenticarToken } from "@/middlewares/auth";

export async function patientCIDRoutes(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", autenticarToken)
    .post("/patient-cids", createPatientCIDController);

  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", autenticarToken)
    .put("/patient-cids/:id", updatePatientCIDController);

  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", autenticarToken)
    .delete("/patient-cids/:id", deletePatientCIDController);

  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", autenticarToken)
    .get("/patient-cids/patient/:patientId", getPatientCIDsController);

  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", autenticarToken)
    .get("/patient-cids/professional", getProfessionalCIDsController);

  app
    .withTypeProvider<ZodTypeProvider>()
    .addHook("preHandler", autenticarToken)
    .get("/patient-cids/:id", getPatientCIDByIdController);
}
