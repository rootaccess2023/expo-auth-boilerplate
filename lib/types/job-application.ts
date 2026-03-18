export interface JobApplication {
  id: number;
  slug: string;
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

export interface ApplicationEvent {
  id: number;
  job_application_id: number;
  user_id: number;
  title: string;
  event_type: string;
  starts_at: string | null;
  ends_at: string | null;
  all_day: boolean | null;
  location: string | null;
  meeting_url: string | null;
  notes: string | null;
  status: string | null;
  reminder_minutes_before: number | null;
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

export interface GetJobApplicationResponse {
  job_application: JobApplication;
  events: ApplicationEvent[];
}

export interface UpdateJobApplicationPayload {
  stage?: string;
  notes?: string;
}

export interface UpdateJobApplicationResponse {
  job_application: JobApplication;
}

export interface CreateApplicationEventPayload {
  title: string;
  event_type: string;
  starts_at?: string | null;
  ends_at?: string | null;
  all_day?: boolean;
  location?: string;
  meeting_url?: string;
  notes?: string;
  status?: string;
  reminder_minutes_before?: number | null;
}

export interface CreateApplicationEventResponse {
  event: ApplicationEvent;
}

export interface GetApplicationEventsResponse {
  events: ApplicationEvent[];
}
