import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform
} from "fastify-type-provider-zod";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { errorHandler } from "@/error-handler";
import { usuarioRoutes } from "@/routes/user/usuarioRoutes";
import { appointmentRoutes } from "@/routes/appointment/appointmentRoutes";

const app = fastify();

app.register(fastifyCors, {
  origin: "*"
});

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "your-secret-key"
});

app.register(import("@fastify/multipart"), {
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  }
});

app.register(fastifySwagger, {
  swagger: {
    consumes: ["application/json", "multipart/form-data"],
    produces: ["application/json"],
    info: {
      title: "pass.in",
      description:
        "Especificações da API para o back-end da aplicação Agendamento",
      version: "1/"
    }
  },
  transform: jsonSchemaTransform
});

app.register(fastifySwaggerUI, {
  routePrefix: "/docs"
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(usuarioRoutes);
app.register(appointmentRoutes);

app.setErrorHandler(errorHandler);

app
  .listen({
    host: "0.0.0.0",
    port: 3000
  })
  .then(() => {
    console.log("🚀 HTTP Server Running!");
  })
  .catch((err) => {
    console.error("Erro ao subir o servidor:", err);
    process.exit(1);
  });
