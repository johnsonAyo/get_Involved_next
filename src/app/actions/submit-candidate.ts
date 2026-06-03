"use server";

import { createClient } from "@supabase/supabase-js";
import type { CandidateSubmission } from "@/types/domain";

export async function submitCandidateApplication(data: CandidateSubmission) {
  // 1. Insert into Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from("candidate_applications").insert({
      website: data.website,
      candidate_name: data.candidate,
      position: data.position,
      party: data.party,
      state: data.state,
      local_government: data.localGovernment,
      source: data.source,
      source_url: data.sourceUrl,
    });

    if (error) {
      console.error("Failed to insert candidate application into Supabase:", error);
      throw new Error("Failed to save application to the database.");
    }
  } else {
    console.warn("Supabase credentials missing. Skipping DB insert for candidate submission.");
  }

  // 2. Fire existing Webhook
  const webhookUrl = process.env.NEXT_PUBLIC_FORMS_API_URL;
  if (!webhookUrl) {
    console.warn("NEXT_PUBLIC_FORMS_API_URL not set - skipping webhook for candidate submission.");
    return { success: true };
  }

  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    let errorMessage = `Submission failed: ${resp.status} ${resp.statusText}`;
    try {
      const text = await resp.clone().text();
      const errorData = JSON.parse(text);
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.errors?.[0]?.message) {
        errorMessage = errorData.errors[0].message;
      } else if (text) {
        errorMessage = text;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return { success: true };
}
