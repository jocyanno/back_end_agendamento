import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import cuid from "cuid";
import { prismaTest } from "../setup";

export interface CreateUserData {
  name?: string;
  email?: string;
  password?: string;
  cpf?: string;
  register?: "patient" | "parents" | "doctor";
  id?: string;
  phone?: string;
  address?: string;
  numberOfAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Usar contador global que será resetado entre testes
declare global {
  var userCounter: number;
  var testRunId: string;
}

if (global.userCounter === undefined) {
  global.userCounter = 0;
}

if (global.testRunId === undefined) {
  global.testRunId = Date.now().toString(36);
}

function getNextUserNumber(): number {
  global.userCounter++;
  return global.userCounter;
}

function getPrisma() {
  // Usar sempre prismaTest para todos os testes
  return prismaTest;
}

// Função para resetar contador entre testes
export function resetUserCounter() {
  global.userCounter = 0;
  global.testRunId =
    Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export async function createTestUser(data: CreateUserData = {}) {
  const prisma = getPrisma();
  const hashedPassword = await bcrypt.hash(data.password || "12345678", 10);
  const uniqueId = data.id || cuid();
  const userNumber = getNextUserNumber();
  const runId = global.testRunId;
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 8);

  const userData: any = {
    name: data.name || `Test User ${userNumber}`,
    email:
      data.email ||
      `test${userNumber}-${runId}-${timestamp}-${randomSuffix}@example.com`,
    password: hashedPassword,
    cpf:
      data.cpf || generateUniqueCPF(`${userNumber}${timestamp}${randomSuffix}`),
    register: data.register || "patient",
    phone:
      data.phone ||
      `11${userNumber.toString().padStart(2, "0")}${timestamp
        .toString()
        .slice(-7)}${randomSuffix.slice(0, 2)}`,
    address: data.address || `Test Street`,
    numberOfAddress: data.numberOfAddress || `1`,
    city: data.city || "Test City",
    state: data.state || "TS",
    zipCode: data.zipCode || `12345000`,
    country: data.country || "BR"
  };

  if (data.id) userData.id = data.id;

  const user = await prisma.users.create({ data: userData });
  if (process.env.NODE_ENV !== "e2e" && process.env.VITEST_MODE !== "e2e") {
    console.log("[unit] Created user:", user.id, user.email, user.register);
  }
  return user;
}

export async function createTestDoctor(data: CreateUserData = {}) {
  const doctor = await createTestUser({ ...data, register: "doctor" });
  if (process.env.NODE_ENV !== "e2e" && process.env.VITEST_MODE !== "e2e") {
    console.log(
      "[unit] Created doctor:",
      doctor.id,
      doctor.email,
      doctor.register
    );
  }
  return doctor;
}

export async function createTestPatient(data: CreateUserData = {}) {
  const patient = await createTestUser({ ...data, register: "patient" });
  if (process.env.NODE_ENV !== "e2e" && process.env.VITEST_MODE !== "e2e") {
    console.log(
      "[unit] Created patient:",
      patient.id,
      patient.email,
      patient.register
    );
  }
  return patient;
}

export function generateUniqueCPF(uniqueId?: string): string {
  // Gera um CPF fake mas único para testes
  const runId = global.testRunId || Date.now().toString(36);
  const userNum = getNextUserNumber();
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 3);

  const base = (uniqueId || `${userNum}${timestamp}${random}${runId}`)
    .replace(/[^0-9]/g, "")
    .slice(0, 9)
    .padStart(9, "0");
  return base + "00";
}

export function generateTestToken(user: any): string {
  return jwt.sign(
    {
      userId: user.id,
      register: user.register
    },
    process.env.JWT_SECRET || "test-jwt-secret",
    { expiresIn: "1h" }
  );
}

export function getFutureDate(daysFromNow: number = 1): Date {
  return moment().add(daysFromNow, "days").toDate();
}

export function getPastDate(daysAgo: number = 1): Date {
  return moment().subtract(daysAgo, "days").toDate();
}

export function getTomorrowAt(hour: number): Date {
  return moment()
    .add(1, "day")
    .hour(hour)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toDate();
}

// Função MUITO SIMPLIFICADA para encontrar ou criar usuário
async function findOrCreateUser(
  idOrUser?: { id: string } | string | null,
  type: "doctor" | "patient" = "patient"
) {
  if (!idOrUser) {
    return type === "doctor"
      ? await createTestDoctor()
      : await createTestPatient();
  }

  if (typeof idOrUser === "object" && idOrUser.id) {
    return type === "doctor"
      ? await createTestDoctor({ id: idOrUser.id })
      : await createTestPatient({ id: idOrUser.id });
  }

  if (typeof idOrUser === "string") {
    return type === "doctor"
      ? await createTestDoctor({ id: idOrUser })
      : await createTestPatient({ id: idOrUser });
  }

  // Fallback
  return type === "doctor"
    ? await createTestDoctor()
    : await createTestPatient();
}

export async function createTestAppointment(
  patient?: { id: string } | string | null,
  doctor?: { id: string } | string | null,
  overridesOrDate: any = {}
) {
  const resolvedPatient = await findOrCreateUser(patient, "patient");
  const resolvedDoctor = await findOrCreateUser(doctor, "doctor");

  let overrides = overridesOrDate;
  if (overridesOrDate instanceof Date) {
    overrides = { startTime: overridesOrDate };
  }

  const startTime = overrides.startTime || getFutureDate(1);
  const endTime =
    overrides.endTime || moment(startTime).add(50, "minutes").toDate();

  const appointment = await getPrisma().appointment.create({
    data: {
      patientId: resolvedPatient.id,
      doctorId: resolvedDoctor.id,
      startTime,
      endTime,
      status: overrides.status || "scheduled",
      notes: overrides.notes || "Test appointment",
      googleEventId: overrides.googleEventId || null,
      googleMeetLink: overrides.googleMeetLink || null,
      reminderSent: overrides.reminderSent || false
    }
  });

  if (process.env.NODE_ENV !== "e2e" && process.env.VITEST_MODE !== "e2e") {
    console.log(
      "[unit] Created appointment:",
      appointment.id,
      appointment.patientId,
      appointment.doctorId
    );
  }
  return appointment;
}

export async function createTestAvailability(
  doctor?: { id: string } | string | null,
  overrides: any = {}
) {
  const resolvedDoctor = await findOrCreateUser(doctor, "doctor");

  return await getPrisma().availability.create({
    data: {
      doctorId: resolvedDoctor.id,
      dayOfWeek: overrides.dayOfWeek || 1,
      startTime: overrides.startTime || "09:00",
      endTime: overrides.endTime || "18:00",
      isActive: overrides.isActive !== undefined ? overrides.isActive : true
    }
  });
}

// Função para criar notification de teste
export async function createTestNotification(
  userId: string,
  appointmentId?: string,
  overrides: any = {}
) {
  return await getPrisma().notification.create({
    data: {
      userId,
      appointmentId,
      type: overrides.type || "reminder",
      title: overrides.title || "Test Notification",
      message: overrides.message || "This is a test notification",
      sentAt: overrides.sentAt || null,
      readAt: overrides.readAt || null
    }
  });
}

// Função para limpar dados de teste
export async function cleanupTestData() {
  await getPrisma().notification.deleteMany({});
  await getPrisma().appointment.deleteMany({});
  await getPrisma().availability.deleteMany({});
  await getPrisma().users.deleteMany({});
  resetUserCounter(); // Reset counter after cleanup
}

// Função para criar dados completos de teste
export async function createCompleteTestData() {
  const patient = await createTestPatient();
  const doctor = await createTestDoctor();
  const availability = await createTestAvailability(doctor);
  const appointment = await createTestAppointment(patient, doctor);

  return {
    patient,
    doctor,
    availability,
    appointment
  };
}

export function getRandomEmail(): string {
  const runId = global.testRunId || Date.now().toString(36);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 8);
  return `test${runId}-${timestamp}-${random}@example.com`;
}

export function getRandomCPF(): string {
  const runId = global.testRunId || Date.now().toString(36);
  const userNum = getNextUserNumber();
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 3);

  const base = `${userNum}${timestamp}${random}${runId}`
    .replace(/[^0-9]/g, "")
    .slice(0, 9)
    .padStart(9, "0");
  return base + "00";
}

export function createAuthHeaders(userId: string, register: string) {
  const token = jwt.sign(
    { userId, register },
    process.env.JWT_SECRET || "test-jwt-secret"
  );
  return {
    authorization: `Bearer ${token}`
  };
}
