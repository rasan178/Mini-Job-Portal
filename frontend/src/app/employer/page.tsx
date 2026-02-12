"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createJob,
  deleteJob,
  getEmployerProfile,
  listApplicantsForJob,
  listMyJobs,
  updateApplicationStatus,
  updateJob,
  upsertEmployerProfile,
} from "@/lib/api";
import type { Application, EmployerProfile, Job, JobType } from "@/lib/types";

type JobFormState = {
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  salaryRange: string;
};

export default function EmployerDashboard() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<JobFormState>({
    title: "",
    description: "",
    location: "",
    jobType: "Internship",
    salaryRange: "",
  });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Record<string, Application[]>>({});

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      const [profileData, jobsData] = await Promise.all([
        getEmployerProfile(token),
        listMyJobs(token),
      ]);
      setProfile(profileData.profile);
      setJobs(jobsData.jobs || []);
      setMessage(null);
    } catch (err) {
      setMessage((err as Error).message);
    }
  }, [token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const data = await upsertEmployerProfile(token, profile || { companyName: "" });
      setProfile(data.profile);
      setMessage("Profile updated.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onCreateJob = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const data = await createJob(token, createForm);
      setJobs((prev) => [data.job, ...prev]);
      setCreateForm({ title: "", description: "", location: "", jobType: "Internship", salaryRange: "" });
      setMessage("Job created.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onUpdateJob = async (job: Job) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await updateJob(token, job._id, job);
      setJobs((prev) => prev.map((item) => (item._id === job._id ? data.job : item)));
      setEditingJobId(null);
      setMessage("Job updated.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteJob = async (jobId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await deleteJob(token, jobId);
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      setMessage("Job deleted.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (jobId: string) => {
    if (!token) return;
    try {
      const data = await listApplicantsForJob(token, jobId);
      setApplicants((prev) => ({ ...prev, [jobId]: data.applications }));
      setMessage("Applicants loaded.");
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const onStatusChange = async (appId: string, jobId: string, status: string) => {
    if (!token) return;
    try {
      const data = await updateApplicationStatus(token, appId, status);
      setApplicants((prev) => ({
        ...prev,
        [jobId]: prev[jobId]?.map((app) => (app._id === data.application._id ? data.application : app)) || [],
      }));
      setMessage("Application status updated.");
    } catch (err) {
      setMessage((err as Error).message);
    }
  };

  const roleMessage = useMemo(() => {
    if (!user) return "Login as an employer to manage jobs.";
    if (user.role !== "employer") return "This dashboard is for employers only.";
    return null;
  }, [user]);

  if (roleMessage) {
    return <div className="notice">{roleMessage}</div>;
  }

  return (
    <div className="stack">
      <div className="grid grid-2">
        <form className="card stack" onSubmit={onSaveProfile}>
          <h2>Employer Profile</h2>
          <div className="field">
            <label className="label">Company name</label>
            <input
              className="input"
              value={profile?.companyName || ""}
              onChange={(e) => setProfile({ ...(profile || { companyName: "" }), companyName: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Description</label>
            <textarea
              className="textarea"
              value={profile?.description || ""}
              onChange={(e) => setProfile({ ...(profile || { companyName: "" }), description: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Website</label>
            <input
              className="input"
              value={profile?.website || ""}
              onChange={(e) => setProfile({ ...(profile || { companyName: "" }), website: e.target.value })}
            />
          </div>
          {message && <div className="notice">{message}</div>}
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form className="card stack" onSubmit={onCreateJob}>
          <h2>Post a job</h2>
          <div className="field">
            <label className="label">Title</label>
            <input
              className="input"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Description</label>
            <textarea
              className="textarea"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Location</label>
            <input
              className="input"
              value={createForm.location}
              onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Job type</label>
            <select
              className="select"
              value={createForm.jobType}
              onChange={(e) => setCreateForm({ ...createForm, jobType: e.target.value as JobType })}
            >
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Salary range (optional)</label>
            <input
              className="input"
              value={createForm.salaryRange}
              onChange={(e) => setCreateForm({ ...createForm, salaryRange: e.target.value })}
            />
          </div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Posting..." : "Create job"}
          </button>
        </form>
      </div>

      <div className="card stack">
        <h2>Your jobs</h2>
        {jobs.length === 0 && <div className="status">No jobs yet. Create one above.</div>}
        {jobs.map((job) => (
          <div className="card" key={job._id} style={{ boxShadow: "none" }}>
            {editingJobId === job._id ? (
              <div className="stack">
                <input
                  className="input"
                  value={job.title}
                  onChange={(e) =>
                    setJobs((prev) =>
                      prev.map((item) => (item._id === job._id ? { ...item, title: e.target.value } : item))
                    )
                  }
                />
                <textarea
                  className="textarea"
                  value={job.description}
                  onChange={(e) =>
                    setJobs((prev) =>
                      prev.map((item) => (item._id === job._id ? { ...item, description: e.target.value } : item))
                    )
                  }
                />
                <input
                  className="input"
                  value={job.location}
                  onChange={(e) =>
                    setJobs((prev) =>
                      prev.map((item) => (item._id === job._id ? { ...item, location: e.target.value } : item))
                    )
                  }
                />
                <button className="button" type="button" onClick={() => onUpdateJob(job)}>
                  Save
                </button>
              </div>
            ) : (
              <div>
                <h3>{job.title}</h3>
                <p className="status">{job.location} · {job.jobType}</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                  <button className="button ghost small" type="button" onClick={() => setEditingJobId(job._id)}>
                    Edit
                  </button>
                  <button className="button ghost small" type="button" onClick={() => onDeleteJob(job._id)}>
                    Delete
                  </button>
                  <button className="button ghost small" type="button" onClick={() => loadApplicants(job._id)}>
                    View applicants
                  </button>
                </div>
              </div>
            )}
            {applicants[job._id] && (
              <div style={{ marginTop: "14px" }}>
                <h4>Applicants</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants[job._id].map((app) => {
                      const candidate = typeof app.candidateId === "string" ? null : app.candidateId;
                      return (
                        <tr key={app._id}>
                          <td>{candidate?.name || "Candidate"}</td>
                          <td>{candidate?.email || "-"}</td>
                          <td>
                            <select
                              className="select"
                              value={app.status}
                              onChange={(e) => onStatusChange(app._id, job._id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
