import http from "http";
import { env } from "./config/env";
import { createApp } from "./app";
import { prisma } from "./config/prisma";

let server: http.Server | null = null;

export const startServer = async () => {
  if (server) {
    return server;
  }

  const app = createApp();
  server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server!.listen(env.PORT, () => resolve());
  });

  console.log(`SyncUp API listening on port ${env.PORT}`);
  return server;
};

export const stopServer = async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server!.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await prisma.$disconnect();
  server = null;
};

if (require.main === module) {
  startServer().catch(async (error) => {
    console.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
