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
    operatorId: { type: Schema.Types.ObjectId, ref: "Operator" },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" }, // admin staff role (RBAC)
    phoneVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
