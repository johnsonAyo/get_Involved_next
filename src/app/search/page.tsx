"use client";

import dynamic from "next/dynamic";

const SearchRoute = dynamic(() => import("../_routes/SearchRoute"), { ssr: false });

export default function Page() {
  return <SearchRoute />;
}
