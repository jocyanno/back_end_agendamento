"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentRoutes = appointmentRoutes;
const appointmentController_1 = require("../../controllers/appointmentController");
const appointment_1 = require("../../docs/appointment");
async function appointmentRoutes(app) {
    // Rotas de agendamento
    app
        .withTypeProvider()
        .post("/appointments", appointment_1.appointmentDocs.postAppointment, appointmentController_1.postAppointment);
    app
        .withTypeProvider()
        .post("/appointments/create-for-patient", appointment_1.appointmentDocs.postAppointmentForPatient, appointmentController_1.postAppointmentForPatient);
    app
        .withTypeProvider()
        .get("/appointments/available-slots", appointment_1.appointmentDocs.getAvailableSlots, appointmentController_1.getAvailableSlots);
    app
        .withTypeProvider()
        .get("/appointments/my", appointment_1.appointmentDocs.getMyAppointments, appointmentController_1.getMyAppointments);
    app
        .withTypeProvider()
        .get("/appointments/today", appointment_1.appointmentDocs.getTodayAppointments, appointmentController_1.getTodayAppointments);
    app
        .withTypeProvider()
        .put("/appointments/:id/status", appointment_1.appointmentDocs.putAppointmentStatus, appointmentController_1.putAppointmentStatus);
    // Rotas de disponibilidade
    app
        .withTypeProvider()
        .post("/availability", appointment_1.appointmentDocs.postAvailability, appointmentController_1.postAvailability);
    app
        .withTypeProvider()
        .get("/availability/:doctorId", appointment_1.appointmentDocs.getAvailability, appointmentController_1.getAvailability);
}
//# sourceMappingURL=appointmentRoutes.js.map