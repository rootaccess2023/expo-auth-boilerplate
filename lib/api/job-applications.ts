import type {
  CreateApplicationEventPayload,
  CreateApplicationEventResponse,
  CreateJobApplicationPayload,
  CreateJobApplicationResponse,
  GetApplicationEventsResponse,
  GetJobApplicationResponse,
  JobApplication,
  UpdateJobApplicationPayload,
  UpdateJobApplicationResponse,
} from "../types/job-application";
import { request } from "./client";

export type {
  CreateApplicationEventPayload,
  CreateJobApplicationPayload,
} from "../types/job-application";

export const createJobApplication = (payload: CreateJobApplicationPayload) =>
  request<CreateJobApplicationResponse>("/api/v1/job_applications", {
    method: "POST",
    body: JSON.stringify({ job_application: payload }),
  });

export interface GetJobApplicationsResponse {
  job_applications: JobApplication[];
}

export const getJobApplications = () =>
  request<GetJobApplicationsResponse>("/api/v1/job_applications");

export const getJobApplication = (slug: string) =>
  request<GetJobApplicationResponse>(`/api/v1/job_applications/${slug}`);

export const updateJobApplication = (
  slug: string,
  payload: UpdateJobApplicationPayload,
) =>
  request<UpdateJobApplicationResponse>(`/api/v1/job_applications/${slug}`, {
    method: "PATCH",
    body: JSON.stringify({ job_application: payload }),
  });

export const getApplicationEvents = (slug: string) =>
  request<GetApplicationEventsResponse>(
    `/api/v1/job_applications/${slug}/events`,
  );

export const createApplicationEvent = (
  slug: string,
  payload: CreateApplicationEventPayload,
) =>
  request<CreateApplicationEventResponse>(
    `/api/v1/job_applications/${slug}/events`,
    {
      method: "POST",
      body: JSON.stringify({ event: payload }),
    },
  );
