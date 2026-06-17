import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { embeddedRouter } from "./routes/embeddedRouter";
import { router } from "./routes";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true
    })
  );
  app.use(express.json({ limit: "5mb" }));
  app.use("/api", env.SYNCUP_EMBEDDED_DATA === "1" ? embeddedRouter : router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
