export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Fix Hub local demonstration API",
    version: "0.1.0",
    description:
      "Local demonstration endpoints only. This is not the approved production API and does not create bookings, send messages, or process payments.",
  },
  servers: [{ url: "http://127.0.0.1:4000", description: "Local development API" }],
  paths: {
    "/health/live": {
      get: {
        summary: "Process liveness",
        responses: { "200": { description: "The API process is responding." } },
      },
    },
    "/health/ready": {
      get: {
        summary: "Demo-service readiness",
        description:
          "Production mode deliberately remains not ready until authentication and persistent storage are implemented.",
        responses: {
          "200": { description: "Ready for local demonstration requests." },
          "503": { description: "Production dependencies are not configured." },
        },
      },
    },
    "/api/v1/demo/prices/{category}": {
      get: {
        summary: "Read a fictional baseline price example",
        description:
          "Returns only a sample estimate from the fictional demo fixture. It is not an offer, quote, tax determination, or merchant commitment.",
        parameters: [
          {
            name: "category",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["electrician", "plumbing", "ac", "appliance"] },
          },
        ],
        responses: {
          "200": {
            description: "Fictional, non-binding estimate example.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DemoPrice" } } },
          },
          "400": { description: "Invalid route input." },
          "429": { description: "Demo API rate limit reached." },
        },
      },
    },
    "/api/v1/auth/code": {
      post: {
        summary: "Request an email sign-in code",
        description: "Requires PostgreSQL and Resend configuration. Responses avoid confirming whether an account exists. Codes expire after ten minutes and are single-use.",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } }, additionalProperties: false } } } },
        responses: { "202": { description: "A code was sent when delivery is available." }, "400": { description: "Invalid input." }, "429": { description: "Rate limit reached." }, "503": { description: "Email delivery is unavailable." } },
      },
    },
    "/api/v1/auth/verify": {
      post: {
        summary: "Verify an email sign-in code",
        description: "Creates a session using HttpOnly cookies and a CSRF token cookie. New identities receive only the customer role; pre-provisioned identities retain their previously granted roles. This endpoint cannot self-assign merchant, technician, support, or administrator roles.",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "code"], properties: { email: { type: "string", format: "email" }, code: { type: "string", pattern: "^[0-9]{6}$" } }, additionalProperties: false } } } },
        responses: { "200": { description: "Authenticated session with the identity's existing roles, or customer role for a new identity." }, "400": { description: "Invalid input." }, "401": { description: "Invalid or expired code." }, "429": { description: "Rate limit reached." } },
      },
    },
    "/api/v1/auth/me": {
      get: { summary: "Read the authenticated session", description: "Requires session and matching X-CSRF-Token cookie/header values.", responses: { "200": { description: "Session subject and roles." }, "401": { description: "Authentication required." } } },
    },
    "/api/v1/auth/logout": {
      post: { summary: "Revoke the authenticated session", description: "Requires session and matching X-CSRF-Token cookie/header values.", responses: { "204": { description: "Session revoked." }, "401": { description: "Authentication required." } } },
    },
    "/api/v1/services": {
      get: { summary: "List active services", responses: { "200": { description: "Public service catalog." } } },
    },
    "/api/v1/customer/addresses": {
      get: { summary: "List the signed-in customer's saved addresses", responses: { "200": { description: "Addresses owned by the authenticated customer." }, "401": { description: "Authentication required." } } },
      post: {
        summary: "Save a service address",
        description: "Coordinates are optional and should be supplied only after the customer explicitly shares their location.",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerAddressInput" } } } },
        responses: { "201": { description: "Address saved." }, "400": { description: "Invalid input." }, "401": { description: "Authentication required." } },
      },
    },
    "/api/v1/customer/account-deletion": {
      post: {
        summary: "Request customer account deletion",
        description: "Records an authenticated customer's deletion request, disables sign-in and revokes sessions. It does not immediately delete transaction records, case records, backups or data subject to retention/legal holds.",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["confirm"], properties: { confirm: { const: true } }, additionalProperties: false } } } },
        responses: { "202": { description: "Deletion request recorded; account access disabled." }, "400": { description: "Explicit confirmation is required." }, "401": { description: "Authentication required." }, "403": { description: "This account must use the appropriate privacy-support process." } },
      },
    },
    "/api/v1/customer/bookings": {
      get: { summary: "List the signed-in customer's bookings", responses: { "200": { description: "Bookings owned by the authenticated customer." }, "401": { description: "Authentication required." } } },
      post: {
        summary: "Request an in-area service booking",
        description: "Requires a verified, accepting merchant with an active matching service within its configured radius. A customer request, intended-offer records and outbox events are written atomically; this release has no dispatcher, so it does not contact or assign a provider. Payment metadata is cash on completion only; this endpoint does not collect money.",
        parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{16,128}$", minLength: 16, maxLength: 128 } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerBookingInput" } } } },
        responses: { "201": { description: "Booking and eligible offers created." }, "400": { description: "Invalid input or missing idempotency key." }, "401": { description: "Authentication required." }, "409": { description: "No eligible provider or idempotency conflict." } },
      },
    },
    "/api/v1/customer/bookings/{id}": {
      get: {
        summary: "Read a booking owned by the signed-in customer",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Booking details." }, "401": { description: "Authentication required." }, "404": { description: "Booking not found." } },
      },
    },
    "/api/v1/customer/bookings/{id}/complete": {
      post: {
        summary: "Confirm completion of an in-progress booking",
        description: "Only the owning customer may confirm a booking already marked in progress by its assigned verified merchant. This records service completion only; it does not verify or collect payment.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{16,128}$", minLength: 16, maxLength: 128 } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["confirm"], additionalProperties: false, properties: { confirm: { const: true } } } } } },
        responses: { "200": { description: "Customer-confirmed completion." }, "400": { description: "Invalid booking id, confirmation or idempotency key." }, "401": { description: "Authentication required." }, "403": { description: "Customer role required." }, "404": { description: "Booking not found." }, "409": { description: "Booking is not in progress or the idempotency key conflicts." } },
      },
    },
    "/api/v1/customer/bookings/{id}/quote-approval": {
      post: {
        summary: "Approve the exact current cash quote before work starts",
        description: "Only the owning customer may approve a quote after a verified merchant accepts the request. Consent is bound to the current itemized price, currency and cash-on-completion method; merchant start is denied if those terms differ. Parts shown as separate or unknown are not included in this approval and require separate approval before parts work. This endpoint does not collect or verify payment.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{16,128}$", minLength: 16, maxLength: 128 } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["confirm", "quoteVersion"], additionalProperties: false, properties: { confirm: { const: true }, quoteVersion: { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" } } } } } },
        responses: { "200": { description: "The current quote was approved or the prior approval replayed." }, "400": { description: "Invalid booking id, quote version, confirmation or idempotency key." }, "401": { description: "Authentication required." }, "403": { description: "Customer role required." }, "404": { description: "Booking not found." }, "409": { description: "No accepted merchant, stale quote or idempotency conflict." } },
      },
    },
    "/api/v1/customer/bookings/{id}/review": {
      post: {
        summary: "Submit one rating for a completed booking",
        description: "Only the owning customer may review a booking after customer-confirmed completion. Reviews are private in this increment and are not yet publicly displayed or moderated.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{16,128}$", minLength: 16, maxLength: 128 } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["rating"], additionalProperties: false, properties: { rating: { type: "integer", minimum: 1, maximum: 5 }, comment: { type: "string", maxLength: 1000 } } } } } },
        responses: { "201": { description: "Review created." }, "400": { description: "Invalid booking id, rating, comment or idempotency key." }, "401": { description: "Authentication required." }, "403": { description: "Customer role required." }, "404": { description: "Booking not found." }, "409": { description: "Review is not available, already submitted or the idempotency key conflicts." } },
      },
    },
    "/api/v1/merchant/offers": {
      get: { summary: "List pending offers for the authenticated merchant", description: "Requires a provisioned merchant role and a verified merchant profile accepting work. Only locality and service details are shown before assignment; the customer address is not exposed on this list.", responses: { "200": { description: "The merchant's eligible pending offers." }, "401": { description: "Authentication required." }, "403": { description: "Merchant role required." } } },
    },
    "/api/v1/merchant/offers/{id}/response": {
      post: {
        summary: "Accept or decline a merchant offer",
        description: "Requires an authenticated merchant role and verified accepting profile. Accept uses a conditional booking update; only one merchant can claim an unassigned offered booking. The customer must approve the exact assigned cash quote before the merchant may start work. Identical retries replay their result.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{16,128}$", minLength: 16, maxLength: 128 } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                additionalProperties: false,
                properties: { decision: { type: "string", enum: ["accept", "decline"] } },
              },
            },
          },
        },
        responses: { "200": { description: "Offer accepted or declined." }, "400": { description: "Invalid response or idempotency key." }, "401": { description: "Authentication required." }, "403": { description: "Verified accepting merchant required." }, "404": { description: "Offer not available to this merchant." }, "409": { description: "Offer expired, already assigned or idempotency conflict." } },
      },
    },
    "/api/v1/merchant/jobs": {
      get: { summary: "List jobs assigned to the authenticated merchant", description: "Returns full service-address details only for bookings assigned to the signed-in verified merchant.", responses: { "200": { description: "The merchant's assigned jobs." }, "401": { description: "Authentication required." }, "403": { description: "Merchant role required." } } },
    },
    "/api/v1/merchant/jobs/{id}/start": {
      post: {
        summary: "Mark an accepted job as in progress",
        description: "Only the assigned verified merchant can start its accepted booking after the customer has approved the exact current quote. Quote integrity is checked again at start. The update is idempotent and emits an outbox event for future customer notification; no notification is dispatched in this increment.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{16,128}$", minLength: 16, maxLength: 128 } },
        ],
        responses: { "200": { description: "Job marked in progress." }, "400": { description: "Invalid job id or idempotency key." }, "401": { description: "Authentication required." }, "403": { description: "Merchant role and verified merchant required." }, "404": { description: "Assigned job not found." }, "409": { description: "Job is not accepted or the idempotency key conflicts." } },
      },
    },
  },
  components: {
    schemas: {
      DemoPrice: {
        type: "object",
        required: ["demoOnly", "currency", "category", "items", "total", "collectionMethod"],
        properties: {
          demoOnly: { const: true },
          currency: { const: "INR" },
          category: { type: "string" },
          items: { type: "array", items: { type: "object" } },
          total: { type: "number", minimum: 0 },
          collectionMethod: { const: "cash_on_service_completion_in_demo_only" },
        },
      },
      ApiError: {
        type: "object",
        required: ["error", "requestId"],
        properties: {
          error: { type: "object", required: ["code", "message"] },
          requestId: { type: "string", format: "uuid" },
        },
      },
      AuthenticatedSession: {
        type: "object",
        required: ["authenticated", "subjectId", "roles"],
        properties: { authenticated: { const: true }, subjectId: { type: "string", format: "uuid" }, roles: { type: "array", items: { type: "string", enum: ["customer", "merchant", "technician", "support", "admin"] } } },
      },
      CustomerAddressInput: {
        type: "object",
        required: ["label", "address", "locality"],
        additionalProperties: false,
        properties: { label: { type: "string", maxLength: 40 }, address: { type: "string", maxLength: 500 }, locality: { type: "string", maxLength: 120 }, latitude: { type: "number", minimum: -90, maximum: 90 }, longitude: { type: "number", minimum: -180, maximum: 180 } },
      },
      CustomerBookingInput: {
        type: "object",
        required: ["serviceId", "addressId"],
        additionalProperties: false,
        properties: { serviceId: { type: "string", format: "uuid" }, addressId: { type: "string", format: "uuid" }, scheduledAt: { type: "string", format: "date-time" }, note: { type: "string", maxLength: 2000 } },
      },
    },
  },
} as const;
