import { StatesPage } from "./StatesClient";
import { getCandidates } from "@/lib/content-store.server";

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
  const candidates = await getCandidates();

  return (
    <StatesPage
      candidates={candidates}
      initialLga={readSearchParam(params.lga) || ""}
      initialParty={readSearchParam(params.party) || ""}
      initialPosition={readSearchParam(params.position) || ""}
      initialStateId={readSearchParam(params.state) || "abia"}
    />
  );
}
