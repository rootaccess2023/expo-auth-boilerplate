import { request } from "./client";
import type {
  CreateJobApplicationPayload,
  CreateJobApplicationResponse,
} from "../types/job-application";

export type { CreateJobApplicationPayload } from "../types/job-application";

export const createJobApplication = (payload: CreateJobApplicationPayload) =>
  request<CreateJobApplicationResponse>("/api/v1/job_applications", {
    method: "POST",
    body: JSON.stringify({ job_application: payload }),
  });
