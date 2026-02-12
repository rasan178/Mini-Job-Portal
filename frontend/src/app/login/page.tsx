"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const resp = await login(email, password);
      localStorage.setItem("userId", resp.user.id);
      toast.success("Login successful!");
      setTimeout(() => router.push("/jobs"), 700);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={onSubmit}>
        <h2>Welcome back</h2>
        <div className="field">
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ position: "relative" }}>
          <label className="label">Password</label>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <button
          className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
          style={{ paddingTop: 12, paddingBottom: 12 }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="status flex gap-2">
          New here? <Link href="/register"><span className="underline hover:scale-95">Create an account</span></Link>
        </p>
      </form>
      <div className="card">
        <h3>Access tips</h3>
        <ul className="stack" style={{ marginTop: "12px" }}>
          <li className="status">Use your registered email and password.</li>
          <li className="status">Candidates can browse and apply.</li>
          <li className="status">Employers manage listings and applicants.</li>
        </ul>
      </div>
    </div>
  );
}
