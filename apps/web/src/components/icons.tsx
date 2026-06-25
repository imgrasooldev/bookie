// Lightweight line-icon set (stroke = currentColor). Keeps the bundle tiny and
// lets icons inherit text color/size via className.

type P = { className?: string };
const base = "h-5 w-5";

function S({ className, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? base}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ---------- verticals ---------- */
export const BusIcon = (p: P) => (
  <S {...p}>
    <path d="M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10" />
    <path d="M3 16h18" />
    <path d="M4 10h16" />
    <circle cx="7.5" cy="19" r="1.5" />
    <circle cx="16.5" cy="19" r="1.5" />
    <path d="M5 16v2M19 16v2" />
  </S>
);
export const CarIcon = (p: P) => (
  <S {...p}>
    <path d="M5 11l1.5-4A2 2 0 0 1 8.4 6h7.2a2 2 0 0 1 1.9 1l1.5 4" />
    <path d="M3 16v-3.5a1 1 0 0 1 .8-1l1.2-.3h14l1.2.3a1 1 0 0 1 .8 1V16a1 1 0 0 1-1 1h-1" />
    <path d="M6 17H4" />
    <circle cx="7.5" cy="16.5" r="1.5" />
    <circle cx="16.5" cy="16.5" r="1.5" />
  </S>
);
export const PartyIcon = (p: P) => (
  <S {...p}>
    <path d="M3 21l5-13 8 8-13 5z" />
    <path d="M8 8l8 8" />
    <path d="M14 3s.5 2 2 2M19 8s-2 .5-2 2M16.5 4.5l.01 0" />
    <path d="M21 11s-2 .5-2 2" />
  </S>
);
export const BuildingIcon = (p: P) => (
  <S {...p}>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M15 15h.01" />
    <path d="M11 21v-3a1 1 0 0 1 2 0v3" />
  </S>
);

/* ---------- amenities ---------- */
export const WifiIcon = (p: P) => (
  <S {...p}>
    <path d="M5 12.5a10 10 0 0 1 14 0" />
    <path d="M8 15.5a6 6 0 0 1 8 0" />
    <path d="M12 19h.01" />
  </S>
);
export const AcIcon = (p: P) => (
  <S {...p}>
    <path d="M12 2v20M2 12h20" />
    <path d="M5 5l3 2M19 5l-3 2M5 19l3-2M19 19l-3-2" />
  </S>
);
export const MealIcon = (p: P) => (
  <S {...p}>
    <path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11" />
    <path d="M16 3c-1.5 0-2 2-2 4s.5 4 2 4M16 3v18" />
  </S>
);
export const UsbIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="20" r="1.5" />
    <path d="M12 18.5V5" />
    <path d="M9 8l3-3 3 3" />
    <path d="M12 12l3-2v2M12 14l-3-2v2" />
  </S>
);
export const WaterIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
  </S>
);
export const TrackIcon = (p: P) => (
  <S {...p}>
    <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </S>
);
export const MusicIcon = (p: P) => (
  <S {...p}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </S>
);
export const DriverIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 3v6.5M12 14.5V21M3.5 9l5.5 3M20.5 9l-5.5 3" />
  </S>
);
export const ContractIcon = (p: P) => (
  <S {...p}>
    <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M13 3v5h5M9 13h6M9 17h6" />
  </S>
);
export const InvoiceIcon = (p: P) => (
  <S {...p}>
    <path d="M6 3h12v18l-2-1.2L14 21l-2-1.2L10 21l-2-1.2L6 21z" />
    <path d="M9 8h6M9 12h6" />
  </S>
);

/* ---------- ui ---------- */
export const StarIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3z" />
  </S>
);
export const ShieldIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </S>
);
export const ClockIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
);
export const ArrowRightIcon = (p: P) => (
  <S {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </S>
);
export const SwapIcon = (p: P) => (
  <S {...p}>
    <path d="M7 4L3 8l4 4" />
    <path d="M3 8h14" />
    <path d="M17 20l4-4-4-4" />
    <path d="M21 16H7" />
  </S>
);
export const SeatIcon = (p: P) => (
  <S {...p}>
    <path d="M6 4a2 2 0 0 1 2 2v6h6a2 2 0 0 1 2 2v4" />
    <path d="M6 12v6M6 18h10" />
    <path d="M18 10v8" />
  </S>
);
export const TicketIcon = (p: P) => (
  <S {...p}>
    <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" />
    <path d="M14 6v12" />
  </S>
);
export const HeadsetIcon = (p: P) => (
  <S {...p}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="3" y="13" width="4" height="6" rx="1" />
    <rect x="17" y="13" width="4" height="6" rx="1" />
    <path d="M20 19a4 4 0 0 1-4 3h-2" />
  </S>
);
export const WalletIcon = (p: P) => (
  <S {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M16 12h3M3 9h13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3" />
  </S>
);
export const SparkleIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3L12 3z" />
  </S>
);
export const RouteIcon = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
  </S>
);

/* amenity-key → icon, for trip cards */
export const AMENITY_ICONS: Record<string, (p: P) => React.ReactElement> = {
  wifi: WifiIcon,
  ac: AcIcon,
  meal: MealIcon,
  usb: UsbIcon,
  water: WaterIcon,
  tracking: TrackIcon,
  music: MusicIcon,
  driver: DriverIcon,
  contract: ContractIcon,
  invoice: InvoiceIcon,
};

/* vertical-type → icon */
export const VERTICAL_ICONS: Record<string, (p: P) => React.ReactElement> = {
  BUS: BusIcon,
  CAR: CarIcon,
  PICNIC: PartyIcon,
  CORPORATE: BuildingIcon,
};
