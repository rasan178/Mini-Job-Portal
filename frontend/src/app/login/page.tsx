"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Response } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<Response | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const resp = await login(email, password);
      setUser(resp);
      localStorage.setItem("userId", resp.user.id);
      router.push("/jobs");
    } catch (err) {
      setError((err as Error).message);
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
        <div className="field">
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="notice">{error}</div>}
        {user && <div className="notice">Logged in as {user.user.email}</div>}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="status">
          New here? <Link href="/register">Create an account</Link>
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
