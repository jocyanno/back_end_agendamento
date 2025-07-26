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
        .get("/appointments", appointment_1.appointmentDocs.getAvailableSlotsByPeriod, appointmentController_1.getAvailableSlotsByPeriod);
    app
        .withTypeProvider()
        .get("/appointments/my", appointment_1.appointmentDocs.getMyAppointments, appointmentController_1.getMyAppointments);
    app
        .withTypeProvider()
        .get("/appointments/user/:userId", appointment_1.appointmentDocs.getUserAppointments, appointmentController_1.getUserAppointments);
    app
        .withTypeProvider()
        .get("/appointments/today", appointment_1.appointmentDocs.getTodayAppointments, appointmentController_1.getTodayAppointments);
    app
        .withTypeProvider()
        .put("/appointments/:id/status", appointment_1.appointmentDocs.putAppointmentStatus, appointmentController_1.putAppointmentStatus);
    app
        .withTypeProvider()
        .put("/appointments/:appointmentId/cancel", appointment_1.appointmentDocs.cancelAppointmentByAttendant, appointmentController_1.cancelAppointmentByAttendantController);
    app
        .withTypeProvider()
        .get("/appointments/check-availability/:patientId/:doctorId", appointment_1.appointmentDocs.checkPatientDoctorAvailability, appointmentController_1.checkPatientDoctorAvailability);
    app
        .withTypeProvider()
        .post("/appointments/fix-timezones", appointment_1.appointmentDocs.fixAppointmentTimezones, appointmentController_1.fixAppointmentTimezonesController);
    // Rotas de disponibilidade
    app
        .withTypeProvider()
        .post("/availability", appointment_1.appointmentDocs.postAvailability, appointmentController_1.postAvailability);
    app
        .withTypeProvider()
        .get("/availability/:doctorId", appointment_1.appointmentDocs.getAvailability, appointmentController_1.getAvailability);
    app
        .withTypeProvider()
        .delete("/availability/:availabilityId", appointment_1.appointmentDocs.deleteAvailability, appointmentController_1.deleteAvailability);
}
//# sourceMappingURL=appointmentRoutes.js.map