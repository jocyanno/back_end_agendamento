"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsuarioLogadoIsAdminOrAttendant = exports.getUsuarioLogadoIsAdmin = exports.getUsuarioLogado = exports.selectUsuario = void 0;
exports.authenticateUser = authenticateUser;
exports.searchUsuario = searchUsuario;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.getUserExisting = getUserExisting;
exports.createUser = createUser;
exports.createUserAdmin = createUserAdmin;
exports.updateUser = updateUser;
exports.getAllUsers = getAllUsers;
exports.getAllDoctors = getAllDoctors;
exports.updateUserByDoctor = updateUserByDoctor;
exports.deleteUser = deleteUser;
exports.getDoctorAvailability = getDoctorAvailability;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const unauthorized_1 = require("../_errors/unauthorized");
const bad_request_1 = require("../_errors/bad-request");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const not_found_1 = require("../_errors/not-found");
exports.selectUsuario = {
    id: true,
    name: true,
    email: true,
    image: true,
    birthDate: true,
    cpf: true,
    phone: true,
    address: true,
    numberOfAddress: true,
    complement: true,
    city: true,
    state: true,
    zipCode: true,
    country: true,
    cid: true,
    register: true,
    createdAt: true,
    updatedAt: true
};
async function authenticateUser(email, password, fastify) {
    const user = await prisma_1.prisma.users.findUnique({
        where: { email },
        select: {
            password: true,
            ...exports.selectUsuario
        }
    });
    if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
        throw new unauthorized_1.Unauthorized("Invalid credentials");
    }
    const { password: _, ...userWithoutPassword } = user;
    const token = await fastify.jwt.sign({ userId: user.id, register: user.register }, { expiresIn: "7d" });
    return {
        token,
        usuario: userWithoutPassword
    };
}
async function searchUsuario(usuarioId) {
    const searchUserExisting = await prisma_1.prisma.users.findUnique({
        where: {
            id: usuarioId
        },
        select: exports.selectUsuario
    });
    if (!searchUserExisting) {
        throw new not_found_1.NotFound("User not found");
    }
    return searchUserExisting;
}
const getUsuarioLogado = async (request) => {
    const usuarioId = request.usuario.id;
    return searchUsuario(usuarioId);
};
exports.getUsuarioLogado = getUsuarioLogado;
const getUsuarioLogadoIsAdmin = async (request) => {
    const { id: usuarioId, register } = request.usuario;
    // Verifica diretamente do token se é doctor, mais eficiente
    if (register !== "doctor") {
        throw new unauthorized_1.Unauthorized("User is not doctor");
    }
    return searchUsuario(usuarioId);
};
exports.getUsuarioLogadoIsAdmin = getUsuarioLogadoIsAdmin;
const getUsuarioLogadoIsAdminOrAttendant = async (request) => {
    const { id: usuarioId, register } = request.usuario;
    // Verifica diretamente do token se é doctor, mais eficiente
    if (register !== "doctor" && register !== "attendant") {
        throw new unauthorized_1.Unauthorized("User is not doctor");
    }
    return searchUsuario(usuarioId);
};
exports.getUsuarioLogadoIsAdminOrAttendant = getUsuarioLogadoIsAdminOrAttendant;
async function getUserById(usuarioId) {
    const user = await prisma_1.prisma.users.findUnique({
        where: {
            id: usuarioId
        },
        select: exports.selectUsuario
    });
    if (!user) {
        throw new not_found_1.NotFound("User not found");
    }
    return user;
}
async function getUserByEmail(email) {
    const user = await prisma_1.prisma.users.findUnique({
        where: {
            email
        },
        select: exports.selectUsuario
    });
    if (!user) {
        throw new not_found_1.NotFound("User not found");
    }
    return user;
}
async function getUserExisting({ email, cpf }) {
    let user = null;
    if (email) {
        user = await prisma_1.prisma.users.findUnique({
            where: {
                email
            },
            select: exports.selectUsuario
        });
        if (user) {
            throw new bad_request_1.BadRequest("User already exists");
        }
    }
    if (cpf) {
        user = await prisma_1.prisma.users.findUnique({
            where: {
                cpf
            },
            select: exports.selectUsuario
        });
        if (user) {
            throw new bad_request_1.BadRequest("User already exists");
        }
    }
    return;
}
async function createUser(data) {
    if (data.register === "doctor") {
        throw new bad_request_1.BadRequest("Register doctor is not allowed");
    }
    if (!data.password) {
        throw new bad_request_1.BadRequest("Password is required");
    }
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    const user = await prisma_1.prisma.users.create({
        data: {
            ...data,
            birthDate: data.birthDate
                ? (0, moment_timezone_1.default)(data.birthDate).isValid()
                    ? (0, moment_timezone_1.default)(data.birthDate).toDate()
                    : null
                : null,
            password: hashedPassword
        },
        select: exports.selectUsuario
    });
    return user;
}
async function createUserAdmin(data) {
    if (!data.password) {
        throw new bad_request_1.BadRequest("Password is required");
    }
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    const user = await prisma_1.prisma.users.create({
        data: {
            ...data,
            birthDate: data.birthDate
                ? (0, moment_timezone_1.default)(data.birthDate).isValid()
                    ? (0, moment_timezone_1.default)(data.birthDate).toDate()
                    : null
                : null,
            password: hashedPassword
        },
        select: exports.selectUsuario
    });
    return user;
}
async function updateUser(usuarioId, data) {
    // Remover campo 'cid' se presente - apenas admins podem alterar
    const { cid, ...allowedData } = data;
    const searchUser = await prisma_1.prisma.users.findUnique({
        where: {
            id: usuarioId
        },
        select: exports.selectUsuario
    });
    if (!searchUser) {
        throw new not_found_1.NotFound("User not found");
    }
    if (allowedData.email && allowedData.email !== searchUser.email) {
        if (typeof allowedData.email === "string") {
            // Verificar se já existe outro usuário com este email
            const existingUser = await prisma_1.prisma.users.findUnique({
                where: { email: allowedData.email },
                select: { id: true }
            });
            if (existingUser && existingUser.id !== usuarioId) {
                throw new bad_request_1.BadRequest("User already exists");
            }
        }
    }
    if (allowedData.cpf && allowedData.cpf !== searchUser.cpf) {
        if (typeof allowedData.cpf === "string") {
            // Verificar se já existe outro usuário com este CPF
            const existingUser = await prisma_1.prisma.users.findUnique({
                where: { cpf: allowedData.cpf },
                select: { id: true }
            });
            if (existingUser && existingUser.id !== usuarioId) {
                throw new bad_request_1.BadRequest("User already exists");
            }
        }
    }
    if (allowedData.password) {
        allowedData.password = await bcrypt_1.default.hash(allowedData.password, 10);
    }
    // Converter birthDate para Date se for string
    if (allowedData.birthDate && typeof allowedData.birthDate === "string") {
        allowedData.birthDate = new Date(allowedData.birthDate);
    }
    // Remove campos com null, pois Prisma não aceita null para Date por padrão
    const dadosLimpos = Object.fromEntries(Object.entries(allowedData).filter(([_, value]) => value !== null));
    try {
        const usuarioAtualizado = await prisma_1.prisma.users.update({
            where: { id: usuarioId },
            data: {
                ...dadosLimpos
            },
            select: exports.selectUsuario
        });
        return usuarioAtualizado;
    }
    catch (err) {
        if (err.code === "P2002") {
            throw new bad_request_1.BadRequest("User already exists");
        }
        throw err;
    }
}
async function getAllUsers() {
    const users = await prisma_1.prisma.users.findMany({
        where: {
            OR: [
                { register: "patient" },
                { register: "parents" }
            ]
        },
        select: exports.selectUsuario,
        orderBy: [
            { name: "asc" }
        ]
    });
    return users;
}
async function getAllDoctors() {
    const doctors = await prisma_1.prisma.users.findMany({
        where: {
            register: "doctor"
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            cid: true,
            register: true,
            createdAt: true
        },
        orderBy: {
            name: "asc"
        }
    });
    return doctors;
}
async function updateUserByDoctor(targetUserId, data) {
    // Esta é a única função que permite alterar o campo 'cid'
    // Apenas administradores (doctors) podem chamar esta função
    const searchUser = await prisma_1.prisma.users.findUnique({
        where: {
            id: targetUserId
        },
        select: exports.selectUsuario
    });
    if (!searchUser) {
        throw new not_found_1.NotFound("User not found");
    }
    if (data.email && data.email !== searchUser.email) {
        if (typeof data.email === "string") {
            // Verificar se já existe outro usuário com este email
            const existingUser = await prisma_1.prisma.users.findUnique({
                where: { email: data.email },
                select: { id: true }
            });
            if (existingUser && existingUser.id !== targetUserId) {
                throw new bad_request_1.BadRequest("User already exists");
            }
        }
    }
    if (data.cpf && data.cpf !== searchUser.cpf) {
        if (typeof data.cpf === "string") {
            // Verificar se já existe outro usuário com este CPF
            const existingUser = await prisma_1.prisma.users.findUnique({
                where: { cpf: data.cpf },
                select: { id: true }
            });
            if (existingUser && existingUser.id !== targetUserId) {
                throw new bad_request_1.BadRequest("User already exists");
            }
        }
    }
    if (data.password) {
        data.password = await bcrypt_1.default.hash(data.password, 10);
    }
    // Converter birthDate para Date se for string
    if (data.birthDate && typeof data.birthDate === "string") {
        data.birthDate = new Date(data.birthDate);
    }
    // Remove campos com null, pois Prisma não aceita null para Date por padrão
    const dadosLimpos = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== null));
    try {
        const usuarioAtualizado = await prisma_1.prisma.users.update({
            where: { id: targetUserId },
            data: {
                ...dadosLimpos
            },
            select: exports.selectUsuario
        });
        return usuarioAtualizado;
    }
    catch (err) {
        if (err.code === "P2002") {
            throw new bad_request_1.BadRequest("User already exists");
        }
        throw err;
    }
}
async function deleteUser(usuarioId, adminId) {
    // Verificar se o usuário a ser deletado existe
    const searchUser = await prisma_1.prisma.users.findUnique({
        where: {
            id: usuarioId
        },
        select: exports.selectUsuario
    });
    if (!searchUser) {
        throw new not_found_1.NotFound("User not found");
    }
    // Verificar se o admin não está tentando deletar a si mesmo
    if (usuarioId === adminId) {
        throw new bad_request_1.BadRequest("Admin cannot delete themselves");
    }
    // Deletar o usuário
    await prisma_1.prisma.users.delete({
        where: {
            id: usuarioId
        }
    });
    return { message: "User deleted successfully" };
}
// Buscar disponibilidades do médico
async function getDoctorAvailability(doctorId) {
    const availabilities = await prisma_1.prisma.availability.findMany({
        where: {
            doctorId,
            isActive: true
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    });
    return availabilities;
}
//# sourceMappingURL=usuarioService.service.js.map