import { useQuery } from "@tanstack/react-query";
import { request } from "@/src/api/client";
import { ApplicationStatus } from "@/src/api/job-application";

export interface HomeCounts {
  total: number;
  this_week: number;
  applied: number;
  screening: number;
  interviewing: number;
  offer: number;
}

export interface StaleApplication {
  slug: string;
  role_title: string;
  status: ApplicationStatus;
  applied_on: string | null;
  days_since: number;
  company: { name: string };
}

export interface ActivityItem {
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_at: string;
  slug: string;
  role_title: string;
  company: { name: string };
}

export interface HomeSummary {
  counts: HomeCounts;
  stale_applications: StaleApplication[];
  recent_activity: ActivityItem[];
}

const QUERY_KEY = ["home_summary"] as const;

export const api = {
  summary: () => request<HomeSummary>("/home_summary"),
};

export function useHomeSummary() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: api.summary,
  });
}
