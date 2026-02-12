"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listJobsPublic } from "@/lib/api";
import type { Job } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function JobsPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({ keyword: "", location: "", jobType: "" });
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listJobsPublic(
        {
          keyword: filters.keyword || undefined,
          location: filters.location || undefined,
          jobType: filters.jobType || undefined,
        },
        token || undefined
      );
      setJobs(data.jobs || []);
    } catch (err) {
      const message = (err as Error).message;
      toast.error(
        user?.role === "employer" && message.includes("Employers cannot view all jobs")
          ? "Employers should use the Employer Dashboard to view their jobs."
          : message
      );
    } finally {
      setLoading(false);
    }
  }, [filters, token, user?.role]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  return (
    <div className="stack">
      <div className="card">
        <h2>Job listings</h2>
        <div className="grid grid-3" style={{ marginTop: "16px" }}>
          <div className="field">
            <label className="label">Keyword</label>
            <input
              className="input"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Location</label>
            <input
              className="input"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="label">Job type</label>
            <select
              className="select"
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
            >
              <option value="">All</option>
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <button
            className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
            style={{ paddingTop: 12, paddingBottom: 12 }}
            type="button"
            onClick={loadJobs}
          >
            Apply filters
          </button>
        </div>
      </div>

      {loading && <div className="notice">Loading jobs...</div>}
      {jobs.length === 0 && !loading && <div className="notice">No jobs match your filters.</div>}

      <div className="grid grid-2">
        {jobs.map((job) => (
          <div className="card" key={job._id}>
            <h3>{job.title}</h3>
            <p className="status" style={{ marginTop: "6px" }}>
              {job.location} · {job.jobType}
            </p>
            <p className="status" style={{ marginTop: "8px" }}>
              {job.description.slice(0, 120)}...
            </p>
            <div style={{ marginTop: "12px" }}>
              <Link className="button ghost small" href={`/jobs/${job._id}`}>
                View details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
