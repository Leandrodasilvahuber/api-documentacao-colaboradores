import { NextFunction, Request, Response } from 'express';
import { statisticsService } from './statistics.service';
import { recentSubmissionsQuerySchema } from './statistics.schema';

export const statisticsController = {
  async completion(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await statisticsService.getCompletion();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async pendingRanking(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await statisticsService.getPendingRanking();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async recentSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = recentSubmissionsQuerySchema.parse(req.query);
      const result = await statisticsService.getRecentSubmissions(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
