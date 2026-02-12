import { apiFetch } from "@/lib/http";
import type { Application, CandidateProfile, EmployerProfile, Job, User } from "@/lib/types";

export const healthCheck = () => apiFetch<{ status: string }>("/health");

export const registerUser = (payload: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => apiFetch<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });

export const loginUser = (payload: { email: string; password: string }) =>
  apiFetch<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const authMe = (token: string) =>
  apiFetch<{ user: User }>("/api/auth/me", { method: "GET", token });

export const getCandidateProfile = (token: string) =>
  apiFetch<{ profile: CandidateProfile | null }>("/api/candidate/profile", { token });

export const upsertCandidateProfile = (token: string, payload: Partial<CandidateProfile>) =>
  apiFetch<{ profile: CandidateProfile }>("/api/candidate/profile", {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });

export const uploadCv = (token: string, formData: FormData) =>
  apiFetch<{ profile: CandidateProfile }>("/api/uploads/cv", {
    method: "POST",
    token,
    body: formData,
    isFormData: true,
  });

export const getCvs = (token: string) =>
  apiFetch<{ cvs: Array<{ _id: string; url: string; fileName?: string; uploadedAt: string }> }>("/api/uploads/cv", { token });

export const deleteCv = (token: string, cvId: string) =>
  apiFetch<{ message: string }>(`/api/uploads/cv/${cvId}`, { method: "DELETE", token });

export const getEmployerProfile = (token: string) =>
  apiFetch<{ profile: EmployerProfile | null }>("/api/employer/profile", { token });

export const upsertEmployerProfile = (token: string, payload: Partial<EmployerProfile>) =>
  apiFetch<{ profile: EmployerProfile }>("/api/employer/profile", {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });

export const listJobsPublic = (params: { keyword?: string; location?: string; jobType?: string }, token?: string) => {
  const qs = new URLSearchParams();
  if (params.keyword) qs.set("keyword", params.keyword);
  if (params.location) qs.set("location", params.location);
  if (params.jobType) qs.set("jobType", params.jobType);
  const query = qs.toString();
  return apiFetch<{ jobs: Job[] }>(`/api/jobs${query ? `?${query}` : ""}`, {
    token: token ?? null,
  });
};

export const listMyJobs = (token: string) => apiFetch<{ jobs: Job[] }>("/api/jobs/mine", { token });

export const getJob = (id: string, token?: string) =>
  apiFetch<{ job: Job }>(`/api/jobs/${id}`, { token: token ?? null });

export const createJob = (token: string, payload: Partial<Job>) =>
  apiFetch<{ job: Job }>("/api/jobs", { method: "POST", token, body: JSON.stringify(payload) });

export const updateJob = (token: string, id: string, payload: Partial<Job>) =>
  apiFetch<{ job: Job }>(`/api/jobs/${id}`, { method: "PUT", token, body: JSON.stringify(payload) });

export const deleteJob = (token: string, id: string) =>
  apiFetch<{ message: string }>(`/api/jobs/${id}`, { method: "DELETE", token });

export const applyToJob = (token: string, jobId: string, formData: FormData) =>
  apiFetch<{ application: Application }>(`/api/jobs/${jobId}/apply`, {
    method: "POST",
    token,
    body: formData,
    isFormData: true,
  });

export const listMyApplications = (token: string) =>
  apiFetch<{ applications: Application[] }>("/api/applications/my", { token });

export const deleteMyApplication = (token: string, appId: string) =>
  apiFetch<{ message: string }>(`/api/applications/${appId}`, { method: "DELETE", token });

export const listApplicantsForJob = (token: string, jobId: string) =>
  apiFetch<{ applications: Application[] }>(`/api/jobs/${jobId}/applications`, { token });

export const updateApplicationStatus = (token: string, appId: string, status: string) =>
  apiFetch<{ application: Application }>(`/api/applications/${appId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });

export const listAdminJobs = (token: string) => apiFetch<{ jobs: Job[] }>("/api/admin/jobs", { token });

export const adminDeleteJob = (token: string, id: string) =>
  apiFetch<{ message: string }>(`/api/admin/jobs/${id}`, { method: "DELETE", token });
