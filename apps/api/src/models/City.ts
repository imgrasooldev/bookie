import { Schema, model, InferSchemaType } from "mongoose";

const citySchema = new Schema({
  code: { type: String, required: true, unique: true }, // e.g. "lhe"
  name: { type: String, required: true },
});

export type CityDoc = InferSchemaType<typeof citySchema>;
export const City = model("City", citySchema);
