import type { Metadata } from "next";
import { AboutPage } from "./AboutClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About | Get Involved",
  description:
    "A public candidate directory built for Nigeria's elections. Search by name, state, local government, office, and party.",
};

export default function Page() {
  return <AboutPage />;
}
