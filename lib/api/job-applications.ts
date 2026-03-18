import type {
  CreateJobApplicationPayload,
  CreateJobApplicationResponse,
  JobApplication,
} from "../types/job-application";
import { request } from "./client";

export type { CreateJobApplicationPayload } from "../types/job-application";

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
