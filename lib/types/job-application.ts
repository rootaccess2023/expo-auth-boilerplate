export interface JobApplication {
  id: number;
  company: string;
  job_title: string;
  job_url: string;
  location: string;
  source: string;
  stage: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type CreateJobApplicationPayload = {
  company: string;
  job_title: string;
  job_url: string;
  location: string;
  source: string;
  stage: string;
  notes: string;
};

export interface CreateJobApplicationResponse {
  job_application: JobApplication;
}
