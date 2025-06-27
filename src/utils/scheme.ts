import { z } from "zod/v3";

export const headersSchema = z.object({
  authorization: z.string()
});
