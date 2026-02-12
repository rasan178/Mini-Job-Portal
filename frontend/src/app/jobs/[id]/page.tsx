"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { applyToJob, getCvs, getJob } from "@/lib/api";
import type { Job } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Loader from "@/components/Loader";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id;
  const { user, token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [savedCvs, setSavedCvs] = useState<Array<{ _id: string; url: string; fileName?: string; uploadedAt: string }>>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done">("idle");
  const [showApplyLoader, setShowApplyLoader] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      const data = await getJob(jobId, token || undefined);
      setJob(data.job);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [jobId, token]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (!token || user?.role !== "candidate") return;
    getCvs(token)
      .then((data) => {
        const cvs = data.cvs || [];
        setSavedCvs(cvs);
        if (cvs.length > 0) {
          setSelectedCvId(cvs[0]._id);
        }
      })
      .catch((err) => {
        const message = (err as Error).message;
        if (!message.includes("No CVs found")) {
          toast.error(message);
        }
        setSavedCvs([]);
      });
  }, [token, user?.role]);

  const onApply = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !jobId) {
      toast.error("Please login as a candidate to apply.");
      return;
    }

    const startTime = Date.now();
    try {
      setSubmitState("sending");
      setShowApplyLoader(true);
      const formData = new FormData();
      if (message) formData.append("message", message);
      if (file) formData.append("cv", file);
      if (!file && selectedCvId) formData.append("selectedCvId", selectedCvId);
      await applyToJob(token, jobId, formData);
      setSubmitState("done");
      setMessage("");
      setFile(null);
      toast.success("Application submitted.");
    } catch (err) {
      toast.error((err as Error).message);
      setSubmitState("idle");
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setShowApplyLoader(false);
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
      {user?.role === "candidate" && user && (
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
              <label className="label">Select uploaded CV</label>
              {savedCvs.length > 0 ? (
                <select
                  className="select"
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  disabled={!!file}
                >
                  {savedCvs.map((cv) => (
                    <option key={cv._id} value={cv._id}>
                      {cv.fileName || "CV.pdf"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="status">No uploaded CVs found. Upload one below.</div>
              )}
            </div>
            <div className="field">
              <label className="label">Upload CV (PDF)</label>
              <input
                className="input"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  setFile(picked);
                }}
              />
              <div className="status">
                {file ? "Using uploaded file for this application." : "If no file is uploaded, selected saved CV will be used."}
              </div>
            </div>
            <button
              className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
              style={{ paddingTop: 12, paddingBottom: 12 }}
              type="submit"
              disabled={submitState === "sending"}
            >
              {submitState === "sending" ? "Submitting..." : "Apply"}
            </button>
          </form>
        )}
      </div>
      )}
      {showApplyLoader && (
        <div
          style={{ zIndex: 1000 }}
          className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <Loader />
        </div>
      )}
    </div>
  );
}
