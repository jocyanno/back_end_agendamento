import "@fastify/jwt";
import { Register } from "@prisma/client";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string; register: Register };
    user: { userId: string; register: Register };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    jwt: {
      sign: (payload: any, options?: any) => Promise<string>;
      verify: (token: string, options?: any) => Promise<any>;
    };
    jwtVerify: () => Promise<void>;
    user: { userId: string; register: Register };
  }

  interface FastifyInstance {
    jwt: {
      sign: (payload: any, options?: any) => Promise<string>;
      verify: (token: string, options?: any) => Promise<any>;
    };
  }
}
