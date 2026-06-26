import { Schema, model, InferSchemaType } from "mongoose";

const walletTxSchema = new Schema(
  {
    desc: { type: String, required: true },
    amount: { type: Number, required: true }, // + credit, - debit
    kind: { type: String, enum: ["credit", "debit"], required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: true },
);

const travellerSchema = new Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, default: "Family" },
    cnic: { type: String },
    dob: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
  },
  { _id: true },
);

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
    // --- customer profile ---
    cnic: { type: String },
    dob: { type: String }, // yyyy-mm-dd
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    city: { type: String },
    avatar: { type: String },
    referralCode: { type: String },
    // --- wallet & loyalty ---
    walletBalance: { type: Number, default: 0 },
    walletTx: { type: [walletTxSchema], default: [] },
    rewardPoints: { type: Number, default: 0 },
    // --- saved travellers & prefs ---
    travellers: { type: [travellerSchema], default: [] },
    notifPrefs: {
      trips: { type: Boolean, default: true },
      promos: { type: Boolean, default: true },
      wallet: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
