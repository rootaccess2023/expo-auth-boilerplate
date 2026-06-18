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
};

export function useApplication(slug: string) {
  return useQuery({
    queryKey: ["job_applications", slug],
    queryFn:  () => api.get(slug),
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
