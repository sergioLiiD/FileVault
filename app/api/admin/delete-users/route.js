import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request) {
  try {
    const emails = ['sergiovelazco@icloud.com', 'sergiovelazco@gmail.com'];

    for (const email of emails) {
      // Verificar en auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin
        .listUsers();

      console.log('Auth Users:', authUser?.users?.filter(u => u.email === email));

      // Verificar en user_roles
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', authUser?.users?.find(u => u.email === email)?.id);

      console.log('User Roles:', roleData);

      if (authUser?.users?.find(u => u.email === email)?.id) {
        // Primero obtener el ID del usuario
        const { data: userData } = await supabaseAdmin
          .from('auth.users')
          .select('id')
          .eq('email', email)
          .single();

        if (userData?.id) {
          // Borrar en orden
          await supabaseAdmin
            .from('client_messages')
            .delete()
            .eq('user_id', userData.id);

          await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', userData.id);

          await supabaseAdmin
            .from('clientes')
            .delete()
            .eq('user_id', userData.id);

          // Finalmente borrar el usuario
          const { error } = await supabaseAdmin.auth.admin.deleteUser(userData.id);
          
          if (error) throw error;
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 