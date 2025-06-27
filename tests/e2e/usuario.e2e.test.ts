import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { createTestServer } from "../helpers/testServer";
import {
  createTestUser,
  createTestDoctor,
  createAuthHeaders,
  getRandomEmail,
  getRandomCPF
} from "../helpers/testHelpers";

describe("Usuario Routes E2E", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /user/login", () => {
    it("should login user successfully", async () => {
      const userData = {
        email: getRandomEmail().toLowerCase(),
        password: "12345678",
        cpf: getRandomCPF()
      };

      const createdUser = await createTestUser(userData);
      console.log("Created user:", createdUser.email, createdUser.id);

      const response = await app.inject({
        method: "POST",
        url: "/user/login",
        payload: {
          email: userData.email,
          password: userData.password
        }
      });

      if (response.statusCode !== 200) {
        console.log("Login failed:", response.payload);
      }

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.token).toBeDefined();
      expect(result.data.usuario.email).toBe(userData.email);
      expect(result.data.usuario.password).toBeUndefined();
    });

    it("should reject invalid credentials", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/user/login",
        payload: {
          email: "invalid@test.com",
          password: "wrongpassword"
        }
      });

      expect(response.statusCode).toBe(401);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("error");
    });

    it("should validate required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/user/login",
        payload: {
          email: "invalid-email"
          // password missing
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /user", () => {
    it("should create new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF(),
        register: "patient",
        phone: "+5511999999999"
      };

      const response = await app.inject({
        method: "POST",
        url: "/user",
        payload: userData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.token).toBeDefined();
      expect(result.data.usuario.email).toBe(userData.email.toLowerCase());
      expect(result.data.usuario.register).toBe("patient");
    });

    it("should prevent duplicate email", async () => {
      const email = getRandomEmail();
      await createTestUser({
        email,
        password: "12345678",
        cpf: getRandomCPF()
      });

      const response = await app.inject({
        method: "POST",
        url: "/user",
        payload: {
          name: "Test User 2",
          email,
          password: "12345678",
          cpf: getRandomCPF(),
          register: "patient"
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it("should prevent duplicate CPF", async () => {
      const cpf = getRandomCPF();
      await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf
      });

      const response = await app.inject({
        method: "POST",
        url: "/user",
        payload: {
          name: "Test User 2",
          email: getRandomEmail(),
          password: "12345678",
          cpf,
          register: "patient"
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it("should prevent creating doctor via public endpoint", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/user",
        payload: {
          name: "Dr. Test",
          email: getRandomEmail(),
          password: "12345678",
          cpf: getRandomCPF(),
          register: "doctor"
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /user", () => {
    it("should return current user data", async () => {
      const user = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF()
      });

      const response = await app.inject({
        method: "GET",
        url: "/user",
        headers: createAuthHeaders(user.id, user.register)
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.id).toBe(user.id);
      expect(result.data.email).toBe(user.email);
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/user"
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("PUT /user", () => {
    it("should update user data", async () => {
      const user = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF()
      });

      const updateData = {
        name: "Updated Name",
        phone: "+5511888888888"
      };

      const response = await app.inject({
        method: "PUT",
        url: "/user",
        headers: createAuthHeaders(user.id, user.register),
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.name).toBe(updateData.name);
      expect(result.data.phone).toBe(updateData.phone);
    });

    it("should require authentication", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/user",
        payload: { name: "Test" }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /user/admin", () => {
    it("should allow admin to create doctor", async () => {
      const admin = await createTestDoctor();

      const doctorData = {
        name: "Dr. Admin Created",
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF(),
        register: "doctor"
      };

      const response = await app.inject({
        method: "POST",
        url: "/user/admin",
        headers: createAuthHeaders(admin.id, admin.register),
        payload: doctorData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.usuario.register).toBe("doctor");
    });

    it("should require admin authentication", async () => {
      const patient = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF(),
        register: "patient"
      });

      const response = await app.inject({
        method: "POST",
        url: "/user/admin",
        headers: createAuthHeaders(patient.id, patient.register),
        payload: {
          name: "Dr. Test",
          email: getRandomEmail(),
          password: "12345678",
          cpf: getRandomCPF(),
          register: "doctor"
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("DELETE /user/:id", () => {
    it("should allow admin to delete user", async () => {
      const admin = await createTestDoctor();
      const user = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF()
      });

      expect(user.id).toBeDefined();

      const response = await app.inject({
        method: "DELETE",
        url: `/user/${user.id}`,
        headers: createAuthHeaders(admin.id, admin.register)
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.status).toBe("success");
      expect(result.data.message).toBe("User deleted successfully");
    });

    it("should prevent admin from deleting themselves", async () => {
      const admin = await createTestDoctor();

      const response = await app.inject({
        method: "DELETE",
        url: `/user/${admin.id}`,
        headers: createAuthHeaders(admin.id, admin.register)
      });

      expect(response.statusCode).toBe(400);
    });

    it("should require admin authentication", async () => {
      const patient = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF()
      });

      const user = await createTestUser({
        email: getRandomEmail(),
        password: "12345678",
        cpf: getRandomCPF()
      });

      const response = await app.inject({
        method: "DELETE",
        url: `/user/${user.id}`,
        headers: createAuthHeaders(patient.id, patient.register)
      });

      expect(response.statusCode).toBe(401);
    });

    it("should return 404 for non-existent user", async () => {
      const admin = await createTestDoctor();

      const response = await app.inject({
        method: "DELETE",
        url: "/user/non-existent-id",
        headers: createAuthHeaders(admin.id, admin.register)
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
