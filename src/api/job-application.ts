import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/src/api/client";

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interviewing"
  | "offer"
  | "rejected"
  | "accepted"
  | "withdrawn";

export interface StatusChange {
  id: number;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_at: string;
}

export interface JobApplication {
  id: number;
  slug: string;
  role_title: string;
  status: ApplicationStatus;
  location: string | null;
  source: string | null;
  applied_on: string | null;
  created_at: string;
  company: {
    id: number;
    name: string;
  };
  status_changes?: StatusChange[];
}

export interface NewApplication {
  company_name: string;
  role_title: string;
  status?: ApplicationStatus;
  location?: string;
  source?: string;
  applied_on?: string;
}

const QUERY_KEY = ["job_applications"] as const;

export const api = {
  list: () => request<JobApplication[]>("/job_applications"),
  get:  (slug: string) => request<JobApplication>(`/job_applications/${slug}`),
  create: (data: NewApplication) =>
    request<JobApplication>("/job_applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (slug: string, status: ApplicationStatus) =>
    request<JobApplication>(`/job_applications/${slug}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (slug: string) =>
    request<void>(`/job_applications/${slug}`, { method: "DELETE" }),
};

export function useApplication(slug: string | undefined) {
  return useQuery({
    queryKey: ["job_applications", slug],
    queryFn:  () => api.get(slug!),
    enabled:  Boolean(slug),
  });
}

export function useApplications() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: api.list,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["home_summary"] });
    },
  });
}

export function useUpdateStatus(slug: string) {
  const queryClient = useQueryClient();
  const detailKey = ["job_applications", slug] as const;

  return useMutation({
    mutationFn: (status: ApplicationStatus) => api.updateStatus(slug, status),

    // Optimistic: flip the badge instantly
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<JobApplication>(detailKey);
      if (previous) {
        queryClient.setQueryData<JobApplication>(detailKey, { ...previous, status });
      }
      return { previous };
    },

    // On success the server returns the full application including the new status_change row;
    // write it directly to the cache (no extra refetch needed) then refresh the list badge.
    onSuccess: (data) => {
      queryClient.setQueryData(detailKey, data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },

    onError: (_err, _status, context) => {
      if (context?.previous) {
        queryClient.setQueryData(detailKey, context.previous);
      }
    },
  });
}
