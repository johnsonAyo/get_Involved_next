import { SiteHeader } from "@/components/SiteHeader";
import { SkeletonFormPage } from "@/components/SkeletonCard";

export default function SubmitCandidateLoading() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        style={{
          padding: "3rem 1rem",
          minHeight: "60vh",
          maxWidth: "var(--ds-form-content)",
          margin: "0 auto",
        }}
      >
        <SkeletonFormPage />
      </main>
    </>
  );
}
