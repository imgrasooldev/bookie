import { Schema, model, InferSchemaType } from "mongoose";

// Singleton app-settings document (key: "app"). Holds marketplace-level toggles
// the super-admin controls — e.g. which verticals are switched on.
const settingSchema = new Schema(
  {
    key: { type: String, unique: true, default: "app" },
    // null/absent = every vertical enabled; otherwise the allow-list of types.
    enabledVerticals: { type: [String], default: undefined },
  },
  { timestamps: true },
);

export type SettingDoc = InferSchemaType<typeof settingSchema>;
export const Setting = model("Setting", settingSchema);
