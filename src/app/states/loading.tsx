import { SiteHeader } from "@/components/SiteHeader";
import { SkeletonStateList } from "@/components/SkeletonCard";

export default function StatesLoading() {
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
        <SkeletonStateList />
      </main>
    </>
  );
}
