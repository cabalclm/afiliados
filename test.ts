import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
s.from("info_perfil").select("email").limit(1).then(r => console.log("Has email:", !r.error));
