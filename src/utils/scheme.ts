import { z } from "zod/v4";

export const headersSchema = z.object({
  authorization: z.string()
});
