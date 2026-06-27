import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { uploadsDir } from "./middleware/upload.js";
import { catalogRouter } from "./routes/catalog.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { accountRouter } from "./routes/account.routes.js";
import { bookingRouter } from "./routes/booking.routes.js";
import { operatorRouter } from "./routes/operator.routes.js";
import { superAdminRouter } from "./routes/superadmin.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

/** Build the Express app (no DB connection / no listen). */
export function createApp(): Express {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "bookie-api" }));

  // uploaded vehicle media (images/videos)
  app.use("/uploads", express.static(uploadsDir));

  app.use("/", catalogRouter);
  app.use("/auth", authRouter);
  app.use("/account", accountRouter);
  app.use("/bookings", bookingRouter);
  app.use("/operator", operatorRouter);
  app.use("/sa", superAdminRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
