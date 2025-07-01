"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(0, vitest_1.beforeAll)(async () => {
    // Usar SQLite para testes E2E
    const testDbPath = path_1.default.join(process.cwd(), "test.db");
    process.env.DATABASE_URL = `file:${testDbPath}`;
    // Remover banco anterior se existir
    if (fs_1.default.existsSync(testDbPath)) {
        fs_1.default.unlinkSync(testDbPath);
    }
    try {
        // Aplicar schema usando db push
        (0, child_process_1.execSync)("npx prisma db push --force-reset --skip-generate", {
            stdio: "ignore",
            env: { ...process.env, DATABASE_URL: `file:${testDbPath}` }
        });
    }
    catch (error) {
        console.warn("Aviso: Não foi possível configurar banco de teste automaticamente");
    }
});
(0, vitest_1.afterAll)(async () => {
    // Remover banco de teste
    const testDbPath = path_1.default.join(process.cwd(), "test.db");
    if (fs_1.default.existsSync(testDbPath)) {
        try {
            fs_1.default.unlinkSync(testDbPath);
        }
        catch (error) {
            // Ignorar erro se não conseguir deletar
        }
    }
});
//# sourceMappingURL=setup.e2e.js.map