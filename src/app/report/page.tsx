import type { Metadata } from "next";
import { ReportPage } from "./ReportClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Report an Issue | Get Involved",
  description:
    "Report a problem, error, or concern about a candidate record. Corrections are reviewed within 48 hours.",
};

export default function Page() {
  return <ReportPage />;
}
