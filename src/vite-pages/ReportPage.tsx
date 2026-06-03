import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { submitReport } from "../data/submissions.js";
import type { ReportSubmission } from "../types/domain";

const initialForm = {
  website: "",
  title: "",
  description: "",
};

function RequiredDot() {
  return (
    <span
      className="ds-field__required-dot"
      aria-hidden="true"
      style={{
        color: "var(--ds-color-accent)",
        marginLeft: "0.25rem",
        fontSize: "0.75rem",
        verticalAlign: "middle",
      }}
    >
      ●
    </span>
  );
}

export function ReportPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [form, setForm] = useState(initialForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const submission = useMutation({
    mutationFn: submitReport,
    onSuccess: () => {
      setForm(initialForm);
      setValidationError(null);
    },
  });

  function updateField(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    submission.reset();
    setValidationError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.website) return;

    if (!form.title.trim()) {
      setValidationError("Title is required.");
      return;
    }

    if (!form.description.trim()) {
      setValidationError("Description is required.");
      return;
    }

    setValidationError(null);
    const { website, ...payload } = form;
    submission.mutate(payload);
  }

  return (
    <>
      <SiteHeader onNavigate={onNavigate} />

      <main className="submit-page" id="main-content">
        <div className="submit-page__inner">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Home", onClick: () => onNavigate("/") },
              { label: "Report Issue" },
            ]}
          />
          <header className="submit-page__intro">
            <h1>Report an issue</h1>
            <p>
              Tell us about a problem, error, or concern. Provide a concise
              title, a short description, and a public source we can verify.
            </p>
          </header>

          {submission.isSuccess ? (
            <div className="submit-success-view" role="status">
              <div className="submit-success-view__icon" aria-hidden="true">
                ✓
              </div>
              <h2 className="submit-success-view__title">Report Received</h2>
              <p className="submit-success-view__message">
                Thank you for contributing to a better and transparent Nigeria.
              </p>
              <p className="submit-success-view__submessage">
                Your report has been queued for review and will be updated on the next system update.
              </p>
              <button
                className="ds-button ds-button--primary submit-success-view__button"
                onClick={() => submission.reset()}
              >
                Submit another report
              </button>
            </div>
          ) : (
            <>
              {validationError ? (
                <div className="ds-notice ds-notice--error" role="status">
                  <p className="ds-eyebrow ds-eyebrow--error">Validation failed</p>
                  <p>{validationError}</p>
                </div>
              ) : submission.isError ? (
                <div className="ds-notice ds-notice--error" role="status">
                  <p className="ds-eyebrow ds-eyebrow--error">Submission failed</p>
                  <p>{submission.error instanceof Error ? submission.error.message : "An unknown error occurred"}</p>
                </div>
              ) : null}

              <form className="ds-form submit-page__form" onSubmit={handleSubmit}>
                <div className="ds-honeypot" aria-hidden="true">
                  <label htmlFor="website">Website (leave empty)</label>
                  <input
                    autoComplete="off"
                    id="website"
                    name="website"
                    onChange={updateField}
                    tabIndex={-1}
                    value={form.website}
                  />
                </div>

                 <div className="ds-field">
                  <label className="ds-field__label" htmlFor="title">
                    Title <RequiredDot />
                  </label>
                  <input
                    className="ds-field__control"
                    id="title"
                    name="title"
                    onChange={updateField}
                    placeholder="Short summary"
                    required
                    type="text"
                    value={form.title}
                  />
                </div>

                <div className="ds-field">
                  <label className="ds-field__label" htmlFor="description">
                    Description <RequiredDot />
                  </label>
                  <textarea
                    className="ds-field__control"
                    id="description"
                    name="description"
                    onChange={updateField}
                    placeholder="Describe the issue"
                    required
                    value={form.description}
                  />
                </div>

                {/* Removed category/source fields as requested */}

                <button
                  className="ds-button ds-button--primary ds-button--submit"
                  disabled={submission.isPending}
                  type="submit"
                >
                  {submission.isPending ? "Submitting…" : "Submit report"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <SiteFooter onNavigate={onNavigate} />
    </>
  );
}
