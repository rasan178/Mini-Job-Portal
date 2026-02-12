"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCandidateProfile, upsertCandidateProfile, uploadCandidateCv } from "@/lib/api";
import type { CandidateProfile } from "@/lib/types";

export default function CandidateDashboard() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    if (!token) return;
    getCandidateProfile(token)
      .then((data) => {
        setProfile(data.profile);
        setSkillsInput(data.profile?.skills?.join(", ") || "");
      })
      .catch(() => undefined);
  }, [token]);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        phone: profile?.phone || "",
        location: profile?.location || "",
        bio: profile?.bio || "",
        skills: skillsInput,
      } as Partial<CandidateProfile>;
      const data = await upsertCandidateProfile(token, payload);
      setProfile(data.profile);
      setMessage("Profile saved.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onUploadCv = async () => {
    if (!token || !cvFile) {
      setMessage("Select a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("cv", cvFile);
    try {
      setLoading(true);
      const data = await uploadCandidateCv(token, formData);
      setProfile(data.profile);
      setMessage("CV uploaded.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="notice">Login as a candidate to manage your profile.</div>;
  }

  if (user.role !== "candidate") {
    return <div className="notice">This dashboard is for candidates only.</div>;
  }

  return (
    <div className="grid grid-2">
      <form className="card stack" onSubmit={onSave}>
        <h2>Candidate Profile</h2>
        <div className="field">
          <label className="label">Name</label>
          <input className="input" value={user.name} disabled />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input className="input" value={user.email} disabled />
        </div>
        <div className="field">
          <label className="label">Phone</label>
          <input
            className="input"
            value={profile?.phone || ""}
            onChange={(e) => setProfile({ ...(profile || { skills: [] }), phone: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="label">Location</label>
          <input
            className="input"
            value={profile?.location || ""}
            onChange={(e) => setProfile({ ...(profile || { skills: [] }), location: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="label">Skills (comma separated)</label>
          <input className="input" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Bio</label>
          <textarea
            className="textarea"
            value={profile?.bio || ""}
            onChange={(e) => setProfile({ ...(profile || { skills: [] }), bio: e.target.value })}
          />
        </div>
        {message && <div className="notice">{message}</div>}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save profile"}
        </button>
      </form>

      <div className="card stack">
        <h3>Upload CV (PDF)</h3>
        <input
          className="input"
          type="file"
          accept="application/pdf"
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
        />
        {profile?.cvUrl && (
          <a className="button ghost small" href={profile.cvUrl} target="_blank" rel="noreferrer">
            View current CV
          </a>
        )}
        <button className="button" type="button" onClick={onUploadCv} disabled={loading}>
          {loading ? "Uploading..." : "Upload CV"}
        </button>
      </div>
    </div>
  );
}
