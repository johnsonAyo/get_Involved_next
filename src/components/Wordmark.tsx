export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`ds-wordmark ${className}`.trim()}>
      <img
        src="/assets/logo/nigeria-1758969_1280_4.png"
        alt="Nigeria Logo"
        className="ds-wordmark__logo"
      />
      <span className="ds-wordmark__text">
        <span className="ds-wordmark__number">
          <span>Get</span>
          <span>Involved</span>
        </span>
        <span className="ds-wordmark__name">
          <span>Know Your</span>
          <span>Candidates</span>
        </span>
      </span>
    </span>
  );
}
