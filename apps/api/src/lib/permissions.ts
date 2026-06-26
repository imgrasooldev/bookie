// Spatie-style permission catalog. Roles are sets of these; users get a role.

export interface Permission {
  key: string;
  label: string;
  group: string;
}

export const PERMISSIONS: Permission[] = [
  { key: "operators.view", label: "View operators", group: "Operators" },
  { key: "operators.manage", label: "Onboard, approve & suspend operators", group: "Operators" },
  { key: "listings.view", label: "View listings", group: "Listings" },
  { key: "listings.approve", label: "Approve & unpublish listings", group: "Listings" },
  { key: "bookings.view", label: "View bookings", group: "Bookings" },
  { key: "reports.view", label: "View reports & overview", group: "Reports" },
  { key: "cities.manage", label: "Manage cities & routes", group: "Administration" },
  { key: "roles.manage", label: "Manage roles, permissions & team", group: "Administration" },
];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

/** Default roles seeded on first run. */
export const DEFAULT_ROLES: { name: string; super?: boolean; system?: boolean; permissions: string[] }[] = [
  { name: "Super Admin", super: true, system: true, permissions: PERMISSION_KEYS },
  {
    name: "Operations Manager",
    permissions: ["operators.view", "operators.manage", "listings.view", "listings.approve", "bookings.view", "reports.view"],
  },
  { name: "Approver", permissions: ["listings.view", "listings.approve"] },
  { name: "Onboarding Officer", permissions: ["operators.view", "operators.manage"] },
];
