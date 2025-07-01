"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceRoutes = attendanceRoutes;
const attendanceController_1 = require("@/controllers/attendanceController");
const attendance_1 = require("@/docs/attendance");
async function attendanceRoutes(app) {
    app.withTypeProvider().post("/attendances", {
        schema: attendance_1.attendanceDocs.postAttendance.schema,
        preHandler: attendance_1.attendanceDocs.postAttendance.preHandler,
        handler: attendanceController_1.postAttendance
    });
    app.withTypeProvider().get("/attendances/my", {
        schema: attendance_1.attendanceDocs.getMyAttendances.schema,
        preHandler: attendance_1.attendanceDocs.getMyAttendances.preHandler,
        handler: attendanceController_1.getMyAttendances
    });
    app.withTypeProvider().get("/attendances/patient/:id", {
        schema: attendance_1.attendanceDocs.getPatientAttendances.schema,
        preHandler: attendance_1.attendanceDocs.getPatientAttendances.preHandler,
        handler: attendanceController_1.getPatientAttendances
    });
}
//# sourceMappingURL=attendanceRoutes.js.map