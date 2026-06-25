import { Schema, model, InferSchemaType } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] },
    super: { type: Boolean, default: false }, // grants every permission
    system: { type: Boolean, default: false }, // can't be deleted
  },
  { timestamps: true },
);

export type RoleDoc = InferSchemaType<typeof roleSchema>;
export const Role = model("Role", roleSchema);
