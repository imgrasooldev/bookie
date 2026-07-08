import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openapiSpec } from "./docs/openapi.js";
import { uploadsDir } from "./middleware/upload.js";
import { catalogRouter } from "./routes/catalog.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { accountRouter } from "./routes/account.routes.js";
import { bookingRouter } from "./routes/booking.routes.js";
import { paymentRouter } from "./routes/payment.routes.js";
import { operatorRouter } from "./routes/operator.routes.js";
import { superAdminRouter } from "./routes/superadmin.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

/** Build the Express app (no DB connection / no listen). */
export function createApp(): Express {
  const app = express();
  app.set("trust proxy", 1); // behind fly.io/proxy — use X-Forwarded-For for req.ip (rate limiting)
  // CSP is disabled because Swagger UI (/docs) injects inline scripts/styles; the
  // API otherwise only serves JSON, so there's no HTML surface CSP would protect.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "bookie-api" }));

  // API docs: raw OpenAPI spec + interactive Swagger UI
  app.get("/openapi.json", (_req, res) => res.json(openapiSpec));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: "Bookie API — Docs" }));

  // uploaded vehicle media (images/videos)
  app.use("/uploads", express.static(uploadsDir));

  app.use("/", catalogRouter);
  app.use("/auth", authRouter);
  app.use("/account", accountRouter);
  app.use("/bookings", bookingRouter);
  app.use("/payments", paymentRouter);
  app.use("/operator", operatorRouter);
  app.use("/sa", superAdminRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
