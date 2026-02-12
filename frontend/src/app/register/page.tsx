"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      await register(form);
      setSuccess("Account created. Please login.");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={onSubmit}>
        <h2>Create your account</h2>
        <div className="field">
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="label">Role</label>
          <select
            className="select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="candidate">Candidate</option>
            <option value="employer">Employer</option>
          </select>
        </div>
        {error && <div className="notice">{error}</div>}
        {success && <div className="notice">{success}</div>}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
        <p className="status">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
      <div className="card">
        <h3>What you get</h3>
        <ul className="stack" style={{ marginTop: "12px" }}>
          <li className="status">Candidate profiles with CV uploads.</li>
          <li className="status">Employer dashboards for job management.</li>
          <li className="status">Admin moderation tools.</li>
        </ul>
      </div>
    </div>
  );
}
