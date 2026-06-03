import { defineField, defineType } from "sanity";

export const party = defineType({
  name: "party",
  title: "Party",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Party name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "abbreviation",
      title: "Abbreviation",
      type: "string",
      validation: (rule) => rule.required().uppercase().max(12),
    }),
    defineField({
      name: "slug",
      title: "Stable ID",
      type: "slug",
      description:
        "Used by filters and URLs. Generate this once and keep it stable.",
      options: { source: "abbreviation" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "logoPath",
      title: "Existing website logo path",
      type: "string",
      description:
        "Optional fallback for existing assets, such as /assets/logo/aac.png.",
    }),
  ],
  preview: {
    select: {
      abbreviation: "abbreviation",
      media: "logo",
      title: "name",
    },
    prepare({ abbreviation, media, title }) {
      return {
        title,
        subtitle: abbreviation,
        media,
      };
    },
  },
});
