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

export const FlightIcon = (p: P) => (
  <S {...p}>
    <path d="M10.5 13.5 3 12l1-2 6.5 1 4.5-5a2 2 0 0 1 3 2.6L13 13l-1 7-2 .8-1-5.5-3 .2-1 2-1.5-.3L7 14z" />
  </S>
);
export const TrainIcon = (p: P) => (
  <S {...p}>
    <rect x="6" y="3" width="12" height="13" rx="2" />
    <path d="M6 10h12" />
    <circle cx="9" cy="13" r="0.6" />
    <circle cx="15" cy="13" r="0.6" />
    <path d="M7 16l-2 4M17 16l2 4M9 20h6" />
  </S>
);
export const HotelIcon = (p: P) => (
  <S {...p}>
    <path d="M3 21h18" />
    <path d="M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16" />
    <path d="M9 8h.01M12 8h.01M15 8h.01M9 12h.01M12 12h.01M15 12h.01" />
    <path d="M10 21v-3a2 2 0 0 1 4 0v3" />
  </S>
);
export const EventIcon = (p: P) => (
  <S {...p}>
    <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" />
    <path d="M14 6v2M14 11v2M14 16v2" />
  </S>
);
export const TourIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </S>
);
export const KaabaIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3 4 6.5v9L12 21l8-5.5v-9L12 3z" />
    <path d="M4 6.5 12 11l8-4.5M12 11v10" />
    <path d="M4 9.5h16" />
  </S>
);
export const FarmhouseIcon = (p: P) => (
  <S {...p}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-5h6v5" />
  </S>
);
export const HutIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3 3 12h2v8h14v-8h2L12 3z" />
    <path d="M9 20v-6h6v6" />
  </S>
);
export const WaveIcon = (p: P) => (
  <S {...p}>
    <path d="M2 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
    <path d="M2 13c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
    <path d="M2 18c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
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

export const UserIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </S>
);
export const UsersIcon = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.6M21 20a6 6 0 0 0-4-5.7" />
  </S>
);
export const GridIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </S>
);
export const CardIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3 10h18M7 15h4" />
  </S>
);
export const GiftIcon = (p: P) => (
  <S {...p}>
    <rect x="4" y="9" width="16" height="11" rx="1.5" />
    <path d="M2 9h20M12 9v11" />
    <path d="M12 9S10.5 4 8 4a2 2 0 0 0 0 5M12 9s1.5-5 4-5a2 2 0 0 1 0 5" />
  </S>
);
export const BellIcon = (p: P) => (
  <S {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </S>
);
export const LockIcon = (p: P) => (
  <S {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </S>
);
export const LogoutIcon = (p: P) => (
  <S {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </S>
);
export const DownloadIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </S>
);
export const PlusIcon = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const TrashIcon = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </S>
);
export const ChevronRightIcon = (p: P) => (
  <S {...p}>
    <path d="M9 6l6 6-6 6" />
  </S>
);
export const CheckIcon = (p: P) => (
  <S {...p}>
    <path d="M5 13l4 4L19 7" />
  </S>
);
export const SearchIcon = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </S>
);
export const PhoneIcon = (p: P) => (
  <S {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h2l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16.5 16 20 17.5V20a2 2 0 0 1-2 2A16 16 0 0 1 4 8z" />
  </S>
);
export const ChevronDownIcon = (p: P) => (
  <S {...p}>
    <path d="M6 9l6 6 6-6" />
  </S>
);
export const MenuIcon = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);
export const SunIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
  </S>
);
export const MoonIcon = (p: P) => (
  <S {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </S>
);

/* amenity-key → icon, for trip cards (unmapped keys render as text only) */
export const AMENITY_ICONS: Record<string, (p: P) => React.ReactElement> = {
  wifi: WifiIcon,
  ac: AcIcon,
  meal: MealIcon,
  meals: MealIcon,
  breakfast: MealIcon,
  usb: UsbIcon,
  water: WaterIcon,
  pool: WaterIcon,
  tracking: TrackIcon,
  music: MusicIcon,
  driver: DriverIcon,
  guide: DriverIcon,
  contract: ContractIcon,
  visa: ContractIcon,
  invoice: InvoiceIcon,
  baggage: TicketIcon,
  refundable: ShieldIcon,
  hotel: HotelIcon,
  transport: BusIcon,
  parking: CarIcon,
  sleeper: HotelIcon,
  ziarat: KaabaIcon,
};

/* vertical-type → icon */
export const VERTICAL_ICONS: Record<string, (p: P) => React.ReactElement> = {
  BUS: BusIcon,
  FLIGHT: FlightIcon,
  TRAIN: TrainIcon,
  CAR: CarIcon,
  HOTEL: HotelIcon,
  EVENT: EventIcon,
  TOUR: TourIcon,
  UMRAH: KaabaIcon,
  PICNIC: PartyIcon,
  CORPORATE: BuildingIcon,
  FARMHOUSE: FarmhouseIcon,
  HUT: HutIcon,
  WATERPARK: WaveIcon,
};
