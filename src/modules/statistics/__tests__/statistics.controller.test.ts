import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { errorHandler } from "../../../shared/middlewares/errorHandler";
import { statisticsRoutes } from "../statistics.routes";
import { statisticsService } from "../statistics.service";

jest.mock("../statistics.service");

const mockedService = statisticsService as jest.Mocked<typeof statisticsService>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: jest.fn() } as unknown as Request["log"];
    next();
  });
  app.use("/statistics", statisticsRoutes);
  app.use(errorHandler);
  return app;
}

describe("statisticsController (smoke)", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /statistics/completion returns the completion summary", async () => {
    const completion = { total: 50, submitted: 35, pending: 15, percentage: 70 };
    mockedService.getCompletion.mockResolvedValue(completion);

    const res = await request(app).get("/statistics/completion");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(completion);
  });

  it("GET /statistics/pending-ranking returns the ranking array", async () => {
    const ranking = [
      { documentTypeId: "id-1", documentTypeName: "RG", total: 20, submitted: 12, pending: 8 },
    ];
    mockedService.getPendingRanking.mockResolvedValue(ranking);

    const res = await request(app).get("/statistics/pending-ranking");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(ranking);
  });

  it("GET /statistics/recent-submissions returns the recent submissions", async () => {
    mockedService.getRecentSubmissions.mockResolvedValue([]);

    const res = await request(app).get("/statistics/recent-submissions").query({ limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mockedService.getRecentSubmissions).toHaveBeenCalledWith({ limit: 5 });
  });

  it("GET /statistics/recent-submissions returns 400 for an invalid limit", async () => {
    const res = await request(app).get("/statistics/recent-submissions").query({ limit: 101 });

    expect(res.status).toBe(400);
    expect(mockedService.getRecentSubmissions).not.toHaveBeenCalled();
  });
});
