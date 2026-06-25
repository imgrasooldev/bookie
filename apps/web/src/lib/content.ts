// Static content for deals, FAQs and the (demo) "My Bookings" list.

export interface Deal {
  id: string;
  title: string;
  body: string;
  code: string;
  tag: string;
  color: string; // gradient start
}

export const DEALS: Deal[] = [
  { id: "welcome", title: "Rs 500 off your first booking", body: "New to Bookie? Use this code at checkout on any category.", code: "WELCOME", tag: "New users", color: "#4f46e5" },
  { id: "save10", title: "10% off all bus tickets", body: "Save on every intercity bus route this month.", code: "SAVE10", tag: "Bus", color: "#0891b2" },
  { id: "fly5", title: "Rs 1,500 off domestic flights", body: "Fly Karachi, Lahore & Islamabad for less.", code: "FLY1500", tag: "Flights", color: "#7c3aed" },
  { id: "stay", title: "Up to 25% off hotels", body: "Book your stay and save on top-rated hotels.", code: "STAY25", tag: "Hotels", color: "#be185d" },
  { id: "umrah", title: "Rs 10,000 off Umrah packages", body: "Begin your spiritual journey for less.", code: "UMRAH10K", tag: "Umrah", color: "#047857" },
  { id: "bank", title: "Extra 5% with HBL cards", body: "Pay with HBL debit/credit and save more.", code: "HBL5", tag: "Bank offer", color: "#d97706" },
];

/** Promo codes honoured at checkout. */
export const PROMO_CODES: Record<string, { type: "flat" | "percent"; value: number; label: string }> = {
  WELCOME: { type: "flat", value: 500, label: "Rs 500 off" },
  SAVE10: { type: "percent", value: 10, label: "10% off" },
  FLY1500: { type: "flat", value: 1500, label: "Rs 1,500 off" },
  STAY25: { type: "percent", value: 25, label: "25% off" },
  FIRST: { type: "flat", value: 200, label: "Rs 200 off" },
};

export interface FAQ {
  q: string;
  a: string;
}

export const FAQS: FAQ[] = [
  { q: "How do I book a ticket on Bookie?", a: "Pick a category (bus, flight, hotel, etc.), search your route or city, choose an option, select your seat or room, and pay with JazzCash, Easypaisa, card or cash. Your e-ticket is issued instantly." },
  { q: "Which payment methods are supported?", a: "JazzCash, Easypaisa, debit/credit cards (Visa, Mastercard, PayPak) and cash on boarding for selected routes." },
  { q: "Can I cancel or get a refund?", a: "Yes — cancellation and refund rules depend on the operator and fare type. Open the booking in 'My Bookings' to see its policy and request a refund." },
  { q: "How do I use a promo code?", a: "Enter the code in the 'Promo code' box at checkout. The discount is applied to your total before payment." },
  { q: "Is my payment secure?", a: "All payments are processed through secure, PCI-compliant gateways. Bookie never stores your full card or wallet PIN." },
  { q: "How will I receive my ticket?", a: "Your e-ticket (with a QR code) is shown in the app and sent via SMS and email. Show the QR at boarding or check-in." },
];

export interface MyBooking {
  id: string;
  ref: string;
  title: string;
  category: string;
  when: string;
  amount: number;
  status: "Upcoming" | "Completed" | "Cancelled";
}

export const MY_BOOKINGS: MyBooking[] = [
  { id: "1", ref: "BKQ8F2A", title: "Lahore → Islamabad (Daewoo)", category: "Bus", when: "26 Jun 2026, 07:00", amount: 4800, status: "Upcoming" },
  { id: "2", ref: "BKF1L9P", title: "Karachi → Islamabad (Airblue)", category: "Flight", when: "28 Jun 2026, 08:15", amount: 18500, status: "Upcoming" },
  { id: "3", ref: "BKH7T3M", title: "Pearl Continental Lahore — 2 nights", category: "Hotel", when: "10 Jun 2026", amount: 56000, status: "Completed" },
  { id: "4", ref: "BKE5N0Q", title: "Atif Aslam — Live in Concert", category: "Event", when: "2 May 2026", amount: 7000, status: "Completed" },
  { id: "5", ref: "BKC2D8X", title: "City Ride — Sedan", category: "City Ride", when: "1 Jun 2026", amount: 850, status: "Cancelled" },
];

export const WALLET_BALANCE = 1250; // demo "Bookie Cash"
