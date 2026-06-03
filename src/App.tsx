import { lazy, Suspense, useEffect, useState } from "react";
import { HomePage } from "./vite-pages/HomePage";
import { SubmitCandidatePage } from "./vite-pages/SubmitCandidatePage";
import { StatesPage } from "./vite-pages/StatesPage";
import { ReportPage } from "./vite-pages/ReportPage";
import { AboutPage } from "./vite-pages/About";
import { CandidatePage } from "./vite-pages/CandidatePage";

const StudioPage = lazy(() => import("./vite-pages/StudioPage"));

type Navigate = (path: string) => void;

function useClientRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigate: Navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path.split("?")[0] ?? "/");
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return { currentPath, navigate };
}

export default function App() {
  const { currentPath, navigate } = useClientRouter();

  if (currentPath.startsWith("/studio")) {
    return (
      <Suspense fallback={<p className="studio-loading">Loading studio...</p>}>
        <StudioPage />
      </Suspense>
    );
  }

  if (currentPath === "/submit-candidate") {
    return <SubmitCandidatePage onNavigate={navigate} />;
  }

  if (currentPath === "/states") {
    return <StatesPage onNavigate={navigate} />;
  }

  if (currentPath === "/report") {
    return <ReportPage onNavigate={navigate} />;
  }

  if (currentPath === "/about") {
    return <AboutPage onNavigate={navigate} />;
  }

  if (currentPath === "/search" || currentPath === "/candidates") {
    return <CandidatePage candidateId={undefined} onNavigate={navigate} />;
  }

  if (currentPath.startsWith("/candidates/")) {
    const candidateId = currentPath.slice("/candidates/".length);
    return <CandidatePage candidateId={candidateId} onNavigate={navigate} />;
  }

  return <HomePage onNavigate={navigate} />;
}
