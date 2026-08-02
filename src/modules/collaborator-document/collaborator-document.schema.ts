import { z } from "zod";

export const linkDocumentsSchema = z.object({
  documentTypeIds: z
    .array(z.uuid("documentTypeId inválido"))
    .min(1, "Informe ao menos um documentTypeId")
    .transform((ids) => [...new Set(ids)]),
});

export type LinkDocumentsInput = z.infer<typeof linkDocumentsSchema>;
