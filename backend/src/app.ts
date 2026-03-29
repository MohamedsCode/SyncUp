import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { router } from "./routes";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true
    })
  );
  app.use(express.json());
  app.use("/api", router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
