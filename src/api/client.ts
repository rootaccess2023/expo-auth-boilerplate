const BASE_URL = process.env.EXPO_PUBLIC_API_URL + "/api/v1";

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.errors)
      ? body.errors.join(", ")
      : body.error ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
