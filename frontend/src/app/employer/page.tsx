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
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

type JobFormState = {
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  salaryRange: string;
};

type EmployerProfileSnapshot = {
  companyName: string;
  description: string;
  website: string;
};

const normalizeEmployerProfile = (
  profile: EmployerProfile | null | undefined
): EmployerProfileSnapshot => ({
  companyName: profile?.companyName || "",
  description: profile?.description || "",
  website: profile?.website || "",
});

export default function EmployerDashboard() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [initialProfile, setInitialProfile] = useState<EmployerProfileSnapshot>({
    companyName: "",
    description: "",
    website: "",
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState<JobFormState>({
    title: "",
    description: "",
    location: "",
    jobType: "Internship",
    salaryRange: "",
  });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Record<string, Application[]>>({});
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      const [profileData, jobsData] = await Promise.all([
        getEmployerProfile(token),
        listMyJobs(token),
      ]);
      setProfile(profileData.profile);
      setInitialProfile(normalizeEmployerProfile(profileData.profile));
      setJobs(jobsData.jobs || []);
    } catch (err) {
      toast.error((err as Error).message);
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
      setInitialProfile(normalizeEmployerProfile(data.profile));
      toast.success("Profile updated.");
    } catch (err) {
      toast.error((err as Error).message);
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
      toast.success("Job created.");
    } catch (err) {
      toast.error((err as Error).message);
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
      toast.success("Job updated.");
    } catch (err) {
      toast.error((err as Error).message);
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
      toast.success("Job deleted.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (jobId: string) => {
    if (!token) return;
    try {
      const data = await listApplicantsForJob(token, jobId);
      setApplicants((prev) => ({ ...prev, [jobId]: data.applications }));
      toast.success("Applicants loaded.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onStatusChange = async (appId: string, jobId: string, status: string) => {
    if (!token) return;
    try {
      const data = await updateApplicationStatus(token, appId, status);
      setApplicants((prev) => ({
        ...prev,
        [jobId]:
          prev[jobId]?.map((app) => {
            if (app._id !== data.application._id) return app;
            const returned = data.application as Application;
            const candidateField = typeof returned.candidateId === "string" ? app.candidateId : returned.candidateId;
            return { ...returned, candidateId: candidateField } as Application;
          }) || [],
      }));
      toast.success("Application status updated.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const roleMessage = useMemo(() => {
    if (!user) return "Login as an employer to manage jobs.";
    if (user.role !== "employer") return "This dashboard is for employers only.";
    return null;
  }, [user]);

  const hasCreateJobInput = useMemo(() => {
    return (
      createForm.title.trim().length > 0 ||
      createForm.description.trim().length > 0 ||
      createForm.location.trim().length > 0 ||
      createForm.salaryRange.trim().length > 0
    );
  }, [createForm]);

  const hasProfileChanges = useMemo(() => {
    const current = normalizeEmployerProfile(profile);
    return (
      current.companyName !== initialProfile.companyName ||
      current.description !== initialProfile.description ||
      current.website !== initialProfile.website
    );
  }, [profile, initialProfile]);

  if (roleMessage) {
    return <div className="notice">{roleMessage}</div>;
  }

  return (
    <div className="stack">
      <div className="grid grid-2">
        <form className="card h-full flex flex-col justify-between" onSubmit={onSaveProfile}>
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
          <button
            className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              opacity: !hasProfileChanges ? 0.5 : 1,
              cursor: !hasProfileChanges ? "not-allowed" : "pointer",
            }}
            type="submit"
            disabled={loading || !hasProfileChanges}
          >
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
          <button
            className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              opacity: !hasCreateJobInput ? 0.5 : 1,
              cursor: !hasCreateJobInput ? "not-allowed" : "pointer",
            }}
            type="submit"
            disabled={loading || !hasCreateJobInput}
          >
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
                <button
                  className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                  style={{ paddingTop: 12, paddingBottom: 12 }}
                  type="button"
                  onClick={() => onUpdateJob(job)}
                >
                  Save
                </button>
              </div>
            ) : (
              <div>
                <h3>{job.title}</h3>
                <p className="status">{job.location} · {job.jobType}</p>
                <div className="gap-[10px] mt-[10px] flex items-center w-full">
                  <button
                    className="w-[60%] bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                    type="button"
                    onClick={() => setEditingJobId(job._id)}
                  >
                    Edit
                  </button>
                  <button
                    className="w-[60%] bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                    type="button"
                    onClick={() => setJobToDelete(job)}
                  >
                    Delete
                  </button>
                  <button
                    className="w-[60%] bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                    type="button"
                    onClick={() => loadApplicants(job._id)}
                  >
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
                      const isShortlisted = app.status === "Shortlisted";
                      const isRejected = app.status === "Rejected";
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
                              <option value="Pending" disabled={isShortlisted || isRejected}>
                                Pending
                              </option>
                              <option value="Shortlisted" disabled={isRejected}>
                                Shortlisted
                              </option>
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
      <ConfirmModal
        open={!!jobToDelete}
        title="Delete Job?"
        description={`This will permanently delete "${jobToDelete?.title || "this job"}".`}
        confirmLabel="Delete Job"
        isProcessing={loading}
        onCancel={() => setJobToDelete(null)}
        onConfirm={async () => {
          if (!jobToDelete) return;
          await onDeleteJob(jobToDelete._id);
          setJobToDelete(null);
        }}
      />
    </div>
  );
}
