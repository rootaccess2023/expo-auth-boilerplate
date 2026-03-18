import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "auth_token";

export const getToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(TOKEN_KEY);

export const saveToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(TOKEN_KEY, token);

export const deleteToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(TOKEN_KEY);

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data as T;
};

export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export const login = (email: string, password: string): Promise<AuthResponse> =>
  request<AuthResponse>("/api/v1/login", {
    method: "POST",
    body: JSON.stringify({ user: { email, password } }),
  });

export const signup = (
  email: string,
  password: string,
  password_confirmation: string,
): Promise<AuthResponse> =>
  request<AuthResponse>("/api/v1/signup", {
    method: "POST",
    body: JSON.stringify({ user: { email, password, password_confirmation } }),
  });

export const getMe = (): Promise<MeResponse> =>
  request<MeResponse>("/api/v1/me");

export const logout = (): Promise<void> =>
  request<void>("/api/v1/logout", { method: "DELETE" });
