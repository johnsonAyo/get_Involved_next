"use client";

import { useState, FormEvent } from "react";
import { createClient } from "../../../utils/supabase/client";
import "../studio.css";

export default function StudioLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/studio";
  }

  return (
    <div className="studio-login-page">
      <div className="studio-login-card">
        <div className="studio-login-logo">
          <div className="studio-login-logo-icon">GI</div>
          <div className="studio-login-title">Get Involved CMS</div>
          <div className="studio-login-sub">Sign in to access the editorial studio</div>
        </div>

        <form className="studio-login-form" onSubmit={handleSubmit}>
          {error && <div className="studio-login-error">{error}</div>}

          <div className="studio-field">
            <label className="studio-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              className="studio-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="studio-field">
            <label className="studio-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="studio-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? <span className="studio-spinner" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
