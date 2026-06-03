import { defineArrayMember, defineField, defineType } from "sanity";
import { nigeriaGeo } from "../../data/nigeria.js";
import { LgaByStateInput } from "../components/LgaByStateInput.jsx";

const stateOptions = [...nigeriaGeo]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((state) => ({
    title: state.name,
    value: state.id,
  }));

function toCandidateSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 96);
}

export const candidate = defineType({
  name: "candidate",
  title: "Candidate",
  type: "document",
  fields: [
    defineField({
      name: "candidateName",
      title: "Candidate name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Profile URL Slug",
      type: "slug",
      description:
        "Generated internally for candidate profile URLs. Editors do not need to set this.",
      hidden: true,
      options: {
        source: "candidateName",
        slugify: (input) => toCandidateSlug(input),
      },
    }),
    defineField({
      name: "viceCandidateName",
      title: "Running mate",
      type: "string",
    }),
    defineField({
      name: "profileUrl",
      title: "Profile URL",
      type: "url",
      description:
        "Optional external profile link for this candidate. When set, the candidate name links here.",
    }),
    defineField({
      name: "party",
      title: "Party",
      type: "reference",
      to: [{ type: "party" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "position",
      title: "Position",
      type: "reference",
      to: [{ type: "position" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "stateId",
      title: "State",
      type: "string",
      description: "Leave empty for national offices.",
      options: {
        list: stateOptions,
      },
    }),
    defineField({
      name: "lga",
      title: "LGA / constituency",
      type: "string",
      description:
        "Optional. Use for offices tied to a local area (state seat, federal constituency, or LGA office).",
      components: {
        input: LgaByStateInput,
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!value) return true;
          const document = context.document as { stateId?: string };
          const stateId = document?.stateId?.toLowerCase();
          if (!stateId) return "Select a state before setting an LGA.";

          const state = nigeriaGeo.find(
            (item) => item.id.toLowerCase() === stateId,
          );
          if (!state) return "Selected state is invalid.";
          return state.lgas.includes(String(value))
            ? true
            : "Choose an LGA that belongs to the selected state.";
        }),
    }),
    defineField({
      name: "sources",
      title: "Sources",
      type: "array",
      of: [defineArrayMember({ type: "url" })],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "display",
      title: "Show on website",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      media: "party.logo",
      party: "party.abbreviation",
      position: "position.name",
      title: "candidateName",
    },
    prepare({ media, party, position, title }) {
      return {
        title,
        subtitle: [party, position].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
