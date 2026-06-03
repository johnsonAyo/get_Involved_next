import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "../../../utils/supabase/server";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow the login page through regardless
  if (!session) {
    redirect("/studio/login");
  }

  return <>{children}</>;
}
