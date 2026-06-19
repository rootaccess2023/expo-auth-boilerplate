import { deleteToken, getToken } from "@/src/auth/token";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL + "/api/v1";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    await deleteToken();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.errors)
      ? body.errors.join(", ")
      : body.error ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
