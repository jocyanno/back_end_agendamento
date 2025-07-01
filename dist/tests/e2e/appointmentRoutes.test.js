"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const prisma_1 = require("../../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const appointmentController_1 = require("../../controllers/appointmentController");
const unauthorized_1 = require("../../_errors/unauthorized");
const bad_request_1 = require("../../_errors/bad-request");
const not_found_1 = require("../../_errors/not-found");
async function createTestApp() {
    const app = (0, fastify_1.default)({ logger: false });
    await app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || "test-secret-key"
    });
    // Tratamento de erro global
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof unauthorized_1.Unauthorized) {
            return reply.code(401).send({ status: "error", message: error.message });
        }
        if (error instanceof bad_request_1.BadRequest) {
            return reply.code(400).send({ status: "error", message: error.message });
        }
        if (error instanceof not_found_1.NotFound) {
            return reply.code(404).send({ status: "error", message: error.message });
        }
        return reply.code(500).send({
            status: "error",
            message: "Internal server error"
        });
    });
    // Middleware de autenticação
    const authenticateMiddleware = async (request, reply) => {
        try {
            await request.jwtVerify();
            const { userId, register } = request.user;
            request.usuario = { id: userId, register };
        }
        catch (err) {
            throw new unauthorized_1.Unauthorized("Token inválido");
        }
    };
    // Registrar rotas de agendamento
    app.post("/appointments", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, appointmentController_1.postAppointment)(request, reply);
    });
    app.get("/appointments/available-slots", async (request, reply) => {
        return await (0, appointmentController_1.getAvailableSlots)(request, reply);
    });
    app.get("/appointments/my", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, appointmentController_1.getMyAppointments)(request, reply);
    });
    app.get("/appointments/today", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, appointmentController_1.getTodayAppointments)(request, reply);
    });
    app.put("/appointments/:id/status", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, appointmentController_1.putAppointmentStatus)(request, reply);
    });
    // Rotas de disponibilidade
    app.post("/availability", {
        preHandler: [authenticateMiddleware]
    }, async (request, reply) => {
        return await (0, appointmentController_1.postAvailability)(request, reply);
    });
    app.get("/availability/:doctorId", async (request, reply) => {
        return await (0, appointmentController_1.getAvailability)(request, reply);
    });
    return app;
}
async function createTestUser(data) {
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    // Primeiro, deletar se já existir para evitar conflitos
    await prisma_1.prisma.users.deleteMany({
        where: {
            OR: [{ email: data.email }, { cpf: data.cpf }]
        }
    });
    return await prisma_1.prisma.users.create({
        data: {
            email: data.email,
            password: hashedPassword,
            cpf: data.cpf,
            register: data.register || "patient",
            name: data.name || "Test User"
        }
    });
}
async function generateToken(app, userId, register) {
    return app.jwt.sign({ userId, register }, { expiresIn: "7d" });
}
async function cleanDatabase() {
    // Deletar na ordem correta para respeitar as foreign keys
    await prisma_1.prisma.notification.deleteMany();
    await prisma_1.prisma.appointment.deleteMany();
    await prisma_1.prisma.availability.deleteMany();
    await prisma_1.prisma.users.deleteMany();
}
(0, vitest_1.describe)("Appointment Routes E2E", () => {
    let app;
    let doctor;
    let patient;
    let doctorToken;
    let patientToken;
    (0, vitest_1.beforeAll)(async () => {
        app = await createTestApp();
        await app.ready();
    });
    (0, vitest_1.afterAll)(async () => {
        await app.close();
    });
    (0, vitest_1.beforeEach)(async () => {
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
    (0, vitest_1.describe)("POST /availability", () => {
        (0, vitest_1.it)("deve permitir médico criar disponibilidade", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data.dayOfWeek).toBe(1);
            (0, vitest_1.expect)(body.data.startTime).toBe("08:00");
            (0, vitest_1.expect)(body.data.endTime).toBe("17:00");
        });
        (0, vitest_1.it)("deve impedir paciente de criar disponibilidade", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(403);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
    });
    (0, vitest_1.describe)("GET /availability/:doctorId", () => {
        (0, vitest_1.it)("deve retornar disponibilidade do médico", async () => {
            // Criar uma disponibilidade primeiro
            await prisma_1.prisma.availability.create({
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data).toHaveLength(1);
            (0, vitest_1.expect)(body.data[0].dayOfWeek).toBe(1);
        });
        (0, vitest_1.it)("deve retornar array vazio se médico não tiver disponibilidade", async () => {
            const response = await app.inject({
                method: "GET",
                url: `/availability/${doctor.id}`
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)("GET /appointments/available-slots", () => {
        (0, vitest_1.it)("deve retornar slots disponíveis para médico com disponibilidade", async () => {
            // Criar disponibilidade
            await prisma_1.prisma.availability.create({
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(Array.isArray(body.data)).toBe(true);
        });
        (0, vitest_1.it)("deve retornar slots vazios se médico não tiver disponibilidade", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/appointments/available-slots",
                query: {
                    doctorId: doctor.id,
                    date: "2024-01-01"
                }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)("POST /appointments", () => {
        (0, vitest_1.beforeEach)(async () => {
            // Criar disponibilidade para permitir agendamentos
            await prisma_1.prisma.availability.create({
                data: {
                    doctorId: doctor.id,
                    dayOfWeek: 1,
                    startTime: "08:00",
                    endTime: "17:00",
                    isActive: true
                }
            });
        });
        (0, vitest_1.it)("deve permitir paciente criar agendamento", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data.patientId).toBe(patient.id);
            (0, vitest_1.expect)(body.data.doctorId).toBe(doctor.id);
            (0, vitest_1.expect)(body.data.notes).toBe("Consulta de rotina");
        });
        (0, vitest_1.it)("deve impedir médico de agendar para si mesmo", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
        (0, vitest_1.it)("deve retornar erro sem autenticação", async () => {
            const appointmentData = {
                doctorId: doctor.id,
                startTime: "2024-12-02T10:00:00.000Z"
            };
            const response = await app.inject({
                method: "POST",
                url: "/appointments",
                payload: appointmentData
            });
            (0, vitest_1.expect)(response.statusCode).toBe(401);
        });
    });
    (0, vitest_1.describe)("GET /appointments/my", () => {
        (0, vitest_1.beforeEach)(async () => {
            // Criar um agendamento de teste
            await prisma_1.prisma.appointment.create({
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
        (0, vitest_1.it)("deve retornar agendamentos do paciente", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/appointments/my",
                headers: {
                    authorization: `Bearer ${patientToken}`
                }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data).toHaveLength(1);
            (0, vitest_1.expect)(body.data[0].patientId).toBe(patient.id);
        });
        (0, vitest_1.it)("deve retornar agendamentos do médico", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/appointments/my",
                headers: {
                    authorization: `Bearer ${doctorToken}`
                }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data).toHaveLength(1);
            (0, vitest_1.expect)(body.data[0].doctorId).toBe(doctor.id);
        });
        (0, vitest_1.it)("deve filtrar agendamentos por status", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/appointments/my?status=scheduled",
                headers: {
                    authorization: `Bearer ${patientToken}`
                }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data[0].status).toBe("scheduled");
        });
    });
    (0, vitest_1.describe)("PUT /appointments/:id/status", () => {
        let appointment;
        (0, vitest_1.beforeEach)(async () => {
            appointment = await prisma_1.prisma.appointment.create({
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
        (0, vitest_1.it)("deve permitir paciente confirmar agendamento", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data.status).toBe("confirmed");
        });
        (0, vitest_1.it)("deve permitir médico atualizar status", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(body.data.status).toBe("completed");
        });
        (0, vitest_1.it)("deve retornar erro para agendamento inexistente", async () => {
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
            (0, vitest_1.expect)(response.statusCode).toBe(404);
        });
    });
    (0, vitest_1.describe)("GET /appointments/today", () => {
        (0, vitest_1.beforeEach)(async () => {
            // Criar agendamento para hoje
            const today = new Date();
            today.setHours(10, 0, 0, 0);
            await prisma_1.prisma.appointment.create({
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
        (0, vitest_1.it)("deve retornar agendamentos do dia para médico", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/appointments/today",
                headers: {
                    authorization: `Bearer ${doctorToken}`
                }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("success");
            (0, vitest_1.expect)(Array.isArray(body.data)).toBe(true);
        });
        (0, vitest_1.it)("deve impedir paciente de acessar agendamentos do dia", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/appointments/today",
                headers: {
                    authorization: `Bearer ${patientToken}`
                }
            });
            (0, vitest_1.expect)(response.statusCode).toBe(403);
            const body = JSON.parse(response.body);
            (0, vitest_1.expect)(body.status).toBe("error");
        });
    });
});
//# sourceMappingURL=appointmentRoutes.test.js.map