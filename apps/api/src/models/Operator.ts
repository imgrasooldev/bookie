import { Schema, model, InferSchemaType } from "mongoose";

const operatorSchema = new Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    logoColor: { type: String, default: "#4f46e5" },
    type: { type: String, default: "BUS" }, // free-form business type (Bus, Airline, Hotel…)
    status: { type: String, enum: ["active", "pending", "suspended"], default: "active" },
  },
  { timestamps: true },
);

export type OperatorDoc = InferSchemaType<typeof operatorSchema>;
export const Operator = model("Operator", operatorSchema);
