"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCandidateProfile, upsertCandidateProfile, uploadCv, getCvs, deleteCv } from "@/lib/api";
import type { CandidateProfile } from "@/lib/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";

type CvItem = { _id: string; url: string; fileName?: string; uploadedAt: string };

export default function CandidateDashboard() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvs, setCvs] = useState<CvItem[] | null>(null);
  const [cvToDelete, setCvToDelete] = useState<CvItem | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!token) return;
    getCandidateProfile(token)
      .then((data) => {
        setProfile(data.profile);
        setSkillsInput(data.profile?.skills?.join(", ") || "");
      })
      .catch((err) => toast.error((err as Error).message));
    // load cvs
    getCvs(token)
      .then((data) => setCvs(data.cvs || []))
      .catch(() => setCvs([]));
  }, [token]);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setLoadingProfile(true);
    try {
      const payload = {
        phone: profile?.phone || "",
        location: profile?.location || "",
        bio: profile?.bio || "",
        skills: skillsInput
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      } as Partial<CandidateProfile>;
      const data = await upsertCandidateProfile(token, payload);
      setProfile(data.profile);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const onUploadCv = async () => {
    if (!token || !cvFile) {
      toast.error("Select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("cv", cvFile);
    try {
      setLoading(true);
      await uploadCv(token, formData);
      // refresh list
      const data = await getCvs(token);
      setCvs(data.cvs || []);
      toast.success("CV uploaded.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteCv = async (id: string) => {
    if (!token) return;
    try {
      setLoading(true);
      await deleteCv(token, id);
      const data = await getCvs(token);
      setCvs(data.cvs || []);
      toast.success("CV deleted.");
    } catch (err) {
      toast.error((err as Error).message);
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
            onChange={(e) => setProfile({ ...( profile || { skills: [] }), bio: e.target.value })}
          />
        </div>
        <button
          className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
          style={{ paddingTop: 12, paddingBottom: 12 }}
          type="submit"
          disabled={loadingProfile}
        >
          {loadingProfile ? "Saving..." : "Save profile"}
        </button>
      </form>

      <div className="card gap-20 flex flex-col h-full justify-between">
        <h3>Upload CV (PDF)</h3>
        <input
          ref={cvInputRef}
          className="input"
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
        />
        <div className="flex flex-col flex-wrap items-center justify-center gap-3 border rounded-lg px-4 py-3 min-h-14 h-full border-[#EEEDED]">
          <button
            className="button ghost small"
            type="button"
            onClick={() => cvInputRef.current?.click()}
          >
            Choose File
          </button>
          <span className="status">{cvFile ? cvFile.name : "No file chosen"}</span>
        </div>
        <div className="flex flex-col gap-2 w-full">
          {cvs && cvs.length > 0 ? (
            cvs.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-2">
                <div className="status truncate max-w-[60%]" title={c.fileName || "CV.pdf"}>
                  {c.fileName || "CV.pdf"}
                </div>
                <div className="flex items-center gap-2">
                  <a className="button ghost small" href={c.url} target="_blank" rel="noreferrer">
                    View CV
                  </a>
                  <button
                    className="button ghost small"
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                    type="button"
                    onClick={() => setCvToDelete(c)}
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
                </div>
              </div>
            ))
          ) : (
            <div className="status">No CVs uploaded</div>
          )}
        </div>
        <button
          className="w-full bg-[#FF7F11] text-white rounded-2xl cursor-pointer text-lg font-semibold shadow-lg"
          style={{ paddingTop: 12, paddingBottom: 12 }}
          type="button"
          onClick={onUploadCv}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload CV"}
        </button>
      </div>
      <ConfirmModal
        open={!!cvToDelete}
        title="Delete CV?"
        description={`This will permanently remove ${cvToDelete?.fileName || "this CV"}.`}
        confirmLabel="Delete CV"
        isProcessing={loading}
        onCancel={() => setCvToDelete(null)}
        onConfirm={async () => {
          if (!cvToDelete) return;
          await onDeleteCv(cvToDelete._id);
          setCvToDelete(null);
        }}
      />
    </div>
  );
}
