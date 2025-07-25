"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsuario = getUsuario;
exports.loginUsuario = loginUsuario;
exports.createUsuario = createUsuario;
exports.createUsuarioAdmin = createUsuarioAdmin;
exports.updateUsuario = updateUsuario;
exports.getDoctors = getDoctors;
exports.getAllUsuarios = getAllUsuarios;
exports.getUsuarioById = getUsuarioById;
exports.getUsuariosByRegistrar = getUsuariosByRegistrar;
exports.updateUsuarioByDoctor = updateUsuarioByDoctor;
exports.deleteUsuario = deleteUsuario;
exports.getPacientesByDoctor = getPacientesByDoctor;
exports.createPacienteForDoctor = createPacienteForDoctor;
exports.getFormData = getFormData;
const usuarioService_service_1 = require("../service/usuarioService.service");
async function getUsuario(request, reply) {
    const usuario = await (0, usuarioService_service_1.getUsuarioLogado)(request);
    return reply.status(200).send({
        status: "success",
        data: usuario
    });
}
async function loginUsuario(request, reply) {
    try {
        console.log("=== LOGIN ATTEMPT ===");
        console.log("Headers:", request.headers);
        console.log("Body:", request.body);
        const { email, password } = request.body;
        console.log("Email:", email);
        console.log("Password length:", password?.length);
        if (!email || !password) {
            console.log("Missing email or password");
            return reply.status(400).send({
                status: "error",
                message: "Email e senha são obrigatórios"
            });
        }
        const user = await (0, usuarioService_service_1.authenticateUser)(email, password, request.server);
        console.log("Login successful for:", email);
        return reply.status(200).send({
            status: "success",
            data: { token: user.token, usuario: user.usuario }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return reply.status(401).send({
            status: "error",
            message: error instanceof Error ? error.message : "Credenciais inválidas"
        });
    }
}
async function createUsuario(request, reply) {
    try {
        console.log("=== CREATE USER ATTEMPT ===");
        console.log("Headers:", request.headers);
        console.log("Body:", request.body);
        const parseResult = request.body;
        console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
        await (0, usuarioService_service_1.getUserExisting)({
            email: parseResult.email,
            cpf: parseResult.cpf
        });
        // Usar o registeredBy enviado no JSON ou undefined se não fornecido
        const createUsuario = await (0, usuarioService_service_1.createUser)(parseResult, parseResult.registeredBy || undefined);
        const token = request.server.jwt.sign({ userId: createUsuario.id, register: createUsuario.register }, { expiresIn: "7d" });
        console.log("Usuário criado com sucesso:", createUsuario.email);
        return reply.status(200).send({
            status: "success",
            data: { token, usuario: createUsuario }
        });
    }
    catch (error) {
        console.error("Erro na criação de usuário:", error);
        return reply.status(400).send({
            status: "error",
            message: error instanceof Error ? error.message : "Validation error"
        });
    }
}
async function createUsuarioAdmin(request, reply) {
    // Verificar se o usuário logado é admin
    const admin = await (0, usuarioService_service_1.getUsuarioLogadoIsAdmin)(request);
    const parseResult = request.body;
    console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
    await (0, usuarioService_service_1.getUserExisting)({
        email: parseResult.email,
        cpf: parseResult.cpf
    });
    // Passar o ID do admin como registeredBy
    const createUsuario = await (0, usuarioService_service_1.createUserAdmin)(parseResult, admin.id);
    const token = request.server.jwt.sign({ userId: createUsuario.id, register: createUsuario.register }, { expiresIn: "7d" });
    return reply.status(200).send({
        status: "success",
        data: { token, usuario: createUsuario }
    });
}
async function updateUsuario(request, reply) {
    const usuario = await (0, usuarioService_service_1.getUsuarioLogado)(request);
    const parseResult = request.body;
    const updateUsuario = await (0, usuarioService_service_1.updateUser)(usuario.id, parseResult);
    return reply.code(200).send({
        status: "success",
        data: updateUsuario
    });
}
async function getDoctors(request, reply) {
    const doctors = await (0, usuarioService_service_1.getAllDoctors)();
    return reply.status(200).send({
        status: "success",
        data: doctors
    });
}
async function getAllUsuarios(request, reply) {
    // Verificar se o usuário logado é doctor
    await (0, usuarioService_service_1.getUsuarioLogadoIsAdmin)(request);
    const users = await (0, usuarioService_service_1.getAllUsers)();
    return reply.status(200).send({
        status: "success",
        data: users
    });
}
async function getUsuarioById(request, reply) {
    // Verificar se o usuário logado é doctor
    await (0, usuarioService_service_1.getUsuarioLogadoIsAdmin)(request);
    const { id } = request.params;
    const user = await (0, usuarioService_service_1.getUserById)(id);
    return reply.status(200).send({
        status: "success",
        data: user
    });
}
async function getUsuariosByRegistrar(request, reply) {
    await (0, usuarioService_service_1.getUsuarioLogadoIsAdmin)(request);
    const doctor = await (0, usuarioService_service_1.getUsuarioLogadoIsAdmin)(request);
    const users = await (0, usuarioService_service_1.getUsersByRegistrar)(doctor.id);
    return reply.status(200).send({
        status: "success",
        data: users
    });
}
async function updateUsuarioByDoctor(request, reply) {
    // Verificar se o usuário logado é doctor
    await (0, usuarioService_service_1.getUsuarioLogadoIsAdmin)(request);
    const { id } = request.params;
    const parseResult = request.body;
    const updateUsuario = await (0, usuarioService_service_1.updateUserByDoctor)(id, parseResult);
    return reply.status(200).send({
        status: "success",
        data: updateUsuario
    });
}
async function deleteUsuario(request, reply) {
    // Verificar se o usuário logado é admin
    const admin = await (0, usuarioService_service_1.getUsuarioLogadoIsAdmin)(request);
    // Pegar o ID do usuário a ser deletado dos parâmetros
    const { id } = request.params;
    // Deletar o usuário
    const result = await (0, usuarioService_service_1.deleteUser)(id, admin.id);
    return reply.code(200).send({
        status: "success",
        data: result
    });
}
// Buscar pacientes de um médico (attendant)
async function getPacientesByDoctor(request, reply) {
    // Verificar se o usuário logado é attendant
    const attendant = await (0, usuarioService_service_1.getUsuarioLogado)(request);
    if (attendant.register !== "attendant") {
        return reply.status(403).send({
            status: "error",
            message: "Apenas atendentes podem acessar esta rota"
        });
    }
    const { doctorId } = request.params;
    const patients = await (0, usuarioService_service_1.getPatientsByDoctor)(doctorId);
    return reply.status(200).send({
        status: "success",
        data: patients
    });
}
// Criar paciente para um médico (attendant)
async function createPacienteForDoctor(request, reply) {
    try {
        // Verificar se o usuário logado é attendant
        const attendant = await (0, usuarioService_service_1.getUsuarioLogado)(request);
        if (attendant.register !== "attendant") {
            return reply.status(403).send({
                status: "error",
                message: "Apenas atendentes podem criar pacientes"
            });
        }
        const { doctorId } = request.params;
        const parseResult = request.body;
        console.log("Dados recebidos:", JSON.stringify(parseResult, null, 2));
        await (0, usuarioService_service_1.getUserExisting)({
            email: parseResult.email,
            cpf: parseResult.cpf
        });
        const createPaciente = await (0, usuarioService_service_1.createPatientForDoctor)(parseResult, doctorId);
        return reply.status(201).send({
            status: "success",
            data: { paciente: createPaciente }
        });
    }
    catch (error) {
        console.error("Erro na criação de paciente:", error);
        return reply.status(400).send({
            status: "error",
            message: error instanceof Error ? error.message : "Validation error"
        });
    }
}
// Obter dados para formulário de criação de usuário
async function getFormData(request, reply) {
    try {
        // Buscar médicos disponíveis para o campo registeredBy
        const doctors = await (0, usuarioService_service_1.getAllDoctors)();
        // Definir tipos de registro disponíveis
        const registerTypes = [
            { value: "patient", label: "Paciente" },
            { value: "parents", label: "Responsável" },
            { value: "attendant", label: "Atendente" }
        ];
        return reply.status(200).send({
            status: "success",
            data: {
                doctors,
                registerTypes
            }
        });
    }
    catch (error) {
        console.error("Erro ao buscar dados do formulário:", error);
        return reply.status(500).send({
            status: "error",
            message: "Erro interno do servidor"
        });
    }
}
//# sourceMappingURL=usuarioController.js.map