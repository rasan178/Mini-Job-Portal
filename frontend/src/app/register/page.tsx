"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      await register(form);
      toast.success("Account created. Please login.");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      toast.error((err as Error).message);
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
        <div className="field" style={{ position: "relative" }}>
          <label className="label">Password</label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="button ghost small"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                padding: 6,
                border: "none",
                background: "transparent",
                boxShadow: "none",
                outline: "none",
              }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M2 12C4.4 8.2 7.6 6 12 6s7.6 2.2 10 6c-2.4 3.8-5.6 6-10 6s-7.6-2.2-10-6z" fill="currentColor" />
                  <circle cx="12" cy="12" r="3.8" fill="white" />
                  <circle cx="12" cy="12" r="1.9" fill="currentColor" />
                  <circle cx="13.2" cy="10.8" r="0.65" fill="white" />
                  <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M12 2.2v2.4" />
                    <path d="M6 3.9l1.2 2.1" />
                    <path d="M18 3.9l-1.2 2.1" />
                    <path d="M3.8 7.6l2 1.2" />
                    <path d="M20.2 7.6l-2 1.2" />
                  </g>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M2 12C4.4 8.2 7.6 6 12 6s7.6 2.2 10 6c-2.4 3.8-5.6 6-10 6s-7.6-2.2-10-6z" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M12 21.8v-2.4" />
                    <path d="M6 20.1l1.2-2.1" />
                    <path d="M18 20.1l-1.2-2.1" />
                    <path d="M3.8 16.4l2-1.2" />
                    <path d="M20.2 16.4l-2-1.2" />
                  </g>
                </svg>
              )}
            </button>
          </div>
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
        <button className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
          style={{ paddingTop: 12, paddingBottom: 12 }} type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
        <p className="status flex gap-2">
          Already have an account? <Link href="/login"><span className="underline hover:scale-95">Login</span></Link>
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
