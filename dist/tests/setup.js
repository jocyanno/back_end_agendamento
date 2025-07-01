"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.beforeAll)(async () => {
    // Setup básico para testes
    process.env.NODE_ENV = "test";
});
(0, vitest_1.afterAll)(async () => {
    // Cleanup final
});
//# sourceMappingURL=setup.js.map