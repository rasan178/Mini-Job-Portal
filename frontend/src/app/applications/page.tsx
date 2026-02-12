"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listMyApplications } from "@/lib/api";
import type { Application } from "@/lib/types";

export default function ApplicationsPage() {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await listMyApplications(token);
      setApplications(data.applications);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  if (!user) {
    return <div className="notice">Login to see your applications.</div>;
  }

  if (user.role !== "candidate") {
    return <div className="notice">Applications list is for candidates.</div>;
  }

  return (
    <div className="stack">
      <h2>My Applications</h2>
      {loading && <div className="notice">Loading applications...</div>}
      {error && <div className="notice">{error}</div>}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const job = typeof app.jobId === "string" ? null : app.jobId;
              return (
                <tr key={app._id}>
                  <td>{job?.title || "Job"}</td>
                  <td>{job?.location || "-"}</td>
                  <td>{job?.jobType || "-"}</td>
                  <td>{app.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
