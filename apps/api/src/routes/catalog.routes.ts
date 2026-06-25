import { Router } from "express";
import { z } from "zod";
import { City } from "../models/City.js";
import { Trip } from "../models/Trip.js";
import "../models/Operator.js"; // register Operator model for populate("operator")
import { VERTICALS, SERVICE_TYPES } from "../lib/verticals.js";
import { serializeTrip } from "../lib/serialize.js";
import { ah, HttpError } from "../middleware/error.js";

export const catalogRouter = Router();

// GET /verticals
catalogRouter.get("/verticals", (_req, res) => {
  res.json(VERTICALS);
});

// GET /cities
catalogRouter.get(
  "/cities",
  ah(async (_req, res) => {
    const cities = await City.find().sort({ name: 1 }).lean();
    res.json(cities.map((c) => ({ id: c.code, name: c.name })));
  }),
);

const searchSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES as [string, ...string[]]).default("BUS"),
  originId: z.string().optional(),
  destinationId: z.string().optional(),
  date: z.string().optional(),
  passengers: z.coerce.number().int().positive().optional(),
});

// GET /trips?serviceType=BUS&originId=lhe&destinationId=isb
catalogRouter.get(
  "/trips",
  ah(async (req, res) => {
    const q = searchSchema.parse(req.query);
    const filter: Record<string, unknown> = {
      serviceType: q.serviceType,
      status: "active",
    };
    if (q.originId) filter.originCode = q.originId;
    if (q.destinationId) filter.destinationCode = q.destinationId;

    const trips = await Trip.find(filter)
      .populate("operator")
      .sort({ departAt: 1, price: 1 })
      .lean();
    res.json(trips.map(serializeTrip));
  }),
);

// GET /trips/:id
catalogRouter.get(
  "/trips/:id",
  ah(async (req, res) => {
    const trip = await Trip.findById(req.params.id).populate("operator").lean();
    if (!trip) throw new HttpError(404, "Trip not found");
    res.json(serializeTrip(trip));
  }),
);
