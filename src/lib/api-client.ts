/**
 * Fix Hub Platform — End-to-End API Client
 * Connects frontend views with backend REST API services.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000";

export interface ApiClientOptions {
  baseUrl?: string;
  token?: string | null;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || API_BASE_URL;
    if (typeof window !== "undefined") {
      this.token = options.token || localStorage.getItem("fixhub_auth_token");
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("fixhub_auth_token", token);
      } else {
        localStorage.removeItem("fixhub_auth_token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || `Request failed with status ${response.status}`;
      const code = data?.error?.code || "API_ERROR";
      const error: any = new Error(message);
      error.code = code;
      error.status = response.status;
      throw error;
    }

    return data as T;
  }

  // Auth
  public auth = {
    requestOtp: (phone: string, role?: string) =>
      this.request<{ success: boolean; message: string; testOtp?: string }>("/api/v1/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone, role }),
      }),
    verifyOtp: (phone: string, otp: string, name?: string) =>
      this.request<{ user: any; token: string }>("/api/v1/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp, name }),
      }).then((res) => {
        if (res.token) this.setToken(res.token);
        return res;
      }),
    getMe: () => this.request<{ user: any }>("/api/v1/auth/me"),
    logout: () => this.setToken(null),
  };

  // Merchants
  public merchants = {
    list: (params?: { category?: string; zone?: string; activeOnly?: boolean }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set("category", params.category);
      if (params?.zone) query.set("zone", params.zone);
      if (params?.activeOnly !== undefined) query.set("activeOnly", String(params.activeOnly));
      return this.request<{ merchants: any[]; count: number }>(`/api/v1/merchants?${query.toString()}`);
    },
    get: (id: string) => this.request<{ merchant: any; technicians: any[] }>(`/api/v1/merchants/${id}`),
    onboard: (data: any) =>
      this.request<{ merchant: any }>("/api/v1/merchants/onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    setAvailability: (id: string, isAvailable: boolean) =>
      this.request<{ merchant: any }>(`/api/v1/merchants/${id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable }),
      }),
    addTechnician: (merchantId: string, data: { name: string; phone: string; skills: string[] }) =>
      this.request<{ technician: any }>(`/api/v1/merchants/${merchantId}/technicians`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Bookings
  public bookings = {
    create: (data: {
      category: string;
      serviceTitle: string;
      description: string;
      address: string;
      latitude: number;
      longitude: number;
      scheduledType?: "instant" | "scheduled";
      scheduledTime?: string;
      paymentMethod?: string;
    }) =>
      this.request<{ booking: any }>("/api/v1/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    list: () => this.request<{ bookings: any[]; count: number }>("/api/v1/bookings"),
    get: (id: string) =>
      this.request<{ booking: any; merchant?: any; technician?: any; quotes: any[] }>(`/api/v1/bookings/${id}`),
    accept: (id: string, merchantId?: string) =>
      this.request<{ booking: any; message: string }>(`/api/v1/bookings/${id}/accept`, {
        method: "POST",
        body: JSON.stringify({ merchantId }),
      }),
    assignTechnician: (id: string, technicianId: string) =>
      this.request<{ booking: any }>(`/api/v1/bookings/${id}/assign-technician`, {
        method: "POST",
        body: JSON.stringify({ technicianId }),
      }),
    updateProgress: (id: string, status: "on_the_way" | "arrived") =>
      this.request<{ booking: any }>(`/api/v1/bookings/${id}/progress`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    submitQuote: (
      id: string,
      data: {
        technicianId: string;
        items: Array<{ description: string; amount: number }>;
        laborAmount: number;
        partsAmount: number;
      }
    ) =>
      this.request<{ quote: any }>(`/api/v1/bookings/${id}/quote`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    respondQuote: (id: string, quoteId: string, accept: boolean) =>
      this.request<{ booking: any }>(`/api/v1/bookings/${id}/quote/respond`, {
        method: "POST",
        body: JSON.stringify({ quoteId, accept }),
      }),
    complete: (id: string) =>
      this.request<{ booking: any }>(`/api/v1/bookings/${id}/complete`, {
        method: "POST",
      }),
    recordPayment: (id: string, paymentMethod: string = "cash_on_completion") =>
      this.request<{ booking: any; message: string }>(`/api/v1/bookings/${id}/payment`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod }),
      }),
    cancel: (id: string, reason: string) =>
      this.request<{ booking: any; message: string }>(`/api/v1/bookings/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    getInvoice: (id: string) => this.request<{ invoice: any }>(`/api/v1/bookings/${id}/invoice`),
  };

  // Reviews
  public reviews = {
    submit: (bookingId: string, rating: number, comment?: string) =>
      this.request<{ review: any }>(`/api/v1/bookings/${bookingId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      }),
    listForMerchant: (merchantId: string) =>
      this.request<{ reviews: any[]; count: number }>(`/api/v1/merchants/${merchantId}/reviews`),
  };

  // Disputes
  public disputes = {
    raise: (bookingId: string, reason: string, details: string) =>
      this.request<{ dispute: any }>("/api/v1/disputes", {
        method: "POST",
        body: JSON.stringify({ bookingId, reason, details }),
      }),
    list: () => this.request<{ disputes: any[]; count: number }>("/api/v1/disputes"),
    resolve: (id: string, resolutionNotes: string) =>
      this.request<{ dispute: any; message: string }>(`/api/v1/disputes/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolutionNotes }),
      }),
  };

  // Notifications
  public notifications = {
    list: () => this.request<{ notifications: any[]; count: number }>("/api/v1/notifications"),
    markRead: (id: string) =>
      this.request<{ notification: any }>(`/api/v1/notifications/${id}/read`, {
        method: "POST",
      }),
    getPreferences: () => this.request<{ preferences: any }>("/api/v1/notifications/preferences"),
  };
}

export const apiClient = new ApiClient();
