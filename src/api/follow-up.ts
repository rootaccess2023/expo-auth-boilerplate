import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/src/api/client";

export interface FollowUpApplication {
  slug: string;
  role_title: string;
  company: { name: string };
}

export interface FollowUp {
  id: number;
  title: string;
  due_at: string;
  completed_at: string | null;
  job_application: FollowUpApplication | null;
}

export interface NewFollowUp {
  title: string;
  due_at: string;
  application_slug?: string;
}

export interface UpdateFollowUp {
  title?: string;
  due_at?: string;
  completed?: boolean;
}

const QUERY_KEY = ["follow_ups"] as const;

export const api = {
  list: () => request<FollowUp[]>("/follow_ups"),
  create: (data: NewFollowUp) =>
    request<FollowUp>("/follow_ups", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateFollowUp) =>
    request<FollowUp>(`/follow_ups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  complete: (id: number) =>
    request<FollowUp>(`/follow_ups/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    }),
  remove: (id: number) =>
    request<void>(`/follow_ups/${id}`, { method: "DELETE" }),
};

export function useFollowUps() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: api.list,
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFollowUp }) =>
      api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.complete,
    // Optimistic: vanish the item immediately so the tap feels instant.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<FollowUp[]>(QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<FollowUp[]>(
          QUERY_KEY,
          previous.filter((f) => f.id !== id)
        );
      }
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
