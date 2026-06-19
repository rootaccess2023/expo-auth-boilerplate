import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/src/api/client";
import { deleteToken, saveToken } from "@/src/auth/token";

// --- Types (matching exact Rails JSON shapes) ---

export interface Credentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthUser {
  id: number;
  email: string;
}

export interface MeUser extends AuthUser {
  created_at: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

// --- API ---

export const api = {
  login: (data: Credentials) =>
    request<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ user: data }),
    }),

  signup: (data: SignupData) =>
    request<AuthResponse>("/signup", {
      method: "POST",
      body: JSON.stringify({ user: data }),
    }),

  logout: () =>
    request<{ message: string }>("/logout", { method: "DELETE" }),

  // /me returns { user: MeUser } — unwrap so hooks get MeUser directly
  me: async (): Promise<MeUser> => {
    const res = await request<{ user: MeUser }>("/me");
    return res.user;
  },
};

// --- Hooks ---

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: api.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: async ({ token }) => {
      await saveToken(token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.signup,
    onSuccess: async ({ token }) => {
      await saveToken(token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSettled: async () => {
      // Always clean up locally even if the server call fails.
      // removeQueries (not clear) so the mutation's isPending stays true
      // until navigation completes — prevents the button re-enabling mid-flight.
      await deleteToken();
      queryClient.removeQueries();
    },
  });
}
