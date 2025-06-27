import { vi } from "vitest";
import { prismaTest } from "../setup";

vi.mock("@/lib/prisma", () => ({ prisma: prismaTest }));
