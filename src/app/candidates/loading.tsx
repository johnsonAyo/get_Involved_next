import { SiteHeader } from "@/components/SiteHeader";
import { SkeletonCandidateGrid } from "@/components/SkeletonCard";

export default function CandidatesLoading() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        style={{
          padding: "3rem 1rem",
          minHeight: "60vh",
          maxWidth: "var(--ds-frame)",
          margin: "0 auto",
        }}
      >
        <SkeletonCandidateGrid />
      </main>
    </>
  );
}
