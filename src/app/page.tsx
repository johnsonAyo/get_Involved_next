import { HomePage } from "./HomeClient";
import { getCandidates, getFacts } from "@/lib/content-store.server";

type SearchParams = Record<string, string | string[] | undefined>;

function readSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (searchParams ? await searchParams : {}) as SearchParams;
  const [candidates, facts] = await Promise.all([getCandidates(), getFacts()]);

  return (
    <HomePage
      candidates={candidates}
      facts={facts}
      initialLga={readSearchParam(params.lga) || ""}
      initialStateId={readSearchParam(params.state) || ""}
    />
  );
}
