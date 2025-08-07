import { z } from "zod";

export const headersSchema = z.object({
  authorization: z.string()
});
