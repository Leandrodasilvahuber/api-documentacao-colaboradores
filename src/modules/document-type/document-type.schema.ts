import { z } from "zod";

export const createDocumentTypeSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  description: z.string().trim().min(1).nullish(),
});

export const updateDocumentTypeSchema = createDocumentTypeSchema.partial();

export type CreateDocumentTypeInput = z.infer<typeof createDocumentTypeSchema>;
export type UpdateDocumentTypeInput = z.infer<typeof updateDocumentTypeSchema>;
