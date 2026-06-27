// Real customer-account API client (profile, travellers, wallet, password,
// notification prefs). Auth is via the JWT in localStorage. Pages behind the
// AccountGuard call these; in mock mode they no-op gracefully.

import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cnic: string | null;
  dob: string | null;
  gender: "Male" | "Female" | "Other" | null;
  city: string | null;
  avatar: string | null;
  referralCode: string | null;
  walletBalance: number;
  rewardPoints: number;
  tier: string;
  memberSince: number;
  notifPrefs: { trips: boolean; promos: boolean; wallet: boolean; newsletter: boolean };
  upcomingTrips: number;
}

export interface WalletTx {
  id: string;
  desc: string;
  amount: number;
  kind: "credit" | "debit";
  date: string;
}

export interface Traveller {
  id: string;
  name: string;
  relation: string;
  cnic: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/account${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed.");
  return data as T;
}

export const getProfile = () => api<Profile>("");
export const updateProfile = (patch: Partial<Profile>) =>
  api<Profile>("/profile", { method: "PATCH", body: JSON.stringify(patch) });

export async function changePassword(current: string, next: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await api("/password", { method: "POST", body: JSON.stringify({ current, next }) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const getWallet = () => api<{ balance: number; transactions: WalletTx[] }>("/wallet");

export const updateNotifPrefs = (prefs: Partial<Profile["notifPrefs"]>) =>
  api<Profile["notifPrefs"]>("/notif-prefs", { method: "PATCH", body: JSON.stringify(prefs) });

export interface NotifChannel { channel: "inapp" | "push" | "sms" | "whatsapp" | "email"; status: "SENT" | "STUB" | "SKIPPED" | "FAILED" }
export interface LiveNotif {
  id: string;
  type: "DELAY" | "GENERAL" | "BOOKING" | "WALLET";
  title: string;
  body: string;
  time: string;
  unread: boolean;
  channels: NotifChannel[];
}

export const getNotifications = () =>
  api<{ items: LiveNotif[]; unread: number }>("/notifications");

export const markNotificationsRead = (id?: string) =>
  api<{ ok: true }>(`/notifications/read${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method: "POST" });

export const listTravellers = () => api<Traveller[]>("/travellers");
export const addTraveller = (t: Omit<Traveller, "id">) =>
  api<Traveller[]>("/travellers", { method: "POST", body: JSON.stringify(t) });
export const updateTraveller = (id: string, t: Partial<Omit<Traveller, "id">>) =>
  api<Traveller[]>(`/travellers/${id}`, { method: "PATCH", body: JSON.stringify(t) });
export const deleteTraveller = (id: string) =>
  api<Traveller[]>(`/travellers/${id}`, { method: "DELETE" });
