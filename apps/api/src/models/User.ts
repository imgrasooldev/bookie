import { Schema, model, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true }, // primary identity in PK
    email: { type: String },
    passwordHash: { type: String, required: true },
    roles: {
      type: [String],
      enum: ["customer", "operator_admin", "driver", "admin"],
      default: ["customer"],
    },
    phoneVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
