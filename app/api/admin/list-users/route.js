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

export async function GET() {
  try {
    // 1. Obtener todos los usuarios
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;

    // Log de todos los usuarios
    console.log('1. Lista completa de usuarios:', users);

    // 2. Obtener el admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .single();

    console.log('2. Admin role:', adminRole);

    // 3. Filtrar usuarios
    const filteredUsers = users.filter(user => {
      const isAdmin = user.id === adminRole?.user_id;
      console.log(`3. Verificando usuario ${user.email}: es admin = ${isAdmin}`);
      return !isAdmin;
    });

    console.log('4. Usuarios filtrados final:', filteredUsers);

    return Response.json({ 
      debug: {
        totalUsers: users.length,
        adminId: adminRole?.user_id,
        filteredCount: filteredUsers.length
      },
      users: filteredUsers 
    });
  } catch (error) {
    console.error('Error detallado:', error);
    return Response.json({ 
      error: error.message,
      errorDetails: error
    }, { status: 500 });
  }
} 