export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Fix Hub Platform API",
    version: "1.0.0",
    description:
      "Enterprise REST API for Fix Hub local services marketplace (Tanuku, AP, India). Covers Authentication, Merchant Management, Smart Dispatch Engine, Complete Booking Lifecycle, Inspection Quotes, Cash/Online Settlement, Reviews, Disputes, and WhatsApp Notifications.",
  },
  servers: [{ url: "http://127.0.0.1:4000", description: "Local development & demonstration API" }],
  paths: {
    "/health/live": {
      get: {
        summary: "Process liveness",
        tags: ["Health"],
        responses: { "200": { description: "The API process is responding." } },
      },
    },
    "/health/ready": {
      get: {
        summary: "Service readiness",
        tags: ["Health"],
        responses: {
          "200": { description: "Ready to accept incoming client traffic." },
          "503": { description: "Production dependencies are not configured." },
        },
      },
    },
    "/api/v1/auth/request-otp": {
      post: {
        summary: "Request login OTP",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone"],
                properties: {
                  phone: { type: "string", example: "+919876543210" },
                  role: { type: "string", enum: ["customer", "merchant", "technician", "admin"] },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OTP sent successfully." } },
      },
    },
    "/api/v1/auth/verify-otp": {
      post: {
        summary: "Verify OTP and obtain auth token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone", "otp"],
                properties: {
                  phone: { type: "string", example: "+919876543210" },
                  otp: { type: "string", example: "123456" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Authentication successful, returns user and token." } },
      },
    },
    "/api/v1/auth/me": {
      get: {
        summary: "Get current user profile",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "User profile." }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/v1/merchants": {
      get: {
        summary: "List and filter verified merchants",
        tags: ["Merchants"],
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "zone", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "List of merchants." } },
      },
    },
    "/api/v1/merchants/{id}": {
      get: {
        summary: "Get merchant details and active technician team",
        tags: ["Merchants"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Merchant details." }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/bookings": {
      post: {
        summary: "Create booking request & trigger smart dispatch",
        tags: ["Bookings"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["category", "serviceTitle", "description", "address", "latitude", "longitude"],
                properties: {
                  category: { type: "string", enum: ["electrician", "plumbing", "ac", "appliance"] },
                  serviceTitle: { type: "string" },
                  description: { type: "string" },
                  address: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  scheduledType: { type: "string", enum: ["instant", "scheduled"] },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Booking created and offers dispatched." } },
      },
      get: {
        summary: "List bookings for current authenticated user",
        tags: ["Bookings"],
        security: [{ BearerAuth: [] }],
        responses: { "200": { description: "List of bookings." } },
      },
    },
    "/api/v1/bookings/{id}/accept": {
      post: {
        summary: "Atomic First Acceptance by merchant (Redlock protected)",
        tags: ["Dispatch"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Booking accepted." },
          "409": { description: "Conflict: already accepted by another merchant." },
        },
      },
    },
    "/api/v1/bookings/{id}/quote": {
      post: {
        summary: "Technician submits inspection quote",
        tags: ["Lifecycle"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Quote submitted." } },
      },
    },
    "/api/v1/bookings/{id}/complete": {
      post: {
        summary: "Technician marks service work completed",
        tags: ["Lifecycle"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Service marked completed." } },
      },
    },
    "/api/v1/bookings/{id}/payment": {
      post: {
        summary: "Record payment settlement (Cash on completion or online UPI)",
        tags: ["Payments"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Payment recorded." } },
      },
    },
    "/api/v1/bookings/{id}/invoice": {
      get: {
        summary: "Get itemized billing invoice breakdown",
        tags: ["Payments"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Itemized invoice breakdown." } },
      },
    },
    "/api/v1/demo/prices/{category}": {
      get: {
        summary: "Read a fictional baseline price example",
        tags: ["Demo"],
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
            description: "Fictional estimate example.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DemoPrice" } } },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
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
    },
  },
} as const;
