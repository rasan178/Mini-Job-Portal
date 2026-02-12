"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { applyToJob, getJob } from "@/lib/api";
import type { Job } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id;
  const { user, token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const data = await getJob(jobId, token || undefined);
      setJob(data.job);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [jobId, token]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  const onApply = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !jobId) {
      setError("Please login as a candidate to apply.");
      return;
    }

    try {
      setSubmitState("sending");
      const formData = new FormData();
      if (message) formData.append("message", message);
      if (file) formData.append("cv", file);
      await applyToJob(token, jobId, formData);
      setSubmitState("done");
    } catch (err) {
      setError((err as Error).message);
      setSubmitState("error");
    }
  };

  if (loading) {
    return <div className="notice">Loading job details...</div>;
  }

  if (!job) {
    return <div className="notice">Job not found.</div>;
  }

  return (
    <div className="grid grid-2">
      <div className="card stack">
        <h2>{job.title}</h2>
        <p className="status">{job.location}</p>
        <p className="status">Type: {job.jobType}</p>
        {job.salaryRange && <p className="status">Salary: {job.salaryRange}</p>}
        <p style={{ marginTop: "12px" }}>{job.description}</p>
        <Link className="button ghost small" href="/jobs">
          Back to jobs
        </Link>
      </div>
      <div className="card stack">
        <h3>Apply to this job</h3>
        {!user && <div className="notice">Login to apply and attach your CV.</div>}
        {user?.role !== "candidate" && user && (
          <div className="notice">Only candidates can apply.</div>
        )}
        {user?.role === "candidate" && (
          <form className="stack" onSubmit={onApply}>
            <div className="field">
              <label className="label">Message (optional)</label>
              <textarea
                className="textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Upload CV (PDF)</label>
              <input
                className="input"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {submitState === "done" && <div className="notice">Application submitted.</div>}
            {submitState === "error" && error && <div className="notice">{error}</div>}
            <button className="button" type="submit" disabled={submitState === "sending"}>
              {submitState === "sending" ? "Submitting..." : "Apply"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
