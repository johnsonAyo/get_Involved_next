"use client";

type Props = {
  /** Route label shown in the error UI (e.g. "Candidate Directory") */
  label: string;
  /** Optional error object — only message is rendered client-side for safety */
  error?: Error;
  /** Reset function from Next.js error boundary — resets the error state */
  reset?: () => void;
};

export function ErrorFallback({ label, error, reset }: Props) {
  return (
    <main
      id="main-content"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        maxWidth: "var(--ds-frame)",
        margin: "0 auto",
        padding: "3rem 1rem",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          fontSize: "4rem",
          lineHeight: 1,
          marginBottom: "1.5rem",
          color: "var(--ds-color-ink-muted)",
        }}
      >
        ⚠
      </div>

      <h1
        style={{
          fontFamily: "var(--ds-font-display)",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          margin: "0 0 0.5rem",
        }}
      >
        {label} · Something went wrong
      </h1>

      <p
        style={{
          color: "var(--ds-color-ink-muted)",
          maxWidth: "28rem",
          lineHeight: 1.6,
          margin: "0 0 2rem",
        }}
      >
        We hit an unexpected error while loading this page. It may be temporary — please try again.
      </p>

      {error?.message ? (
        <pre
          style={{
            maxWidth: "36rem",
            padding: "0.75rem 1rem",
            margin: "0 0 1.5rem",
            background: "var(--ds-color-paper)",
            border: "1px solid var(--ds-color-ink-a10)",
            borderRadius: "4px",
            fontSize: "0.8rem",
            fontFamily: "var(--ds-font-mono)",
            color: "var(--ds-color-ink-muted)",
            textAlign: "left",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {error.message}
        </pre>
      ) : null}

      {reset ? (
        <button
          className="ds-button ds-button--primary"
          onClick={reset}
          style={{ cursor: "pointer" }}
        >
          Try again
        </button>
      ) : null}
    </main>
  );
}
