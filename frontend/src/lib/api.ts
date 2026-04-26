export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
  
  if (res.status === 401) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (!refreshRes.ok) throw new Error("Refresh failed");
          
          const data = await refreshRes.json();
          localStorage.setItem("token", data.access_token);
          if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
          }
          onRefreshed(data.access_token);
          isRefreshing = false;
          
          return fetch(url, {
            ...options,
            headers: getAuthHeaders(options.headers),
          });
        } catch (e) {
          isRefreshing = false;
          refreshSubscribers = [];
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          throw new Error("Unauthorized");
        }
      } else {
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken: string) => {
            const newHeaders = new Headers(options.headers || {});
            newHeaders.set("Content-Type", "application/json");
            newHeaders.set("Authorization", `Bearer ${newToken}`);
            resolve(fetch(url, { ...options, headers: newHeaders }));
          });
        });
      }
    }
  }
  return res;
}

// Auth
export async function login(data: any) {
  const formData = new URLSearchParams();
  formData.append("username", data.username);
  formData.append("password", data.password);
  
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  return res.json();
}

export async function register(data: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Registration failed");
  }
  return res.json();
}

export async function getMe() {
  const res = await fetchWithAuth(`${API_URL}/users/me`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

// Event Types
export async function fetchEventTypes() {
  const res = await fetchWithAuth(`${API_URL}/event-types`);
  if (!res.ok) throw new Error("Failed to fetch event types");
  return res.json();
}

export async function fetchEventType(id: string | number) {
  const res = await fetchWithAuth(`${API_URL}/event-types/${id}`);
  if (!res.ok) throw new Error("Failed to fetch event type");
  return res.json();
}

export async function createEventType(data: any) {
  const res = await fetchWithAuth(`${API_URL}/event-types`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create event type");
  }
  return res.json();
}

export async function updateEventType(id: number, data: any) {
  const res = await fetchWithAuth(`${API_URL}/event-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update event type");
  }
  return res.json();
}

export async function deleteEventType(id: number) {
  const res = await fetchWithAuth(`${API_URL}/event-types/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete event type");
  return res.json();
}

// Schedules
export async function fetchSchedules() {
  const res = await fetchWithAuth(`${API_URL}/schedules`);
  if (!res.ok) throw new Error("Failed to fetch schedules");
  return res.json();
}

export async function createSchedule(data: any) {
  const res = await fetchWithAuth(`${API_URL}/schedules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create schedule");
  return res.json();
}

export async function updateSchedule(id: number, data: any) {
  const res = await fetchWithAuth(`${API_URL}/schedules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update schedule");
  return res.json();
}

export async function deleteSchedule(id: number) {
  const res = await fetchWithAuth(`${API_URL}/schedules/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete schedule");
  return res.json();
}

export async function setDefaultSchedule(id: number) {
  const res = await fetchWithAuth(`${API_URL}/schedules/${id}/default`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error("Failed to set default schedule");
  return res.json();
}

// Availabilities
export async function fetchAvailabilities(scheduleId: number) {
  const res = await fetchWithAuth(`${API_URL}/schedules/${scheduleId}/availability`);
  if (!res.ok) throw new Error("Failed to fetch availability");
  return res.json();
}

export async function updateAvailabilities(scheduleId: number, data: any) {
  const res = await fetchWithAuth(`${API_URL}/schedules/${scheduleId}/availability`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update availability");
  return res.json();
}

// Date Overrides
export async function fetchScheduleOverrides(scheduleId: number) {
  const res = await fetchWithAuth(`${API_URL}/schedules/${scheduleId}/overrides`);
  if (!res.ok) throw new Error("Failed to fetch overrides");
  return res.json();
}

export async function updateScheduleOverrides(scheduleId: number, data: any) {
  const res = await fetchWithAuth(`${API_URL}/schedules/${scheduleId}/overrides`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update overrides");
  return res.json();
}

// Bookings
export async function fetchBookings() {
  const res = await fetchWithAuth(`${API_URL}/bookings`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function cancelBooking(id: number) {
  const res = await fetchWithAuth(`${API_URL}/bookings/${id}/cancel`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to cancel booking");
  return res.json();
}

// Public
export async function fetchPublicUserEventTypes(username: string) {
  const res = await fetch(`${API_URL}/public/${username}/event-types`);
  if (!res.ok) throw new Error("Failed to fetch event types");
  return res.json();
}

export async function fetchPublicEventType(username: string, slug: string) {
  const res = await fetch(`${API_URL}/public/${username}/event-types/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch event type");
  return res.json();
}

export async function fetchPublicSlots(username: string, slug: string, date: string) {
  const res = await fetch(`${API_URL}/public/${username}/slots/${slug}?target_date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch slots");
  return res.json();
}

export async function createPublicBooking(data: any) {
  const res = await fetch(`${API_URL}/public/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create booking");
  }
  return res.json();
}
