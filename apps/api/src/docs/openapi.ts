// OpenAPI 3.0 spec for the Bookie API. Served as raw JSON at /openapi.json and
// rendered by Swagger UI at /docs (see app.ts). Hand-maintained to mirror the
// routers in src/routes/* — keep it in sync when endpoints change.

const bearer = [{ bearerAuth: [] }];

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Bookie API",
    version: "0.1.0",
    description:
      "Intercity per-seat transport booking platform for Pakistan (Bus / Car / HiAce). " +
      "Auth is a Bearer JWT. Most catalog reads are public; bookings support guest checkout.",
  },
  servers: [
    { url: "https://bookie-api.fly.dev", description: "Production (Fly.io)" },
    { url: "http://localhost:4000", description: "Local dev" },
  ],
  tags: [
    { name: "Health" },
    { name: "Catalog", description: "Public search: verticals, cities, trips, reviews" },
    { name: "Auth", description: "Register, login, and phone OTP" },
    { name: "Bookings", description: "Create, retrieve, cancel, review (guest-friendly)" },
    { name: "Payments", description: "Gateways, initiate, cash, webhooks" },
    { name: "Account", description: "Profile, wallet, travellers, notifications (auth)" },
    { name: "Operator", description: "Vendor portal: trips, vehicles, bookings, manifest" },
    { name: "Super-admin", description: "/sa — operators, listings, cities, verticals, RBAC" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string", example: "Booking not found" } },
      },
      Vertical: {
        type: "object",
        properties: {
          type: { type: "string", example: "BUS" },
          label: { type: "string", example: "Bus" },
          tagline: { type: "string" },
          icon: { type: "string" },
          flavor: { type: "string", example: "ROUTE" },
          primary: { type: "boolean" },
        },
      },
      City: {
        type: "object",
        properties: { id: { type: "string", example: "lhe" }, name: { type: "string", example: "Lahore" } },
      },
      Operator: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Daewoo Express" },
          rating: { type: "number", example: 4.6 },
          logoColor: { type: "string", example: "#1d4ed8" },
        },
      },
      Trip: {
        type: "object",
        properties: {
          id: { type: "string" },
          serviceType: { type: "string", enum: ["BUS", "CAR", "HIACE"], example: "BUS" },
          operator: { $ref: "#/components/schemas/Operator" },
          title: { type: "string", example: "Lahore → Islamabad" },
          originId: { type: "string", example: "lhe" },
          destinationId: { type: "string", example: "isb" },
          originTerminal: { type: "string", nullable: true },
          destinationTerminal: { type: "string", nullable: true },
          departAt: { type: "string", format: "date-time", nullable: true },
          arriveAt: { type: "string", format: "date-time", nullable: true },
          durationMin: { type: "integer", nullable: true },
          price: { type: "number", example: 2400 },
          priceUnit: { type: "string", example: "per_seat" },
          seatsAvailable: { type: "integer", nullable: true },
          bookedSeats: { type: "array", items: { type: "string" }, example: ["1A", "1B"] },
          businessSeats: { type: "array", items: { type: "string" } },
          businessSurcharge: { type: "number" },
          amenities: { type: "array", items: { type: "string" } },
          rating: { type: "number", nullable: true },
          ratingCount: { type: "integer" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string", description: "JWT bearer token" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              phone: { type: "string" },
              email: { type: "string", nullable: true },
            },
          },
        },
      },
      Passenger: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Ali Raza" },
          gender: { type: "string", enum: ["M", "F"] },
          cnic: { type: "string", example: "3520112345671" },
          phone: { type: "string" },
          seatLabel: { type: "string", example: "1A" },
        },
      },
      Contact: {
        type: "object",
        required: ["name", "cnic", "phone"],
        properties: {
          name: { type: "string", example: "Ali Raza" },
          cnic: { type: "string", example: "3520112345671" },
          phone: { type: "string", example: "03001234567" },
          email: { type: "string", format: "email" },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string" },
          ref: { type: "string", example: "BKLZ3F2QABC" },
          status: {
            type: "string",
            enum: ["PENDING", "AWAITING_PAYMENT", "CONFIRMED", "CANCELLED", "QUOTE_REQUESTED"],
          },
          serviceType: { type: "string" },
          title: { type: "string" },
          date: { type: "string", nullable: true, example: "2026-06-26" },
          seats: { type: "array", items: { type: "string" } },
          fare: {
            type: "object",
            properties: { total: { type: "number" }, currency: { type: "string", example: "PKR" } },
          },
          payment: {
            type: "object",
            nullable: true,
            properties: { method: { type: "string" }, status: { type: "string" } },
          },
        },
      },
      PayMethod: {
        type: "object",
        properties: {
          name: { type: "string", example: "jazzcash" },
          label: { type: "string", example: "JazzCash" },
          kind: { type: "string", enum: ["online", "cash"] },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { example: { ok: true, service: "bookie-api" } } },
          },
        },
      },
    },

    "/verticals": {
      get: {
        tags: ["Catalog"],
        summary: "Enabled verticals",
        responses: {
          200: {
            description: "List of enabled verticals",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Vertical" } } } },
          },
        },
      },
    },
    "/cities": {
      get: {
        tags: ["Catalog"],
        summary: "Cities (+ terminals)",
        responses: {
          200: {
            description: "Cities",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/City" } } } },
          },
        },
      },
    },
    "/routes/popular": {
      get: {
        tags: ["Catalog"],
        summary: "Popular routes for the home page",
        parameters: [
          { name: "serviceType", in: "query", schema: { type: "string", default: "BUS" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 6 } },
        ],
        responses: { 200: { description: "Popular routes" } },
      },
    },
    "/trips": {
      get: {
        tags: ["Catalog"],
        summary: "Search trips (per-seat, date-aware)",
        parameters: [
          { name: "serviceType", in: "query", required: true, schema: { type: "string", enum: ["BUS", "CAR", "HIACE"] } },
          { name: "originId", in: "query", schema: { type: "string", example: "lhe" } },
          { name: "destinationId", in: "query", schema: { type: "string", example: "isb" } },
          { name: "date", in: "query", schema: { type: "string", example: "2026-06-26" } },
          { name: "passengers", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Matching trips",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Trip" } } } },
          },
        },
      },
    },
    "/trips/{id}": {
      get: {
        tags: ["Catalog"],
        summary: "Trip detail with date-aware booked seats",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string", example: "2026-06-26" } },
        ],
        responses: {
          200: { description: "Trip", content: { "application/json": { schema: { $ref: "#/components/schemas/Trip" } } } },
          404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/trips/{id}/reviews": {
      get: {
        tags: ["Catalog"],
        summary: "Reviews for a trip",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Reviews" } },
      },
    },

    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register with password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "password"],
                properties: {
                  name: { type: "string", example: "Ali Raza" },
                  phone: { type: "string", example: "03001234567" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6, example: "secret1" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          409: { description: "Already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email/phone + password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string", example: "demo@bookie.pk" },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          401: { description: "Bad credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        security: bearer,
        responses: { 200: { description: "User" }, 401: { description: "Unauthorized" } },
      },
    },
    "/auth/otp/request": {
      post: {
        tags: ["Auth"],
        summary: "Send an OTP login code",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["phone"], properties: { phone: { type: "string", example: "03001234567" } } },
            },
          },
        },
        responses: {
          200: {
            description: "Sent (devCode returned only while no SMS provider is configured)",
            content: { "application/json": { example: { sent: true, devCode: "123456" } } },
          },
        },
      },
    },
    "/auth/otp/verify": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP and sign in (creates account on first use)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone", "code"],
                properties: {
                  phone: { type: "string", example: "03001234567" },
                  code: { type: "string", example: "123456" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } } },
      },
    },

    "/bookings/hold": {
      post: {
        tags: ["Bookings"],
        summary: "Place a temporary seat hold",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tripId", "seats"],
                properties: {
                  tripId: { type: "string" },
                  date: { type: "string", example: "2026-06-26" },
                  seats: { type: "array", items: { type: "string" }, example: ["1A", "1B"] },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Held" }, 409: { description: "Seat taken" } },
      },
    },
    "/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Create a booking (guest-friendly; token links to account)",
        security: [{}, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tripId"],
                properties: {
                  tripId: { type: "string" },
                  originId: { type: "string", example: "lhe" },
                  destinationId: { type: "string", example: "isb" },
                  date: { type: "string", example: "2026-06-26" },
                  seats: { type: "array", items: { type: "string" }, example: ["1A"] },
                  quantity: { type: "integer" },
                  passengers: { type: "array", items: { $ref: "#/components/schemas/Passenger" } },
                  contact: { $ref: "#/components/schemas/Contact" },
                  paymentMethod: { type: "string", enum: ["JazzCash", "Easypaisa", "Card", "Cash", "Wallet"] },
                  holdId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created" },
          409: { description: "Seat just booked", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/bookings/mine": {
      get: {
        tags: ["Bookings"],
        summary: "My bookings",
        security: bearer,
        responses: { 200: { description: "Tickets", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Ticket" } } } } } },
      },
    },
    "/bookings/lookup": {
      get: {
        tags: ["Bookings"],
        summary: "Guest e-ticket lookup by ref + phone",
        parameters: [
          { name: "ref", in: "query", required: true, schema: { type: "string" } },
          { name: "phone", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Ticket" }, 404: { description: "Not found" } },
      },
    },
    "/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Booking / e-ticket detail",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Ticket", content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } } }, 404: { description: "Not found" } },
      },
    },
    "/bookings/{id}/cancel": {
      post: {
        tags: ["Bookings"],
        summary: "Cancel a booking (releases seats)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Cancelled" }, 409: { description: "Cannot cancel" } },
      },
    },
    "/bookings/{id}/review": {
      post: {
        tags: ["Bookings"],
        summary: "Add or update a review",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["rating"], properties: { rating: { type: "integer", minimum: 1, maximum: 5 }, comment: { type: "string" } } },
            },
          },
        },
        responses: { 201: { description: "Saved" } },
      },
      get: {
        tags: ["Bookings"],
        summary: "My review for a booking",
        security: bearer,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Review or null" } },
      },
    },

    "/payments/methods": {
      get: {
        tags: ["Payments"],
        summary: "Configured payment methods",
        responses: { 200: { description: "Methods", content: { "application/json": { schema: { type: "object", properties: { methods: { type: "array", items: { $ref: "#/components/schemas/PayMethod" } } } } } } } },
      },
    },
    "/payments/initiate": {
      post: {
        tags: ["Payments"],
        summary: "Start an online payment → hosted checkout URL",
        security: [{}, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["bookingId"], properties: { bookingId: { type: "string" }, gateway: { type: "string", example: "jazzcash" } } },
            },
          },
        },
        responses: { 201: { description: "Checkout session" }, 409: { description: "Not payable" } },
      },
    },
    "/payments/cash": {
      post: {
        tags: ["Payments"],
        summary: "Reserve now, pay cash at terminal (→ CONFIRMED, payment PENDING)",
        security: [{}, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["bookingId"], properties: { bookingId: { type: "string" } } } } },
        },
        responses: { 201: { description: "Reserved" } },
      },
    },
    "/payments/cash/{bookingId}/collect": {
      post: {
        tags: ["Payments"],
        summary: "Operator marks cash collected",
        security: bearer,
        parameters: [{ name: "bookingId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Collected" } },
      },
    },
    "/payments/webhook/{gateway}": {
      post: {
        tags: ["Payments"],
        summary: "Provider settlement webhook (signature-verified)",
        parameters: [{ name: "gateway", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Received" }, 400: { description: "Unverified" } },
      },
    },
    "/payments/mock/complete": {
      post: {
        tags: ["Payments"],
        summary: "Sandbox: complete a mock payment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["transactionId"], properties: { transactionId: { type: "string" }, outcome: { type: "string", enum: ["success", "fail"], default: "success" } } },
            },
          },
        },
        responses: { 200: { description: "Settled" } },
      },
    },
    "/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Poll a transaction's status",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Transaction" } },
      },
    },

    "/account": {
      get: { tags: ["Account"], summary: "Full profile + wallet summary", security: bearer, responses: { 200: { description: "Profile" } } },
    },
    "/account/profile": {
      patch: { tags: ["Account"], summary: "Update profile", security: bearer, responses: { 200: { description: "Updated" } } },
    },
    "/account/password": {
      post: { tags: ["Account"], summary: "Change password", security: bearer, responses: { 200: { description: "OK" } } },
    },
    "/account/wallet": {
      get: { tags: ["Account"], summary: "Wallet balance + transactions", security: bearer, responses: { 200: { description: "Wallet" } } },
    },
    "/account/travellers": {
      get: { tags: ["Account"], summary: "Saved travellers", security: bearer, responses: { 200: { description: "Travellers" } } },
      post: { tags: ["Account"], summary: "Add a saved traveller", security: bearer, responses: { 201: { description: "Added" } } },
    },
    "/account/notifications": {
      get: { tags: ["Account"], summary: "In-app notification feed", security: bearer, responses: { 200: { description: "Feed" } } },
    },
    "/account/device-token": {
      post: { tags: ["Account"], summary: "Register a push token", security: bearer, responses: { 200: { description: "OK" } } },
    },

    "/operator/register": {
      post: { tags: ["Operator"], summary: "Self-register an operator (starts pending)", responses: { 201: { description: "Created" } } },
    },
    "/operator/login": {
      post: {
        tags: ["Operator"],
        summary: "Operator / admin-staff login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["identifier", "password"], properties: { identifier: { type: "string", example: "admin@bookie.pk" }, password: { type: "string", example: "admin123" } } },
            },
          },
        },
        responses: { 200: { description: "Token + role" }, 401: { description: "Bad credentials" } },
      },
    },
    "/operator/me": { get: { tags: ["Operator"], summary: "Operator profile", security: bearer, responses: { 200: { description: "Operator" } } } },
    "/operator/trips": {
      get: { tags: ["Operator"], summary: "Operator's listings", security: bearer, responses: { 200: { description: "Listings" } } },
      post: { tags: ["Operator"], summary: "Create a listing (awaits approval)", security: bearer, responses: { 201: { description: "Created" } } },
    },
    "/operator/trips/{id}": {
      patch: { tags: ["Operator"], summary: "Update a listing", security: bearer, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
      delete: { tags: ["Operator"], summary: "Delete a listing", security: bearer, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } },
    },
    "/operator/trips/{id}/delay": {
      post: { tags: ["Operator"], summary: "Announce a delay + notify passengers", security: bearer, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Notified" } } },
    },
    "/operator/vehicles": {
      get: { tags: ["Operator"], summary: "Fleet vehicles", security: bearer, responses: { 200: { description: "Vehicles" } } },
      post: { tags: ["Operator"], summary: "Add a vehicle", security: bearer, responses: { 201: { description: "Created" } } },
    },
    "/operator/bookings": { get: { tags: ["Operator"], summary: "Operator's bookings", security: bearer, responses: { 200: { description: "Bookings" } } } },
    "/operator/stats": { get: { tags: ["Operator"], summary: "Operator dashboard stats", security: bearer, responses: { 200: { description: "Stats" } } } },
    "/operator/manifest": {
      get: {
        tags: ["Operator"],
        summary: "Passenger manifest for a departure",
        security: bearer,
        parameters: [
          { name: "tripId", in: "query", required: true, schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string", example: "2026-06-26" } },
        ],
        responses: { 200: { description: "Manifest" } },
      },
    },

    "/sa/operators": {
      get: { tags: ["Super-admin"], summary: "List operators (paginated)", security: bearer, responses: { 200: { description: "Operators" } } },
      post: { tags: ["Super-admin"], summary: "Onboard an operator (pre-approved)", security: bearer, responses: { 201: { description: "Created" } } },
    },
    "/sa/operators/{id}": {
      get: { tags: ["Super-admin"], summary: "Operator detail", security: bearer, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Detail" } } },
      patch: { tags: ["Super-admin"], summary: "Approve / suspend / edit", security: bearer, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
    },
    "/sa/operators/{id}/password": {
      post: { tags: ["Super-admin"], summary: "Reset an operator's password", security: bearer, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Reset" } } },
    },
    "/sa/listings": {
      get: { tags: ["Super-admin"], summary: "List listings (paginated)", security: bearer, responses: { 200: { description: "Listings" } } },
    },
    "/sa/listings/{id}": {
      patch: { tags: ["Super-admin"], summary: "Approve / unapprove a listing", security: bearer, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
    },
    "/sa/overview": { get: { tags: ["Super-admin"], summary: "Marketplace reporting", security: bearer, responses: { 200: { description: "Overview" } } } },
    "/sa/cities": {
      get: { tags: ["Super-admin"], summary: "Cities with listing counts", security: bearer, responses: { 200: { description: "Cities" } } },
      post: { tags: ["Super-admin"], summary: "Create a city", security: bearer, responses: { 201: { description: "Created" } } },
    },
    "/sa/verticals": {
      get: { tags: ["Super-admin"], summary: "Verticals with enabled state", security: bearer, responses: { 200: { description: "Verticals" } } },
      patch: { tags: ["Super-admin"], summary: "Set the enabled allow-list", security: bearer, responses: { 200: { description: "Updated" } } },
    },
    "/sa/roles": {
      get: { tags: ["Super-admin"], summary: "RBAC roles", security: bearer, responses: { 200: { description: "Roles" } } },
      post: { tags: ["Super-admin"], summary: "Create a role", security: bearer, responses: { 201: { description: "Created" } } },
    },
    "/sa/permissions": { get: { tags: ["Super-admin"], summary: "Permission catalog", security: bearer, responses: { 200: { description: "Permissions" } } } },
    "/sa/team": {
      get: { tags: ["Super-admin"], summary: "Admin staff", security: bearer, responses: { 200: { description: "Team" } } },
      post: { tags: ["Super-admin"], summary: "Add a staff member", security: bearer, responses: { 201: { description: "Created" } } },
    },
  },
} as const;
