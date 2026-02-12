"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminDeleteJob, listAdminJobs } from "@/lib/api";
import type { Job } from "@/lib/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function AdminPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

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
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const onDelete = async (id: string) => {
    if (!token) return;
    try {
      setDeleting(true);
      await adminDeleteJob(token, id);
      setJobs((prev) => prev.filter((job) => job._id !== id));
      toast.success("Job deleted.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) {
    return <div className="notice">Admin access required.</div>;
  }

  return (
    <div className="stack">
      <h2>Admin Moderation</h2>
      {loading && <div className="notice">Loading jobs...</div>}
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
                  <button
                    className="button ghost small"
                    style={{ paddingTop: 12, paddingBottom: 12}}
                    type="button"
                    onClick={() => setJobToDelete(job)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!jobToDelete}
        title="Delete Job?"
        description={`This will permanently delete "${jobToDelete?.title || "this job"}".`}
        confirmLabel="Delete Job"
        isProcessing={deleting}
        onCancel={() => setJobToDelete(null)}
        onConfirm={async () => {
          if (!jobToDelete) return;
          await onDelete(jobToDelete._id);
          setJobToDelete(null);
        }}
      />
    </div>
  );
}
