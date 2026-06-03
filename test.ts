import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const { data } = await supabase.from("candidates").select("id, position_sort_order, position").order("position_sort_order", { ascending: true, nullsFirst: false }).limit(10);
  console.log(data);
}
run();
