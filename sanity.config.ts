'use client'

import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './src/sanity/schemaTypes'
import {wrapPublishWithSupabaseSync} from './src/sanity/actions/publishAndSyncAction'

const syncableSchemaTypes = new Set(['candidate', 'party', 'position'])

export default defineConfig({
  name: 'get-involved',
  title: 'Get Involved CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: '/studio',
  plugins: [structureTool()],
  document: {
    actions: (previousActions, context) =>
      syncableSchemaTypes.has(context.schemaType)
        ? previousActions.map((previousAction) =>
            previousAction.action === 'publish'
              ? wrapPublishWithSupabaseSync(previousAction)
              : previousAction,
          )
        : previousActions,
  },
  schema: {
    types: schemaTypes,
  },
})
