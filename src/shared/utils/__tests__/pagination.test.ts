import { buildPaginationMeta, getPaginationParams, paginationSchema } from "../pagination";

describe("paginationSchema", () => {
  it("defaults page and limit when omitted", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 10 });
  });

  it("rejects a limit above 100", () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects a page below 1", () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });
});

describe("getPaginationParams", () => {
  it("computes skip from page and limit", () => {
    expect(getPaginationParams({ page: 3, limit: 10 })).toEqual({ skip: 20, take: 10 });
  });

  it("skips nothing on the first page", () => {
    expect(getPaginationParams({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
  });
});

describe("buildPaginationMeta", () => {
  it("reports zero total pages when there are no records", () => {
    expect(buildPaginationMeta(0, { page: 1, limit: 10 })).toEqual({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  it("still returns the requested page when it is beyond totalPages", () => {
    expect(buildPaginationMeta(5, { page: 9, limit: 10 })).toEqual({
      total: 5,
      page: 9,
      limit: 10,
      totalPages: 1,
    });
  });

  it("rounds totalPages up when total isn't a multiple of limit", () => {
    expect(buildPaginationMeta(21, { page: 1, limit: 10 })).toEqual({
      total: 21,
      page: 1,
      limit: 10,
      totalPages: 3,
    });
  });
});
