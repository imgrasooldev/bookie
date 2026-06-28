import { Setting } from "../models/Setting.js";
import { SERVICE_TYPES, VERTICALS } from "./verticals.js";

/** The set of currently-enabled vertical types (defaults to all). */
export async function enabledVerticals(): Promise<Set<string>> {
  const s = await Setting.findOne({ key: "app" }).lean();
  if (!s || !s.enabledVerticals) return new Set(SERVICE_TYPES);
  return new Set(s.enabledVerticals);
}

/** Persist the enabled allow-list (super-admin action). */
export async function setEnabledVerticals(list: string[]): Promise<void> {
  const clean = list.filter((t) => (SERVICE_TYPES as readonly string[]).includes(t));
  await Setting.updateOne({ key: "app" }, { $set: { enabledVerticals: clean } }, { upsert: true });
}

/** All verticals tagged with their enabled state (for the admin toggle UI). */
export async function verticalsWithState() {
  const en = await enabledVerticals();
  return VERTICALS.map((v) => ({ type: v.type, label: v.label, icon: v.icon, enabled: en.has(v.type) }));
}
