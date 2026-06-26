import { Schema, model, InferSchemaType, Types } from "mongoose";

// An operator's bus/coach with its seat-map layout.
const vehicleSchema = new Schema(
  {
    operator: { type: Schema.Types.ObjectId, ref: "Operator", required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, default: "Bus" }, // Bus / Coach / Coaster / Hiace / Sleeper
    layout: { type: String, enum: ["2+2", "2+1", "sleeper"], default: "2+2" },
    rows: { type: Number, default: 11 },
    disabled: { type: [String], default: [] }, // seat labels removed (door/stairs)
    amenities: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type VehicleDoc = InferSchemaType<typeof vehicleSchema> & { _id: Types.ObjectId };
export const Vehicle = model("Vehicle", vehicleSchema);
