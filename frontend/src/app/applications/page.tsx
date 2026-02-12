"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { deleteMyApplication, listMyApplications } from "@/lib/api";
import type { Application } from "@/lib/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function ApplicationsPage() {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);

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
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const onDeleteApplication = async (appId: string) => {
    if (!token) return;
    try {
      setDeleting(true);
      await deleteMyApplication(token, appId);
      setApplications((prev) => prev.filter((app) => app._id !== appId));
      toast.success("Application deleted.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

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
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
              <th></th>
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
                  <td>
                    <button
                      className="button ghost small"
                      type="button"
                      aria-label="Delete application"
                      title="Delete application"
                      onClick={() => setAppToDelete(app)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="red"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!appToDelete}
        title="Delete Application?"
        description="This will permanently remove your application for this job."
        confirmLabel="Delete"
        isProcessing={deleting}
        onCancel={() => setAppToDelete(null)}
        onConfirm={async () => {
          if (!appToDelete) return;
          await onDeleteApplication(appToDelete._id);
          setAppToDelete(null);
        }}
      />
    </div>
  );
}
