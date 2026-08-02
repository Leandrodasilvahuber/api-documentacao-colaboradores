import { linkDocumentsSchema } from "../collaborator-document.schema";

describe("linkDocumentsSchema", () => {
  it("removes duplicate documentTypeIds, keeping the first occurrence order", () => {
    const id1 = "b3e1c1a0-1111-4111-8111-111111111111";
    const id2 = "b3e1c1a0-2222-4222-8222-222222222222";

    const result = linkDocumentsSchema.parse({ documentTypeIds: [id1, id1, id2, id1] });

    expect(result.documentTypeIds).toEqual([id1, id2]);
  });

  it("keeps the array unchanged when there are no duplicates", () => {
    const id1 = "b3e1c1a0-1111-4111-8111-111111111111";
    const id2 = "b3e1c1a0-2222-4222-8222-222222222222";

    const result = linkDocumentsSchema.parse({ documentTypeIds: [id1, id2] });

    expect(result.documentTypeIds).toEqual([id1, id2]);
  });

  it("still rejects an empty array", () => {
    expect(() => linkDocumentsSchema.parse({ documentTypeIds: [] })).toThrow();
  });

  it("still rejects a non-uuid item before deduplicating", () => {
    expect(() => linkDocumentsSchema.parse({ documentTypeIds: ["not-a-uuid"] })).toThrow();
  });
});
