import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  postAttendance,
  getMyAttendances,
  getPatientAttendances
} from "@/controllers/attendanceController";
import { attendanceDocs } from "@/docs/attendance";

export async function attendanceRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post("/attendances", {
    schema: attendanceDocs.postAttendance.schema,
    preHandler: attendanceDocs.postAttendance.preHandler,
    handler: postAttendance
  });

  app.withTypeProvider<ZodTypeProvider>().get("/attendances/my", {
    schema: attendanceDocs.getMyAttendances.schema,
    preHandler: attendanceDocs.getMyAttendances.preHandler,
    handler: getMyAttendances
  });

  app.withTypeProvider<ZodTypeProvider>().get("/attendances/patient/:id", {
    schema: attendanceDocs.getPatientAttendances.schema,
    preHandler: attendanceDocs.getPatientAttendances.preHandler,
    handler: getPatientAttendances
  });
}
