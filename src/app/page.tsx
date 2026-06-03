"use client";

import dynamic from "next/dynamic";

const HomeRoute = dynamic(() => import("./_routes/HomeRoute"), { ssr: false });

export default function Page() {
  return <HomeRoute />;
}
