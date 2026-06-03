import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { sanityDataset, sanityProjectId } from "./env";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  basePath: "/studio",
  dataset: sanityDataset,
  name: "will-of-the-people",
  projectId: sanityProjectId ?? "",
  schema: {
    types: schemaTypes,
  },
  title: "Will of the People CMS",
  plugins: [structureTool()],
});
