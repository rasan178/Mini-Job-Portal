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
  const [editForm, setEditForm] = useState<JobFormState>({
    title: "",
    description: "",
    location: "",
    jobType: "Internship",
    salaryRange: "",
  });
  const [applicants, setApplicants] = useState<Record<string, Application[]>>({});
  const [applicantsModalJob, setApplicantsModalJob] = useState<Job | null>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
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

  const onUpdateJob = async () => {
    if (!token || !editingJobId) return;
    setLoading(true);
    try {
      const data = await updateJob(token, editingJobId, {
        title: editForm.title,
        description: editForm.description,
        location: editForm.location,
        jobType: editForm.jobType,
        salaryRange: editForm.salaryRange,
      });
      setJobs((prev) => prev.map((item) => (item._id === editingJobId ? data.job : item)));
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

  const loadApplicants = async (job: Job) => {
    if (!token) return;
    setApplicantsModalJob(job);
    try {
      setLoadingApplicants(true);
      const data = await listApplicantsForJob(token, job._id);
      setApplicants((prev) => ({ ...prev, [job._id]: data.applications }));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingApplicants(false);
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

  const editingJob = useMemo(
    () => jobs.find((job) => job._id === editingJobId) || null,
    [jobs, editingJobId]
  );

  const hasEditJobChanges = useMemo(() => {
    if (!editingJob) return false;
    return (
      editForm.title !== editingJob.title ||
      editForm.description !== editingJob.description ||
      editForm.location !== editingJob.location ||
      editForm.jobType !== editingJob.jobType ||
      editForm.salaryRange !== (editingJob.salaryRange || "")
    );
  }, [editForm, editingJob]);

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
            <div>
              <h3>{job.title}</h3>
              <p className="status">{job.location} · {job.jobType}</p>
              <div className="gap-[10px] mt-[10px] flex items-center w-full">
                <button
                  className="w-[60%] bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                  style={{ paddingTop: 12, paddingBottom: 12 }}
                  type="button"
                  onClick={() => {
                    setEditingJobId(job._id);
                    setEditForm({
                      title: job.title,
                      description: job.description,
                      location: job.location,
                      jobType: job.jobType,
                      salaryRange: job.salaryRange || "",
                    });
                  }}
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
                  onClick={() => loadApplicants(job)}
                >
                  View applicants
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {applicantsModalJob && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="applicants-title">
          <div className="confirm-modal stack" style={{ width: "min(900px, 100%)", maxHeight: "85vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between">
              <h3 id="applicants-title">Applicants - {applicantsModalJob.title}</h3>
              <button
                className="w-full bg-[red] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                style={{ paddingTop: 12, paddingBottom: 12, maxWidth: 140 }}
                type="button"
                onClick={() => setApplicantsModalJob(null)}
              >
                Close
              </button>
            </div>

            {loadingApplicants ? (
              <div className="notice">Loading applicants...</div>
            ) : (
              <>
                {(applicants[applicantsModalJob._id] || []).length === 0 ? (
                  <div className="status">No applicants yet.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(applicants[applicantsModalJob._id] || []).map((app) => {
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
                                onChange={(e) => onStatusChange(app._id, applicantsModalJob._id, e.target.value)}
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
                )}
              </>
            )}
          </div>
        </div>
      )}
      {editingJobId && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-job-title">
          <div className="confirm-modal stack" style={{ width: "min(640px, 100%)" }}>
            <h3 id="edit-job-title">Edit Job</h3>
            <div className="field">
              <label className="label">Title</label>
              <input
                className="input"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="label">Location</label>
              <input
                className="input"
                value={editForm.location}
                onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="label">Job type</label>
              <select
                className="select"
                value={editForm.jobType}
                onChange={(e) => setEditForm((prev) => ({ ...prev, jobType: e.target.value as JobType }))}
              >
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Salary range (optional)</label>
              <input
                className="input"
                value={editForm.salaryRange}
                onChange={(e) => setEditForm((prev) => ({ ...prev, salaryRange: e.target.value }))}
              />
            </div>
            <div className="confirm-actions">
              <button
                className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                style={{ paddingTop: 12, paddingBottom: 12 }}
                type="button"
                onClick={() => setEditingJobId(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  opacity: !hasEditJobChanges ? 0.5 : 1,
                  cursor: !hasEditJobChanges ? "not-allowed" : "pointer",
                }}
                type="button"
                onClick={onUpdateJob}
                disabled={loading || !hasEditJobChanges}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
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
