"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import { nigeriaGeo } from "../../../data/nigeria.js";
import "../studio.css";

const POSITIONS = [
  { id: "president", name: "President", sortOrder: 1 },
  { id: "vice-president", name: "Vice President", sortOrder: 2 },
  { id: "senator", name: "Senator", sortOrder: 3 },
  { id: "house-of-reps", name: "House of Representatives", sortOrder: 4 },
  { id: "governor", name: "Governor", sortOrder: 5 },
  { id: "deputy-governor", name: "Deputy Governor", sortOrder: 6 },
  { id: "state-house-of-assembly", name: "State House of Assembly", sortOrder: 7 },
  { id: "lga-chairman", name: "Local Government Chairman", sortOrder: 8 },
  { id: "councillor", name: "Councillor", sortOrder: 9 },
];

function getPositionSortOrder(id: string) {
  const pos = POSITIONS.find(p => p.id === id);
  return pos ? pos.sortOrder : 99;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Party {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
}

// Profile = the person (personal details)
interface Profile {
  id: string;
  full_name: string;
  slug: string;
  profile_picture_url: string | null;
  age: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  bio: string | null;
  state_of_origin: string | null;
  profile_url: string;
  links: string[];
  current_party_id: string | null;
  latest_election_year: number | null;
  last_known_position: string | null;
}

// Candidate = one electoral run (joined with profile and party)
interface CandidateRow {
  id: string;
  document_id: string | null;
  year: number | null;
  position: string;                 // id from static POSITIONS (e.g. "governor")
  position_sort_order: number | null;
  party_id: string | null;
  state_id: string;
  lga: string;
  vice_candidate_name: string;
  display: boolean;
  source: string[];
  updated_at: string;
  profile: Profile | null;
  party: Pick<Party, "id" | "name" | "abbreviation" | "logo"> | null;
}

// Flat form state — combines candidate + profile fields for the editor
interface CandidateForm {
  // ── Profile Reference ──
  profile_id: string;
  // ── Candidacy fields ──
  year: string;
  position: string;                 // id into static POSITIONS
  party_id: string;
  state_id: string;
  lga: string;
  vice_candidate_name: string;
  display: boolean;
  source: string[];
}

type ContentType = "candidates" | "parties" | "profiles";

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

// ─── Static reference data (not from DB) ─────────────────────────────────────
const NIGERIA_STATES = nigeriaGeo.map((s) => ({ id: s.id, name: s.name }));


// ─── Helpers ──────────────────────────────────────────────────────────────────

let toastCounter = 0;

function initCandidateForm(): CandidateForm {
  return {
    profile_id: "",
    year: String(new Date().getFullYear()),
    position: "",
    party_id: "",
    state_id: "",
    lga: "",
    vice_candidate_name: "",
    display: true,
    source: [],
  };
}

function candidateRowToForm(row: CandidateRow): CandidateForm {
  return {
    profile_id: row.profile?.id ?? "",
    year: row.year != null ? String(row.year) : "",
    position: row.position ?? "",
    party_id: row.party_id ?? "",
    state_id: row.state_id ?? "",
    lga: row.lga ?? "",
    vice_candidate_name: row.vice_candidate_name ?? "",
    display: row.display !== false,
    source: Array.isArray(row.source) ? row.source : [],
  };
}

function initPartyForm(): Partial<Party> {
  return { name: "", abbreviation: "", logo: "" };
}

type ProfileForm = Omit<Profile, "id" | "age" | "latest_election_year"> & { age: string; latest_election_year: string };

function initProfileForm(): ProfileForm {
  return {
    full_name: "",
    slug: "",
    profile_picture_url: "",
    age: "",
    contact_email: "",
    contact_phone: "",
    bio: "",
    state_of_origin: "",
    profile_url: "",
    links: [],
    current_party_id: "",
    latest_election_year: "",
    last_known_position: "",
  };
}

function profileToForm(p: Profile): ProfileForm {
  return {
    full_name: p.full_name ?? "",
    slug: p.slug ?? "",
    profile_picture_url: p.profile_picture_url ?? "",
    age: p.age != null ? String(p.age) : "",
    contact_email: p.contact_email ?? "",
    contact_phone: p.contact_phone ?? "",
    bio: p.bio ?? "",
    state_of_origin: p.state_of_origin ?? "",
    profile_url: p.profile_url ?? "",
    links: Array.isArray(p.links) ? p.links : [],
    current_party_id: p.current_party_id ?? "",
    latest_election_year: p.latest_election_year != null ? String(p.latest_election_year) : "",
    last_known_position: p.last_known_position ?? "",
  };
}

function avatarInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/studio/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Upload failed");
  }
  const json = await res.json();
  return json.url as string;
}



// ═══════════════════════════════════════════════════════════════════════════════
// Studio Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function StudioPage() {
  const [activeType, setActiveType] = useState<ContentType>("candidates");
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // positions and states come from static data — no DB fetch needed
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [candidateForm, setCandidateForm] =
    useState<CandidateForm>(initCandidateForm());
  const [partyForm, setPartyForm] = useState<Partial<Party>>(initPartyForm());
  const [profileForm, setProfileForm] = useState<ProfileForm>(initProfileForm());

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [c, p, profs] = await Promise.all([
      fetch("/api/studio/candidates").then((r) => r.json()),
      fetch("/api/studio/parties").then((r) => r.json()),
      fetch("/api/studio/profiles").then((r) => r.json()),
    ]);
    if (Array.isArray(c)) setCandidates(c);
    if (Array.isArray(p)) setParties(p);
    if (Array.isArray(profs)) setProfiles(profs);
  }

  function showToast(type: "success" | "error", message: string) {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  }

  function selectItem(id: string) {
    setSelectedId(id);
    setIsNew(false);
    if (activeType === "candidates") {
      const row = candidates.find((x) => x.id === id);
      if (row) setCandidateForm(candidateRowToForm(row));
    } else if (activeType === "parties") {
      const p = parties.find((x) => x.id === id);
      if (p) setPartyForm({ ...p });
    } else if (activeType === "profiles") {
      const prof = profiles.find((x) => x.id === id);
      if (prof) setProfileForm(profileToForm(prof));
    }
  }

  function newDocument() {
    setSelectedId(null);
    setIsNew(true);
    if (activeType === "candidates") setCandidateForm(initCandidateForm());
    else if (activeType === "parties") setPartyForm(initPartyForm());
    else setProfileForm(initProfileForm());
  }

  function switchType(type: ContentType) {
    setActiveType(type);
    setSelectedId(null);
    setIsNew(false);
    setSearch("");
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      if (activeType === "candidates") await saveCandidate();
      else if (activeType === "parties") await saveParty();
      else await saveProfile();
      await fetchAll();
      showToast("success", "Saved successfully.");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Save failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCandidate() {
    // Derive sort_order from static POSITIONS data
    const staticPos = POSITIONS.find((p) => p.id === candidateForm.position);
    const payload = {
      ...candidateForm,
      year: candidateForm.year ? Number(candidateForm.year) : null,
      position_sort_order: staticPos?.sortOrder ?? getPositionSortOrder(candidateForm.position),
    };

    if (isNew) {
      const res = await fetch("/api/studio/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
      const created = await res.json();
      setSelectedId(created.id);
      setIsNew(false);
    } else {
      const res = await fetch(`/api/studio/candidates/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    }
  }

  async function saveParty() {
    if (isNew) {
      const res = await fetch("/api/studio/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partyForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
      const created: Party = await res.json();
      setSelectedId(created.id);
      setIsNew(false);
    } else {
      const res = await fetch(`/api/studio/parties/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partyForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    }
  }

  async function saveProfile() {
    if (isNew) {
      const res = await fetch("/api/studio/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
      const created: Profile = await res.json();
      setSelectedId(created.id);
      setIsNew(false);
    } else {
      const res = await fetch(`/api/studio/profiles/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
    }
  }

  async function savePosition() {
    // Positions are static — no API call needed.
    showToast("error", "Positions are static data in the codebase.");
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (
      !selectedId ||
      !confirm("Delete this document? This cannot be undone.")
    )
      return;
    setSaving(true);
    try {
      const endpoint =
        activeType === "candidates"
          ? `/api/studio/candidates/${selectedId}`
          : activeType === "parties"
            ? `/api/studio/parties/${selectedId}`
            : `/api/studio/profiles/${selectedId}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      setSelectedId(null);
      setIsNew(false);
      await fetchAll();
      showToast("success", "Deleted.");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Delete failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/studio/login";
  }

  // ─── Filtered lists ───────────────────────────────────────────────────────

  const filteredCandidates = candidates.filter((c) => {
    const name = c.profile?.full_name ?? "";
    const q = search.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      (c.party?.abbreviation ?? "").toLowerCase().includes(q)
    );
  });

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.abbreviation.toLowerCase().includes(search.toLowerCase()),
  );


  const filteredProfiles = profiles.filter(
    (p) =>
      (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.slug || "").toLowerCase().includes(search.toLowerCase()),
  );

  const editTitle = isNew
    ? `New ${activeType.slice(0, -1)}`
    : activeType === "candidates"
      ? profiles.find(p => p.id === candidateForm.profile_id)?.full_name || "Untitled"
      : activeType === "parties"
        ? partyForm.name || "Untitled"
        : profileForm.full_name || "Untitled";

  const showEdit = isNew || selectedId !== null;

  return (
    <>
      <div className="studio-shell">
        {/* ── Sidebar ── */}
        <aside className="studio-sidebar">
          <div className="studio-sidebar-header">
            <div className="studio-logo">
              <div className="studio-logo-icon">GI</div>
              <div>
                <div className="studio-logo-text">Get Involved</div>
                <div className="studio-logo-sub">CMS Studio</div>
              </div>
            </div>
          </div>

          <nav className="studio-nav">
            <div className="studio-nav-section">
              <div className="studio-nav-label">Content</div>
              {(
                [
                  { key: "candidates", icon: "👤", label: "Candidates", count: candidates.length },
                  { key: "parties", icon: "🏛", label: "Parties", count: parties.length },
                  { key: "profiles", icon: "🧑‍💼", label: "Profiles", count: profiles.length },
                ] as const
              ).map(({ key, icon, label, count }) => (
                <button
                  key={key}
                  id={`nav-${key}`}
                  className={`studio-nav-item${activeType === key ? " active" : ""}`}
                  onClick={() => switchType(key)}
                >
                  <span className="studio-nav-icon">{icon}</span>
                  {label}
                  <span className="studio-nav-count">{count}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="studio-sidebar-footer">
            <button
              className="btn-ghost"
              style={{ width: "100%", fontSize: 12 }}
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Document List ── */}
        <div className="studio-list-pane">
          <div className="studio-list-header">
            <span className="studio-list-title">
              {activeType === "candidates"
                ? "Candidates"
                : activeType === "parties"
                  ? "Parties"
                  : "Profiles"}
            </span>
            <button
              id="btn-new-doc"
              className="studio-new-btn"
              onClick={newDocument}
            >
              + New
            </button>
          </div>

          <div className="studio-search-wrap">
            <input
              id="studio-search"
              className="studio-search"
              placeholder={`Search ${activeType}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="studio-list-body">
            {activeType === "candidates" &&
              (filteredCandidates.length === 0 ? (
                <div className="studio-list-empty">No candidates found.</div>
              ) : (
                filteredCandidates.map((c) => {
                  const name = c.profile?.full_name ?? "Unknown";
                  const logo = c.party?.logo ?? "";
                  return (
                    <div
                      key={c.id}
                      className={`studio-list-item${selectedId === c.id && !isNew ? " selected" : ""}`}
                      onClick={() => selectItem(c.id)}
                    >
                      <div className="studio-list-avatar">
                        {logo ? (
                          <img src={logo} alt="" />
                        ) : (
                          avatarInitials(name)
                        )}
                      </div>
                      <div className="studio-list-item-info">
                        <div className="studio-list-item-name">{name}</div>
                        <div className="studio-list-item-meta">
                          {[c.party?.abbreviation, c.position, c.year]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      {!c.display && (
                        <span className="studio-badge hidden">Hidden</span>
                      )}
                    </div>
                  );
                })
              ))}

            {activeType === "parties" &&
              (filteredParties.length === 0 ? (
                <div className="studio-list-empty">No parties found.</div>
              ) : (
                filteredParties.map((p) => (
                  <div
                    key={p.id}
                    className={`studio-list-item${selectedId === p.id && !isNew ? " selected" : ""}`}
                    onClick={() => selectItem(p.id)}
                  >
                    <div className="studio-list-avatar">
                      {p.logo ? (
                        <img src={p.logo} alt="" />
                      ) : (
                        p.abbreviation.slice(0, 2)
                      )}
                    </div>
                    <div className="studio-list-item-info">
                      <div className="studio-list-item-name">{p.name}</div>
                      <div className="studio-list-item-meta">
                        {p.abbreviation}
                      </div>
                    </div>
                  </div>
                ))
              ))}

            {activeType === "profiles" &&
              (filteredProfiles.length === 0 ? (
                <div className="studio-list-empty">No profiles found.</div>
              ) : (
                filteredProfiles.map((p) => (
                  <div
                    key={p.id}
                    className={`studio-list-item${selectedId === p.id && !isNew ? " selected" : ""}`}
                    onClick={() => selectItem(p.id)}
                  >
                    <div className="studio-list-avatar">
                      {p.profile_picture_url ? (
                        <img src={p.profile_picture_url} alt="" />
                      ) : (
                        avatarInitials(p.full_name || "")
                      )}
                    </div>
                    <div className="studio-list-item-info">
                      <div className="studio-list-item-name">{p.full_name || "Unknown"}</div>
                      <div className="studio-list-item-meta">
                        {[p.state_of_origin, p.age ? `${p.age} yrs` : null].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))
              ))}
          </div>
        </div>

        {/* ── Edit Pane ── */}
        <div className="studio-edit-pane">
          {!showEdit ? (
            <div className="studio-blank-state">
              <div className="studio-blank-icon">📄</div>
              <div className="studio-blank-text">
                Select a document or create a new one
              </div>
            </div>
          ) : (
            <>
              <div className="studio-edit-header">
                <div className="studio-edit-title">{editTitle}</div>
                <div className="studio-edit-actions">
                  {!isNew && (
                    <button
                      id="btn-delete-doc"
                      className="btn-danger"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    id="btn-save-doc"
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving && <span className="studio-spinner" />}
                    {saving ? "Saving…" : isNew ? "Publish" : "Save"}
                  </button>
                </div>
              </div>

              <div className="studio-edit-body">
                {activeType === "candidates" && (
                  <CandidateFormPanel
                    form={candidateForm}
                    onChange={setCandidateForm}
                    parties={parties}
                    profiles={profiles}
                    onToast={showToast}
                  />
                )}
                {activeType === "parties" && (
                  <PartyFormPanel
                    form={partyForm}
                    onChange={setPartyForm}
                    onToast={showToast}
                  />
                )}
                {activeType === "profiles" && (
                  <ProfileFormPanel
                    form={profileForm}
                    onChange={setProfileForm}
                    parties={parties}
                    onToast={showToast}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="studio-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`studio-toast ${t.type}`}>
            {t.type === "success" ? "✓" : "✕"} {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Candidate Form — split into two clear panels: Person + Electoral Run
// ═══════════════════════════════════════════════════════════════════════════════

interface CandidateFormProps {
  form: CandidateForm;
  onChange: (form: CandidateForm) => void;
  parties: Party[];
  profiles: Profile[];
  onToast: (type: "success" | "error", msg: string) => void;
}

function CandidateFormPanel({
  form,
  onChange,
  parties,
  profiles,
  onToast,
}: CandidateFormProps) {
  function set<K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) {
    onChange({ ...form, [key]: value });
  }

  function handlePositionChange(positionId: string) {
    // Look up in static POSITIONS data — no DB needed
    const staticPos = POSITIONS.find((p) => p.id === positionId);
    onChange({
      ...form,
      position: positionId,
    });
  }

  function setSource(index: number, value: string) {
    const updated = [...form.source];
    updated[index] = value;
    set("source", updated);
  }

  return (
    <div className="studio-form">
      {/* ── SECTION 1: Person / Profile ── */}
      <div className="studio-panel-label">👤 Person (Profile)</div>
      <p className="studio-hint" style={{ marginTop: -12 }}>
        Select the profile this candidacy belongs to.
      </p>

      <div className="studio-field">
        <label className="studio-label studio-label-required">Profile</label>
        <select
          id="field-profile-id"
          className="studio-input"
          value={form.profile_id}
          onChange={(e) => set("profile_id", e.target.value)}
        >
          <option value="">-- Select Profile --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || "Unknown"}
            </option>
          ))}
        </select>
      </div>

      {/* ── SECTION 2: Electoral Run / Candidacy ── */}
      <hr className="studio-section-divider" style={{ marginTop: 8 }} />
      <div className="studio-panel-label">🗳 Electoral Run (Candidacy)</div>
      <p className="studio-hint" style={{ marginTop: -12 }}>
        Details specific to this particular election and race.
      </p>

      <div className="studio-field-row">
        <div className="studio-field">
          <label className="studio-label studio-label-required">
            Election Year
          </label>
          <input
            id="field-year"
            className="studio-input"
            type="number"
            min={1999}
            max={2100}
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="e.g. 2023"
          />
        </div>
        <div className="studio-field">
          <label className="studio-label studio-label-required">Position</label>
          <select
            id="field-position"
            className="studio-select"
            value={form.position}
            onChange={(e) => handlePositionChange(e.target.value)}
          >
            <option value="">— Select position —</option>
            {POSITIONS.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="studio-field-row">
        <div className="studio-field">
          <label className="studio-label studio-label-required">Party</label>
          <select
            id="field-party"
            className="studio-select"
            value={form.party_id}
            onChange={(e) => set("party_id", e.target.value)}
          >
            <option value="">— Select party —</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.abbreviation} — {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="studio-field">
          <label className="studio-label">Running Mate</label>
          <input
            id="field-vice-name"
            className="studio-input"
            value={form.vice_candidate_name}
            onChange={(e) => set("vice_candidate_name", e.target.value)}
            placeholder="Vice candidate name"
          />
        </div>
      </div>

      <div className="studio-field-row">
        <div className="studio-field">
          <label className="studio-label">State (race)</label>
          <select
            id="field-state"
            className="studio-select"
            value={form.state_id}
            onChange={(e) => set("state_id", e.target.value)}
          >
            <option value="">— National office —</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="studio-field">
          <label className="studio-label">LGA / Constituency</label>
          <input
            id="field-lga"
            className="studio-input"
            value={form.lga}
            onChange={(e) => set("lga", e.target.value)}
            placeholder="Local Government Area"
          />
        </div>
      </div>

      <div className="studio-field">
        <label className="studio-label">Sources</label>
        <div className="studio-sources">
          {form.source.map((url, i) => (
            <div key={i} className="studio-source-row">
              <input
                id={`field-source-${i}`}
                className="studio-input"
                type="url"
                value={url}
                onChange={(e) => setSource(i, e.target.value)}
                placeholder="https://…"
              />
              <button
                type="button"
                className="studio-icon-btn"
                onClick={() =>
                  set(
                    "source",
                    form.source.filter((_, j) => j !== i),
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="studio-add-source-btn"
            onClick={() => set("source", [...form.source, ""])}
          >
            + Add source
          </button>
        </div>
        <p className="studio-hint">
          URLs verifying this specific candidacy.
        </p>
      </div>

      <div className="studio-field">
        <div className="studio-toggle-wrap">
          <label className="studio-toggle">
            <input
              id="field-display"
              type="checkbox"
              checked={form.display}
              onChange={(e) => set("display", e.target.checked)}
            />
            <span className="studio-toggle-slider" />
          </label>
          <span className="studio-toggle-label">Show on website</span>
        </div>
        <p className="studio-hint">
          Uncheck to hide this candidacy from all public pages.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Party Form
// ═══════════════════════════════════════════════════════════════════════════════

interface PartyFormProps {
  form: Partial<Party>;
  onChange: (form: Partial<Party>) => void;
  onToast: (type: "success" | "error", msg: string) => void;
}

function PartyFormPanel({ form, onChange, onToast }: PartyFormProps) {
  function set<K extends keyof Party>(key: K, value: Party[K]) {
    onChange({ ...form, [key]: value });
  }

  async function handleLogoUpload(file: File) {
    try {
      const url = await uploadFile(file);
      set("logo", url);
      onToast("success", "Logo uploaded.");
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="studio-form">
      <div className="studio-panel-label">🏛 Party Details</div>

      <div className="studio-field">
        <label className="studio-label studio-label-required">Party Name</label>
        <input
          id="field-party-name"
          className="studio-input"
          value={form.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. All Progressives Congress"
        />
      </div>

      <div className="studio-field">
        <label className="studio-label studio-label-required">Abbreviation</label>
        <input
          id="field-party-abbr"
          className="studio-input"
          value={form.abbreviation ?? ""}
          onChange={(e) => set("abbreviation", e.target.value.toUpperCase())}
          placeholder="e.g. APC"
          maxLength={12}
        />
        <p className="studio-hint">Up to 12 characters, uppercase.</p>
      </div>

      <hr className="studio-section-divider" />
      <div className="studio-section-heading">Logo</div>

      <div className="studio-field">
        <LogoUploadWidget
          id="party-logo"
          logoUrl={form.logo ?? ""}
          onUpload={handleLogoUpload}
          onClear={() => set("logo", "")}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Profile Form
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileFormProps {
  form: ProfileForm;
  onChange: (form: ProfileForm) => void;
  parties: Party[];
  onToast: (type: "success" | "error", msg: string) => void;
}

function ProfileFormPanel({ form, onChange, parties, onToast }: ProfileFormProps) {
  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    onChange({ ...form, [key]: value });
  }

  async function handlePictureUpload(file: File) {
    try {
      const url = await uploadFile(file);
      set("profile_picture_url", url);
      onToast("success", "Picture uploaded.");
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="studio-form">
      <div className="studio-panel-label">🧑‍💼 Profile Details</div>
      
      <div className="studio-field">
        <label className="studio-label studio-label-required">Full Name</label>
        <input
          id="field-prof-name"
          className="studio-input"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="e.g. Peter Obi"
        />
      </div>

      <div className="studio-field-group">
        <div className="studio-field">
          <label className="studio-label">Age</label>
          <input
            id="field-prof-age"
            className="studio-input"
            type="number"
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="e.g. 62"
          />
        </div>
        <div className="studio-field">
          <label className="studio-label">State of Origin</label>
          <select
            id="field-prof-origin"
            className="studio-input"
            value={form.state_of_origin || ""}
            onChange={(e) => set("state_of_origin", e.target.value)}
          >
            <option value="">-- Select state --</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="studio-field">
        <label className="studio-label">Current Party</label>
        <select
          id="field-prof-party"
          className="studio-input"
          value={form.current_party_id || ""}
          onChange={(e) => set("current_party_id", e.target.value)}
        >
          <option value="">-- Select Party --</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.abbreviation})
            </option>
          ))}
        </select>
      </div>

      <div className="studio-field">
        <label className="studio-label">Bio (Optional)</label>
        <textarea
          id="field-prof-bio"
          className="studio-input"
          rows={4}
          value={form.bio || ""}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="Short biographical summary..."
        />
      </div>

      <div className="studio-field">
        <label className="studio-label">Profile Picture</label>
        <LogoUploadWidget
          id="prof-picture"
          logoUrl={form.profile_picture_url || ""}
          onUpload={handlePictureUpload}
          onClear={() => set("profile_picture_url", "")}
        />
      </div>

    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Logo / Image Upload Widget
// ═══════════════════════════════════════════════════════════════════════════════

interface LogoUploadWidgetProps {
  id: string;
  logoUrl: string;
  onUpload: (file: File) => void;
  onClear: () => void;
}

function LogoUploadWidget({
  id,
  logoUrl,
  onUpload,
  onClear,
}: LogoUploadWidgetProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <div className="studio-logo-upload">
      <div className="studio-logo-preview">
        {logoUrl ? (
          <img src={logoUrl} alt="Preview" />
        ) : (
          <span className="studio-logo-placeholder">🖼</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor={`upload-${id}`}
          className="studio-upload-btn"
          style={{ cursor: "pointer" }}
        >
          {logoUrl ? "Change image" : "Upload image"}
        </label>
        <input
          id={`upload-${id}`}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleChange}
        />
        {logoUrl && (
          <>
            <button
              type="button"
              className="studio-upload-btn"
              style={{
                color: "var(--studio-danger)",
                borderColor: "var(--studio-danger)",
              }}
              onClick={onClear}
            >
              Remove
            </button>
            <a
              href={logoUrl}
              target="_blank"
              rel="noreferrer"
              className="studio-hint"
              style={{ color: "var(--studio-accent)" }}
            >
              View image ↗
            </a>
          </>
        )}
      </div>
    </div>
  );
}
