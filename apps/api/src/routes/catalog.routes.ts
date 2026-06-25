import { Router } from "express";
import { z } from "zod";
import { City } from "../models/City.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";
import { VERTICALS, SERVICE_TYPES } from "../lib/verticals.js";
import { serializeTrip } from "../lib/serialize.js";
import { ah, HttpError } from "../middleware/error.js";

export const catalogRouter = Router();

const COLORS = ["#1d4ed8", "#b91c1c", "#047857", "#7c3aed", "#0891b2", "#be185d", "#d97706"];

const createTripSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES as [string, ...string[]]),
  operatorName: z.string().min(2),
  title: z.string().min(2),
  originCode: z.string().optional(),
  destinationCode: z.string().optional(),
  departAt: z.string().optional(),
  arriveAt: z.string().optional(),
  durationMin: z.coerce.number().optional(),
  price: z.coerce.number().nonnegative(),
  priceUnit: z.enum(["per_seat", "per_night", "per_person", "fixed", "from"]).optional(),
  seatsAvailable: z.coerce.number().optional(),
  amenities: z.array(z.string()).optional(),
  location: z.string().optional(),
  vehicle: z.string().optional(),
  badge: z.string().optional(),
});

// POST /trips — operator creates a bookable listing (from the admin portal).
catalogRouter.post(
  "/trips",
  ah(async (req, res) => {
    const b = createTripSchema.parse(req.body);
    const operator = await Operator.findOneAndUpdate(
      { name: b.operatorName },
      { $setOnInsert: { name: b.operatorName, rating: 4.5, logoColor: COLORS[Math.floor(Math.random() * COLORS.length)] } },
      { upsert: true, new: true },
    );

    const trip = await Trip.create({
      serviceType: b.serviceType,
      operator: operator._id,
      title: b.title,
      originCode: b.originCode?.toLowerCase(),
      destinationCode: b.destinationCode?.toLowerCase(),
      departAt: b.departAt ? new Date(b.departAt) : undefined,
      arriveAt: b.arriveAt ? new Date(b.arriveAt) : undefined,
      durationMin: b.durationMin,
      price: b.price,
      priceUnit: b.priceUnit ?? "from",
      seatsAvailable: b.seatsAvailable,
      amenities: b.amenities ?? [],
      location: b.location,
      vehicle: b.vehicle,
      badge: b.badge,
      status: "active",
    });

    const full = await Trip.findById(trip._id).populate("operator").lean();
    res.status(201).json(serializeTrip(full!));
  }),
);

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
