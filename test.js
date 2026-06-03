import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/';
  // Trigger a dummy rpc or see if we can do something else to check
  // Since we don't have SQL access, we can't query pg_constraint.
  // Let's try to fetch with parties(id) again just in case.
  const { data, error } = await supabase.from('candidates').select('id, parties(id)').limit(1);
  console.log("parties:", error ? error.message : "success");
}
run();
