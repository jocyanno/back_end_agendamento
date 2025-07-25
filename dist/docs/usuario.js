"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuarioDocs = void 0;
const v4_1 = require("zod/v4");
const auth_1 = require("../middlewares/auth");
const scheme_1 = require("../utils/scheme");
const usuario_1 = require("../types/usuario");
const errorResponseSchema = v4_1.z.object({
    status: v4_1.z.literal("error"),
    message: v4_1.z.string()
});
class usuarioDocs {
}
exports.usuarioDocs = usuarioDocs;
usuarioDocs.getUsuario = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Dados do usuário logado",
        description: "Retorna os dados do usuário logado",
        headers: scheme_1.headersSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: usuario_1.responseUsuarioSchema
            }),
            400: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.getDoctors = {
    schema: {
        tags: ["Usuario"],
        summary: "Listar médicos disponíveis",
        description: "Retorna todos os médicos cadastrados no sistema",
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(usuario_1.responseDoctorSchema)
            }),
            500: errorResponseSchema
        }
    }
};
usuarioDocs.getFormData = {
    schema: {
        tags: ["Usuario"],
        summary: "Obter dados para formulário de criação de usuário",
        description: "Retorna médicos e tipos de registro disponíveis para o formulário",
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.object({
                    doctors: v4_1.z.array(usuario_1.responseDoctorSchema),
                    registerTypes: v4_1.z.array(v4_1.z.object({
                        value: v4_1.z.string(),
                        label: v4_1.z.string()
                    }))
                })
            }),
            500: errorResponseSchema
        }
    }
};
usuarioDocs.getAllUsuarios = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Listar todos os usuários",
        description: "Retorna todos os usuários cadastrados no sistema (apenas médicos podem acessar)",
        headers: scheme_1.headersSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(usuario_1.responseUsuarioSchema)
            }),
            401: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.getUsuariosByRegistrar = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Listar usuários registrados por um médico",
        description: "Retorna todos os usuários registrados por um médico específico (apenas médicos podem acessar)",
        headers: scheme_1.headersSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(usuario_1.responseUsuarioSchema)
            }),
            401: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.getPacientesByDoctor = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Listar pacientes de um médico (attendant)",
        description: "Retorna todos os pacientes registrados por um médico específico (apenas atendentes podem acessar)",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            doctorId: v4_1.z.string().describe("ID do médico")
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.array(usuario_1.responseUsuarioSchema)
            }),
            401: errorResponseSchema,
            403: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.createPacienteForDoctor = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Criar paciente para um médico (attendant)",
        description: "Permite que atendentes criem pacientes para um médico específico. O paciente será automaticamente registrado pelo médico.",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            doctorId: v4_1.z.string().describe("ID do médico")
        }),
        body: usuario_1.requestUsuarioSchema,
        response: {
            201: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.object({
                    paciente: usuario_1.responseUsuarioSchema
                })
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.getUsuarioById = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Buscar usuário por ID",
        description: "Retorna todas as informações de um usuário específico pelo ID. Apenas médicos podem acessar.",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            id: v4_1.z.string().describe("ID do usuário")
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: usuario_1.responseUsuarioSchema
            }),
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.putUsuarioByDoctor = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Atualizar dados de usuário (médico)",
        description: "Permite que médicos atualizem os dados de qualquer usuário do sistema, incluindo o campo CID",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            id: v4_1.z.string().describe("ID do usuário a ser atualizado")
        }),
        body: usuario_1.editUsuarioByAdminSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: usuario_1.responseUsuarioSchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            403: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.loginUsuario = {
    schema: {
        tags: ["Usuario"],
        summary: "Login do usuário",
        description: "Login do usuário",
        body: v4_1.z.object({
            email: v4_1.z.string().transform((value) => value.toLowerCase()),
            password: v4_1.z.string()
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: usuario_1.responseUsuarioLoginSchema
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.postUsuario = {
    schema: {
        tags: ["Usuario"],
        summary: "Criar um novo usuário",
        description: "Cria um novo usuário. O campo registeredBy é opcional e pode ser usado para indicar quem registrou o usuário.",
        body: usuario_1.requestUsuarioSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: usuario_1.responseUsuarioLoginSchema
            }),
            400: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.postUsuarioAdmin = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Criar um novo usuário pelo admin",
        description: "Cria um novo usuário com a role especificada",
        body: usuario_1.requestUsuarioSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: usuario_1.responseUsuarioLoginSchema
            }),
            400: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.putUsuario = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Atualizar os dados do usuário logado",
        description: "Atualiza os dados do usuário logado, os atributos são opcionais",
        headers: scheme_1.headersSchema,
        body: usuario_1.editUsuarioSchema,
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: usuario_1.responseUsuarioSchema
            }),
            400: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
usuarioDocs.deleteUsuario = {
    preHandler: [auth_1.autenticarToken],
    schema: {
        tags: ["Usuario"],
        summary: "Deletar um usuário",
        description: "Deleta um usuário específico. Apenas admins podem deletar usuários.",
        headers: scheme_1.headersSchema,
        params: v4_1.z.object({
            id: v4_1.z.string().describe("ID do usuário a ser deletado")
        }),
        response: {
            200: v4_1.z.object({
                status: v4_1.z.literal("success"),
                data: v4_1.z.object({
                    message: v4_1.z.string()
                })
            }),
            400: errorResponseSchema,
            401: errorResponseSchema,
            404: errorResponseSchema,
            500: errorResponseSchema
        }
    }
};
//# sourceMappingURL=usuario.js.map