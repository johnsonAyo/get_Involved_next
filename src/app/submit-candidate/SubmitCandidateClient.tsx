"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DropdownSelect } from "@/components/DropdownSelect";
import type { DropdownOption } from "@/components/DropdownSelect";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getLgas } from "@/data/nigeria.js";
import { submitCandidate } from "@/data/submissions.js";
import type { CandidateSubmission, DirectoryStateOption, Party } from "@/types/domain";

const initialForm = {
  website: "",
  candidate: "",
  position: "",
  party: "",
  state: "",
  localGovernment: "",
  source: "",
  sourceUrl: "",
};

type SelectFieldProps = {
  disabled?: boolean;
  hint?: string;
  id: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder: string;
  required?: boolean;
  value: string;
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

function SelectField({
  disabled = false,
  hint,
  id,
  label,
  name,
  onChange,
  options,
  placeholder,
  required = false,
  value,
}: SelectFieldProps) {
  return (
    <div className="ds-field">
      <label className="ds-field__label" htmlFor={id}>
        {label} {required ? <RequiredDot /> : null}
      </label>
      <DropdownSelect
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        required={required}
        value={value}
        variant="field"
      />
      {hint ? <p className="ds-field__hint">{hint}</p> : null}
    </div>
  );
}

export function SubmitCandidatePage({
  parties = [],
  positions = [],
  states = [],
}: {
  parties?: Party[];
  positions?: string[];
  states?: DirectoryStateOption[];
}) {
  const [form, setForm] = useState(initialForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const localGovernments = form.state ? getLgas(form.state) : [];
  const submission = useMutation({
    mutationFn: submitCandidate,
    onSuccess: () => {
      setForm(initialForm);
      setValidationError(null);
    },
  });

  function updateFormField(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "state" ? { localGovernment: "" } : {}),
    }));
    submission.reset();
    setValidationError(null);
  }

  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    updateFormField(name, value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.website) return;

    if (!form.candidate.trim()) {
      setValidationError("Candidate name is required.");
      return;
    }

    if (!form.position) {
      setValidationError("Please select a Position.");
      return;
    }

    if (!form.party) {
      setValidationError("Please select a Party.");
      return;
    }

    if (!form.sourceUrl.trim()) {
      setValidationError("Source URL is required.");
      return;
    }

    setValidationError(null);
    const { website, ...payload } = form;
    submission.mutate(payload);
  }



  return (
    <>
      <SiteHeader />

      <main className="submit-page" id="main-content">
        <div className="submit-page__inner">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { label: "Submit Candidate" },
            ]}
          />
          <header className="submit-page__intro">
            <h1>Submit a candidate</h1>
            <p>
              Add a candidate to the public record. Choose the person, the office,
              their state and local government, then attach a public source we can
              verify. We review every submission and acknowledge within 48 hours.
            </p>
          </header>

          <section className="submit-page__guidance" aria-label="Submission guidance">
            <div>
              <h2>What we accept</h2>
              <ul>
                <li>A named candidate and the specific public office they are seeking.</li>
                <li>A state and local government that can be checked against the record.</li>
                <li>Verified public sources</li>
              </ul>
            </div>
          </section>

          {submission.isSuccess ? (
            <div className="submit-success-view" role="status">
              <div className="submit-success-view__icon" aria-hidden="true">
                ✓
              </div>
              <h2 className="submit-success-view__title">Submission Received</h2>
              <p className="submit-success-view__message">
                Thank you for contributing to a better and transparent Nigeria.
              </p>
              <p className="submit-success-view__submessage">
                The candidate record has been queued for review and will be updated on the next system update.
              </p>
              <button
                className="ds-button ds-button--primary submit-success-view__button"
                onClick={() => submission.reset()}
              >
                Submit another candidate
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
                  <label className="ds-field__label" htmlFor="candidate">
                    Candidate name <RequiredDot />
                  </label>
                  <input
                    className="ds-field__control"
                    id="candidate"
                    name="candidate"
                    onChange={updateField}
                    placeholder="Enter candidate's name"
                    required
                    type="text"
                    value={form.candidate}
                  />
                  <p className="ds-field__hint">
                    Enter the name of the candidate whose public record should be added.
                  </p>
                </div>

                <SelectField
                  hint="Select the office the candidate is seeking."
                  id="position"
                  label="Position"
                  name="position"
                  onChange={(position) => updateFormField("position", position)}
                  options={positions.map((position) => ({
                    listLabel: position,
                    value: position,
                  }))}
                  placeholder="Choose one"
                  required={true}
                  value={form.position}
                />

                <div className="ds-field">
                  <label className="ds-field__label" htmlFor="party">
                    Party <RequiredDot />
                  </label>
                  <div className="ds-field__party-row">
                    <DropdownSelect
                      id="party"
                      name="party"
                      onChange={(party) => {
                        updateFormField("party", party);
                      }}
                      options={parties.map((party) => ({
                        listLabel: `${party.name} (${party.abbreviation})`,
                        selectedLabel: party.name,
                        value: party.id,
                      }))}
                      placeholder="Choose one"
                      required={true}
                      value={form.party}
                      variant="field"
                    />
                    {parties.find((party) => party.id === form.party)?.logo ? (
                      <div className="ds-field__party-logo">
                        <img
                          alt="Selected logo indicator"
                          src={parties.find((party) => party.id === form.party)?.logo}
                        />
                      </div>
                    ) : null}
                  </div>
                  <p className="ds-field__hint">
                    Choose the political party the candidate belongs to.
                  </p>
                </div>

                <SelectField
                  hint="Choose the candidate's state."
                  id="state"
                  label="State"
                  name="state"
                  onChange={(state) => updateFormField("state", state)}
                  options={states.map((state) => ({
                    listLabel: state.name,
                    value: state.id,
                  }))}
                  placeholder="Choose one"
                  value={form.state}
                />

                <SelectField
                  disabled={!form.state}
                  hint="The local-government list updates when you choose a state."
                  id="local-government"
                  label="Local government"
                  name="localGovernment"
                  onChange={(localGovernment) => updateFormField("localGovernment", localGovernment)}
                  options={localGovernments.map((localGovernment) => ({
                    listLabel: localGovernment,
                    value: localGovernment,
                  }))}
                  placeholder={form.state ? "Choose one" : "Choose a state first"}
                  value={form.localGovernment}
                />

                <div className="ds-field">
                  <label className="ds-field__label" htmlFor="source">
                    Source
                  </label>
                  <input
                    className="ds-field__control"
                    id="source"
                    name="source"
                    onChange={updateField}
                    placeholder="e.g. Premium Times, INEC, court record..."
                    type="text"
                    value={form.source}
                  />
                  <p className="ds-field__hint">
                    Enter the publisher or public institution behind your evidence.
                  </p>
                </div>

                <div className="ds-field">
                  <label className="ds-field__label" htmlFor="source-url">
                    Source URL <RequiredDot />
                  </label>
                  <input
                    className="ds-field__control"
                    id="source-url"
                    name="sourceUrl"
                    onChange={updateField}
                    placeholder="https://"
                    required
                    type="url"
                    value={form.sourceUrl}
                  />
                  <p className="ds-field__hint">
                    A public URL we can verify against. Full https://… link.
                  </p>
                </div>

                <button
                  className="ds-button ds-button--primary ds-button--submit"
                  disabled={submission.isPending}
                  type="submit"
                >
                  {submission.isPending ? "Submitting…" : "Submit candidate"}
                </button>
              </form>
            </>
          )}

          <p className="ds-meta submit-page__afterword">
            Spotted an error in an existing entry instead? Use the{" "}
            <Link
              href="/report"
            >
              corrections form
            </Link>
            .
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
