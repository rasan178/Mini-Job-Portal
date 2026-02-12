export interface User {
  id: string;
  email: string;
  role: "candidate" | "employer" | "admin";
  name: string;
}

export interface Response {
  "token": string,
  "user": User
}

export interface CandidateProfile {
  userId?: string;
  phone?: string;
  location?: string;
  skills: string[];
  bio?: string;
  cvUrl?: string;
}

export interface EmployerProfile {
  userId?: string;
  companyName: string;
  description?: string;
  website?: string;
}

export type JobType = "Internship" | "Full-time";

export interface Job {
  _id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  salaryRange?: string;
  createdAt?: string;
}

export type ApplicationStatus = "Pending" | "Shortlisted" | "Rejected";

export interface Application {
  _id: string;
  jobId: Job | string;
  candidateId: { name: string; email: string } | string;
  message?: string;
  cvUrl?: string;
  status: ApplicationStatus;
  createdAt?: string;
}
