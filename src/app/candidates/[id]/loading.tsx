import { SiteHeader } from "@/components/SiteHeader";
import { SkeletonCandidateDetail } from "@/components/SkeletonCard";

export default function CandidateDetailLoading() {
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
        <SkeletonCandidateDetail />
      </main>
    </>
  );
}
