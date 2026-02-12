"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminDeleteJob, listAdminJobs } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function AdminPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
    if (!user) return false;
    return user.role === "admin" || (!!adminEmail && user.email.toLowerCase() === adminEmail);
  }, [user]);

  const loadJobs = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await listAdminJobs(token);
      setJobs(data.jobs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const onDelete = async (id: string) => {
    if (!token) return;
    await adminDeleteJob(token, id);
    setJobs((prev) => prev.filter((job) => job._id !== id));
  };

  if (!isAdmin) {
    return <div className="notice">Admin access required.</div>;
  }

  return (
    <div className="stack">
      <h2>Admin Moderation</h2>
      {loading && <div className="notice">Loading jobs...</div>}
      {error && <div className="notice">{error}</div>}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id}>
                <td>{job.title}</td>
                <td>{job.location}</td>
                <td>{job.jobType}</td>
                <td>
                  <button className="button ghost small" type="button" onClick={() => onDelete(job._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
