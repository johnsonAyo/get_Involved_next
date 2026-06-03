export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`ds-wordmark ${className}`.trim()}>
      <span className="ds-wordmark__number">Get Involved</span>
      <span className="ds-wordmark__name">Know Your Candidates</span>
    </span>
  );
}
