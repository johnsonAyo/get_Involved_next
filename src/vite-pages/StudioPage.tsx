import { hasSanityConfig } from "../sanity/env";

export default function StudioPage() {
  if (!hasSanityConfig) {
    return (
      <main className="studio-setup">
        <p className="ds-eyebrow ds-eyebrow--accent">Sanity setup needed</p>
        <h1>Connect the content studio</h1>
        <p>
          Add <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{" "}
          <code>NEXT_PUBLIC_SANITY_DATASET</code> to your environment file, then
          reload this page.
        </p>
      </main>
    );
  }

  return (
    <main className="studio-setup">
      <p className="ds-eyebrow ds-eyebrow--accent">Studio route reserved</p>
      <h1>Content studio is not bundled in this Next replica</h1>
      <p>
        The public app has been mirrored into Next.js. If you want, I can do a
        second pass to wire Sanity Studio into this clone as well.
      </p>
    </main>
  );
}
