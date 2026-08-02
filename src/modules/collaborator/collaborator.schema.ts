import { z } from "zod";

export const createCollaboratorSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.email("Email inválido"),
});

export const updateCollaboratorSchema = createCollaboratorSchema.partial();

export const collaboratorParamsSchema = z.object({
  id: z.uuid("id inválido"),
});

export type CreateCollaboratorInput = z.infer<typeof createCollaboratorSchema>;
export type UpdateCollaboratorInput = z.infer<typeof updateCollaboratorSchema>;
