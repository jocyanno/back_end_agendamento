"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuarioRoutes = usuarioRoutes;
const usuarioController_1 = require("../../controllers/usuarioController");
const usuario_1 = require("../../docs/usuario");
async function usuarioRoutes(app) {
    app
        .withTypeProvider()
        .get("/user", usuario_1.usuarioDocs.getUsuario, usuarioController_1.getUsuario);
    app
        .withTypeProvider()
        .get("/doctors", usuario_1.usuarioDocs.getDoctors, usuarioController_1.getDoctors);
    app
        .withTypeProvider()
        .get("/users/form-data", usuario_1.usuarioDocs.getFormData, usuarioController_1.getFormData);
    app
        .withTypeProvider()
        .get("/users", usuario_1.usuarioDocs.getAllUsuarios, usuarioController_1.getAllUsuarios);
    app
        .withTypeProvider()
        .get("/users/registrar", usuario_1.usuarioDocs.getUsuariosByRegistrar, usuarioController_1.getUsuariosByRegistrar);
    app
        .withTypeProvider()
        .get("/users/doctor/:doctorId/patients", usuario_1.usuarioDocs.getPacientesByDoctor, usuarioController_1.getPacientesByDoctor);
    app
        .withTypeProvider()
        .post("/users/doctor/:doctorId/patients", usuario_1.usuarioDocs.createPacienteForDoctor, usuarioController_1.createPacienteForDoctor);
    app
        .withTypeProvider()
        .get("/users/:id", usuario_1.usuarioDocs.getUsuarioById, usuarioController_1.getUsuarioById);
    app
        .withTypeProvider()
        .post("/user/login", usuario_1.usuarioDocs.loginUsuario, usuarioController_1.loginUsuario);
    app
        .withTypeProvider()
        .post("/user", usuario_1.usuarioDocs.postUsuario, usuarioController_1.createUsuario);
    app
        .withTypeProvider()
        .post("/user/admin", usuario_1.usuarioDocs.postUsuarioAdmin, usuarioController_1.createUsuarioAdmin);
    app
        .withTypeProvider()
        .put("/user", usuario_1.usuarioDocs.putUsuario, usuarioController_1.updateUsuario);
    app
        .withTypeProvider()
        .put("/user/:id", usuario_1.usuarioDocs.putUsuarioByDoctor, usuarioController_1.updateUsuarioByDoctor);
    app
        .withTypeProvider()
        .delete("/user/:id", usuario_1.usuarioDocs.deleteUsuario, usuarioController_1.deleteUsuario);
}
//# sourceMappingURL=usuarioRoutes.js.map