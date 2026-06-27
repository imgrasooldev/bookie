import { Schema, model, InferSchemaType } from "mongoose";

// A boarding / drop-off point inside a city — e.g. "Sohrab Goth Terminal"
// (Karachi). Each city owns a small managed catalog of these; trips/route-stops
// reference a terminal by name so the ticket can print "Boarding: Sohrab Goth".
const terminalSchema = new Schema(
  {
    code: { type: String, required: true }, // unique within the city, e.g. "sohrab-goth"
    name: { type: String, required: true }, // human label, e.g. "Sohrab Goth Terminal"
    area: { type: String }, // optional locality / address line
  },
  { _id: false },
);

const citySchema = new Schema({
  code: { type: String, required: true, unique: true }, // e.g. "lhe"
  name: { type: String, required: true },
  terminals: { type: [terminalSchema], default: [] },
});

export type CityDoc = InferSchemaType<typeof citySchema>;
export const City = model("City", citySchema);
