"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

export default function HomePage() {
  const [status, setStatus] = useState<"idle" | "ok" | "down">("idle");

  useEffect(() => {
    healthCheck()
      .then(() => setStatus("ok"))
      .catch(() => setStatus("down"));
  }, []);

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <span className="badge">Candidate ? Employer</span>
          <h1>Hire fast. Apply faster. Keep it human.</h1>
          <p>
            A focused job portal for internships and full-time roles. Candidates build profiles once, employers
            manage applicants in one place.
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
            <Link className="button" href="/jobs">
              Browse Jobs
            </Link>
            <Link className="button ghost" href="/register">
              Create Account
            </Link>
          </div>
        </div>
        <div className="card">
          <h3>Portal Status</h3>
          <p className="status" style={{ marginTop: "8px" }}>
            {status === "idle" && "Checking backend..."}
            {status === "ok" && "Backend online. Ready for action."}
            {status === "down" && "Backend offline. Start your API server."}
          </p>
          <div style={{ marginTop: "18px" }}>
            <div className="pill">Role-based access</div>
            <div className="pill" style={{ marginTop: "10px" }}>
              Upload CV (PDF)
            </div>
            <div className="pill" style={{ marginTop: "10px" }}>
              Applicant tracking
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-3">
        <div className="card">
          <h3>For Candidates</h3>
          <p className="status">Build once, apply anywhere, track decisions.</p>
        </div>
        <div className="card">
          <h3>For Employers</h3>
          <p className="status">Post jobs, review applicants, update status quickly.</p>
        </div>
        <div className="card">
          <h3>For Admins</h3>
          <p className="status">Moderate listings and keep the portal clean.</p>
        </div>
      </section>
    </div>
  );
}
