import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('info_perfil').select('*').limit(1);
  console.log("info_perfil columns:", data ? Object.keys(data[0]) : error);

  const { data: aData, error: aError } = await supabase.from('afiliados').select('lider_id, lugares_clm(nombre), info_perfil(user_id, nombres, apellidos)').limit(1);
  console.log("FK test:", JSON.stringify(aData), aError);
}

test();
