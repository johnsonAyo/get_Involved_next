"use client";

import dynamic from "next/dynamic";

const AboutRoute = dynamic(() => import("../_routes/AboutRoute"), { ssr: false });

export default function Page() {
  return <AboutRoute />;
}
