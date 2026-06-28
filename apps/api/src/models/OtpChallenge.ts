import { Schema, model, InferSchemaType } from "mongoose";

// A short-lived phone-verification challenge. One active challenge per phone
// (upserted on each request). Mongo's TTL index sweeps expired docs, so stale
// codes can't be replayed even if verify is never called.
const otpChallengeSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true }, // bcrypt hash — codes are never stored in clear
    attempts: { type: Number, default: 0 }, // wrong-guess counter (locked at 5)
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpChallengeDoc = InferSchemaType<typeof otpChallengeSchema>;
export const OtpChallenge = model("OtpChallenge", otpChallengeSchema);
