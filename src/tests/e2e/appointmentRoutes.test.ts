import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { FastifyInstance } from "fastify";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Register, AppointmentStatus } from "@prisma/client";
import {
  postAppointment,
  getAvailableSlots,
  getMyAppointments,
  putAppointmentStatus,
  postAvailability,
  getAvailability,
  getTodayAppointments
} from "@/controllers/appointmentController";
import { Unauthorized } from "@/_errors/unauthorized";
import { BadRequest } from "@/_errors/bad-request";
import { NotFound } from "@/_errors/not-found";

async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "test-secret-key"
  });

  // Tratamento de erro global
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Unauthorized) {
      return reply.code(401).send({ status: "error", message: error.message });
    }
    if (error instanceof BadRequest) {
      return reply.code(400).send({ status: "error", message: error.message });
    }
    if (error instanceof NotFound) {
      return reply.code(404).send({ status: "error", message: error.message });
    }

    return reply.code(500).send({
      status: "error",
      message: "Internal server error"
    });
  });

  // Middleware de autenticação
  const authenticateMiddleware = async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
      const { userId, register } = request.user;
      request.usuario = { id: userId, register };
    } catch (err) {
      throw new Unauthorized("Token inválido");
    }
  };

  // Registrar rotas de agendamento
  app.post(
    "/appointments",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await postAppointment(request, reply);
    }
  );

  app.get("/appointments/available-slots", async (request, reply) => {
    return await getAvailableSlots(request, reply);
  });

  app.get(
    "/appointments/my",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await getMyAppointments(request, reply);
    }
  );

  app.get(
    "/appointments/today",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await getTodayAppointments(request, reply);
    }
  );

  app.put(
    "/appointments/:id/status",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await putAppointmentStatus(request, reply);
    }
  );

  // Rotas de disponibilidade
  app.post(
    "/availability",
    {
      preHandler: [authenticateMiddleware]
    },
    async (request, reply) => {
      return await postAvailability(request, reply);
    }
  );

  app.get("/availability/:doctorId", async (request, reply) => {
    return await getAvailability(request, reply);
  });

  return app;
}

async function createTestUser(data: {
  email: string;
  password: string;
  cpf: string;
  register?: Register;
  name?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Primeiro, deletar se já existir para evitar conflitos
  await prisma.users.deleteMany({
    where: {
      OR: [{ email: data.email }, { cpf: data.cpf }]
    }
  });

  return await prisma.users.create({
    data: {
      email: data.email,
      password: hashedPassword,
      cpf: data.cpf,
      register: data.register || "patient",
      name: data.name || "Test User"
    }
  });
}

async function generateToken(
  app: FastifyInstance,
  userId: string,
  register: Register
) {
  return app.jwt.sign({ userId, register }, { expiresIn: "7d" });
}

async function cleanDatabase() {
  // Deletar na ordem correta para respeitar as foreign keys
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.users.deleteMany();
}

describe("Appointment Routes E2E", () => {
  let app: FastifyInstance;
  let doctor: any;
  let patient: any;
  let doctorToken: string;
  let patientToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Aguardar um pouco para garantir que a limpeza termine completamente
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Criar usuários base para testes
    doctor = await createTestUser({
      email: "doctor@test.com",
      password: "doctor123",
      cpf: "11111111111",
      register: "doctor",
      name: "Dr. Test"
    });

    patient = await createTestUser({
      email: "patient@test.com",
      password: "patient123",
      cpf: "22222222222",
      register: "patient",
      name: "Patient Test"
    });

    // Aguardar criação dos usuários antes de gerar tokens
    await new Promise((resolve) => setTimeout(resolve, 10));

    doctorToken = await generateToken(app, doctor.id, doctor.register);
    patientToken = await generateToken(app, patient.id, patient.register);
  });

  describe("POST /availability", () => {
    it("deve permitir médico criar disponibilidade", async () => {
      const availabilityData = {
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00"
      };

      const response = await app.inject({
        method: "POST",
        url: "/availability",
        headers: {
          authorization: `Bearer ${doctorToken}`
        },
        payload: availabilityData
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.dayOfWeek).toBe(1);
      expect(body.data.startTime).toBe("08:00");
      expect(body.data.endTime).toBe("17:00");
    });

    it("deve impedir paciente de criar disponibilidade", async () => {
      const availabilityData = {
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00"
      };

      const response = await app.inject({
        method: "POST",
        url: "/availability",
        headers: {
          authorization: `Bearer ${patientToken}`
        },
        payload: availabilityData
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });
  });

  describe("GET /availability/:doctorId", () => {
    it("deve retornar disponibilidade do médico", async () => {
      // Criar uma disponibilidade primeiro
      await prisma.availability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "17:00",
          isActive: true
        }
      });

      const response = await app.inject({
        method: "GET",
        url: `/availability/${doctor.id}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(1);
      expect(body.data[0].dayOfWeek).toBe(1);
    });

    it("deve retornar array vazio se médico não tiver disponibilidade", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/availability/${doctor.id}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(0);
    });
  });

  describe("GET /appointments/available-slots", () => {
    it("deve retornar slots disponíveis para médico com disponibilidade", async () => {
      // Criar disponibilidade
      await prisma.availability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: 1, // Segunda-feira
          startTime: "08:00",
          endTime: "12:00",
          isActive: true
        }
      });

      const response = await app.inject({
        method: "GET",
        url: "/appointments/available-slots",
        query: {
          doctorId: doctor.id,
          date: "2024-01-01" // Assumindo que seja uma segunda-feira
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("deve retornar slots vazios se médico não tiver disponibilidade", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/available-slots",
        query: {
          doctorId: doctor.id,
          date: "2024-01-01"
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(0);
    });
  });

  describe("POST /appointments", () => {
    beforeEach(async () => {
      // Criar disponibilidade para permitir agendamentos
      await prisma.availability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "17:00",
          isActive: true
        }
      });
    });

    it("deve permitir paciente criar agendamento", async () => {
      const appointmentData = {
        doctorId: doctor.id,
        startTime: "2024-12-02T10:00:00.000Z", // Segunda-feira no futuro
        notes: "Consulta de rotina"
      };

      const response = await app.inject({
        method: "POST",
        url: "/appointments",
        headers: {
          authorization: `Bearer ${patientToken}`
        },
        payload: appointmentData
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.patientId).toBe(patient.id);
      expect(body.data.doctorId).toBe(doctor.id);
      expect(body.data.notes).toBe("Consulta de rotina");
    });

    it("deve impedir médico de agendar para si mesmo", async () => {
      const appointmentData = {
        doctorId: doctor.id,
        startTime: "2024-12-02T10:00:00.000Z",
        notes: "Teste"
      };

      const response = await app.inject({
        method: "POST",
        url: "/appointments",
        headers: {
          authorization: `Bearer ${doctorToken}`
        },
        payload: appointmentData
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });

    it("deve retornar erro sem autenticação", async () => {
      const appointmentData = {
        doctorId: doctor.id,
        startTime: "2024-12-02T10:00:00.000Z"
      };

      const response = await app.inject({
        method: "POST",
        url: "/appointments",
        payload: appointmentData
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /appointments/my", () => {
    beforeEach(async () => {
      // Criar um agendamento de teste
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: new Date("2024-12-02T10:00:00.000Z"),
          endTime: new Date("2024-12-02T10:50:00.000Z"),
          status: "scheduled",
          notes: "Consulta de teste"
        }
      });
    });

    it("deve retornar agendamentos do paciente", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/my",
        headers: {
          authorization: `Bearer ${patientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(1);
      expect(body.data[0].patientId).toBe(patient.id);
    });

    it("deve retornar agendamentos do médico", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/my",
        headers: {
          authorization: `Bearer ${doctorToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data).toHaveLength(1);
      expect(body.data[0].doctorId).toBe(doctor.id);
    });

    it("deve filtrar agendamentos por status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/my?status=scheduled",
        headers: {
          authorization: `Bearer ${patientToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data[0].status).toBe("scheduled");
    });
  });

  describe("PUT /appointments/:id/status", () => {
    let appointment: any;

    beforeEach(async () => {
      appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: new Date("2024-12-02T10:00:00.000Z"),
          endTime: new Date("2024-12-02T10:50:00.000Z"),
          status: "scheduled",
          notes: "Consulta de teste"
        }
      });
    });

    it("deve permitir paciente confirmar agendamento", async () => {
      const response = await app.inject({
        method: "PUT",
        url: `/appointments/${appointment.id}/status`,
        headers: {
          authorization: `Bearer ${patientToken}`
        },
        payload: {
          status: "confirmed"
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.status).toBe("confirmed");
    });

    it("deve permitir médico atualizar status", async () => {
      const response = await app.inject({
        method: "PUT",
        url: `/appointments/${appointment.id}/status`,
        headers: {
          authorization: `Bearer ${doctorToken}`
        },
        payload: {
          status: "completed"
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(body.data.status).toBe("completed");
    });

    it("deve retornar erro para agendamento inexistente", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/appointments/inexistent-id/status",
        headers: {
          authorization: `Bearer ${patientToken}`
        },
        payload: {
          status: "confirmed"
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /appointments/today", () => {
    beforeEach(async () => {
      // Criar agendamento para hoje
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: today,
          endTime: new Date(today.getTime() + 50 * 60 * 1000), // +50 minutos
          status: "scheduled",
          notes: "Consulta de hoje"
        }
      });
    });

    it("deve retornar agendamentos do dia para médico", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/today",
        headers: {
          authorization: `Bearer ${doctorToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("success");
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("deve impedir paciente de acessar agendamentos do dia", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/appointments/today",
        headers: {
          authorization: `Bearer ${patientToken}`
        }
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("error");
    });
  });
});
