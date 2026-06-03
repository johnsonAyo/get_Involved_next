import { defineField, defineType } from "sanity";

export const position = defineType({
  name: "position",
  title: "Position",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Position name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Stable ID",
      type: "slug",
      description: "Used as a stable key for integrations and sorting.",
      options: { source: "name" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first in candidate listings.",
      validation: (rule) => rule.integer().min(1),
    }),
  ],
  preview: {
    select: {
      title: "name",
      sortOrder: "sortOrder",
    },
    prepare({ title, sortOrder }) {
      return {
        title,
        subtitle: typeof sortOrder === "number" ? `Order ${sortOrder}` : undefined,
      };
    },
  },
});
