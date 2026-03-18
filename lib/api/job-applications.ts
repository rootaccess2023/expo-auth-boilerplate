import { request } from "./client";

export type CreateJobApplicationPayload = {
  company: string;
  job_title: string;
  job_url: string;
  location: string;
  source: string;
  stage: string;
  notes: string;
};

export const createJobApplication = (payload: CreateJobApplicationPayload) =>
  request("/api/v1/job_applications", {
    method: "POST",
    body: JSON.stringify({ job_application: payload }),
  });
