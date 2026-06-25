// Mock data for the customer portal. Shapes are demo-only; wire to the API later.

export const USER = {
  name: "Ali Raza",
  firstName: "Ali",
  email: "ali.raza@example.com",
  phone: "0300 1234567",
  cnic: "35202-1234567-8",
  dob: "1995-04-12",
  gender: "Male",
  city: "Lahore",
  memberSince: "2024",
  tier: "Gold",
  avatar:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=75&auto=format&fit=crop",
  walletBalance: 1250,
  rewardPoints: 3400,
  referralCode: "ALIRAZA250",
};

export interface PortalBooking {
  id: string;
  ref: string;
  category: string;
  title: string;
  from?: string;
  to?: string;
  date: string;
  time?: string;
  seat?: string;
  pax: number;
  amount: number;
  status: "Upcoming" | "Completed" | "Cancelled";
  operator: string;
}

export const BOOKINGS: PortalBooking[] = [
  { id: "1", ref: "BKQ8F2A", category: "Bus", title: "Lahore → Islamabad", from: "Lahore", to: "Islamabad", date: "26 Jun 2026", time: "07:00", seat: "2A, 2B", pax: 2, amount: 4800, status: "Upcoming", operator: "Daewoo Express" },
  { id: "2", ref: "BKF1L9P", category: "Flight", title: "Karachi → Islamabad", from: "Karachi", to: "Islamabad", date: "28 Jun 2026", time: "08:15", seat: "12C", pax: 1, amount: 18500, status: "Upcoming", operator: "Airblue" },
  { id: "3", ref: "BKH7T3M", category: "Hotel", title: "Pearl Continental Lahore", date: "10 Jun 2026", pax: 2, amount: 56000, status: "Completed", operator: "Pearl Continental" },
  { id: "4", ref: "BKE5N0Q", category: "Event", title: "Atif Aslam — Live in Concert", date: "2 May 2026", time: "20:00", pax: 2, amount: 7000, status: "Completed", operator: "Bookie Events" },
  { id: "5", ref: "BKC2D8X", category: "City Ride", title: "City Ride — Sedan", date: "1 Jun 2026", pax: 1, amount: 850, status: "Cancelled", operator: "Bookie Fleet" },
];

export interface WalletTx {
  id: string;
  desc: string;
  date: string;
  amount: number; // + credit, - debit
  kind: "credit" | "debit";
}

export const WALLET_TX: WalletTx[] = [
  { id: "w1", desc: "Refund — City Ride (BKC2D8X)", date: "2 Jun 2026", amount: 850, kind: "credit" },
  { id: "w2", desc: "Referral bonus — Sana joined", date: "28 May 2026", amount: 250, kind: "credit" },
  { id: "w3", desc: "Redeemed on flight (BKF1L9P)", date: "20 May 2026", amount: -500, kind: "debit" },
  { id: "w4", desc: "Cashback — Bus booking", date: "12 May 2026", amount: 150, kind: "credit" },
  { id: "w5", desc: "Welcome bonus", date: "3 Jan 2024", amount: 500, kind: "credit" },
];

export interface Traveller {
  id: string;
  name: string;
  relation: string;
  cnic: string;
  dob: string;
  gender: string;
}

export const TRAVELLERS: Traveller[] = [
  { id: "t1", name: "Ali Raza", relation: "Self", cnic: "35202-1234567-8", dob: "1995-04-12", gender: "Male" },
  { id: "t2", name: "Sara Ali", relation: "Spouse", cnic: "35202-7654321-0", dob: "1997-09-03", gender: "Female" },
  { id: "t3", name: "Hamza Raza", relation: "Son", cnic: "—", dob: "2020-01-22", gender: "Male" },
];

export interface PayMethod {
  id: string;
  type: "Card" | "JazzCash" | "Easypaisa";
  label: string;
  detail: string;
  primary?: boolean;
}

export const PAY_METHODS: PayMethod[] = [
  { id: "p1", type: "Card", label: "Visa •••• 4242", detail: "Expires 08/27", primary: true },
  { id: "p2", type: "JazzCash", label: "JazzCash wallet", detail: "0300 1234567" },
  { id: "p3", type: "Easypaisa", label: "Easypaisa wallet", detail: "0345 7654321" },
];

export interface Notif {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export const NOTIFICATIONS: Notif[] = [
  { id: "n1", title: "Trip reminder", body: "Your bus to Islamabad departs tomorrow at 07:00.", time: "2h ago", unread: true },
  { id: "n2", title: "Payment confirmed", body: "Rs 18,500 paid for flight BKF1L9P via Easypaisa.", time: "1d ago", unread: true },
  { id: "n3", title: "You earned Bookie Cash", body: "Rs 250 referral bonus added to your wallet.", time: "3d ago", unread: false },
  { id: "n4", title: "Price drop", body: "Lahore → Skardu tour is now 12% cheaper.", time: "5d ago", unread: false },
];

export const NOTIF_PREFS = [
  { key: "trips", label: "Trip reminders & updates", on: true },
  { key: "promos", label: "Deals & promotions", on: true },
  { key: "wallet", label: "Wallet & payments", on: true },
  { key: "newsletter", label: "Newsletter", on: false },
];

export const SESSIONS = [
  { id: "s1", device: "Chrome on Windows", location: "Lahore, PK", lastActive: "Active now", current: true },
  { id: "s2", device: "Bookie App — Android", location: "Lahore, PK", lastActive: "2 hours ago", current: false },
  { id: "s3", device: "Safari on iPhone", location: "Islamabad, PK", lastActive: "3 days ago", current: false },
];
