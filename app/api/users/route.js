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
    const { email, permissions } = await request.json();

    // Obtener la organización del admin que está invitando
    const adminId = request.headers.get('x-user-id');
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', adminId)
      .single();

    if (!adminRole?.organization_id) {
      throw new Error('Admin sin organización');
    }

    // Crear usuario mediante invitación
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          role: 'colaborador',
          organization_id: adminRole.organization_id
        }
      }
    );

    if (inviteError) throw inviteError;

    // Crear rol y permisos con la organización
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: data.user.id,
        role: 'colaborador',
        organization_id: adminRole.organization_id,
        ...permissions
      }]);

    if (roleError) throw roleError;

    // En la función POST
    // Después de crear el usuario con inviteUserByEmail
    const { data: userData, error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: data.user.id,
        email: email
      }])
      .select();

    if (userInsertError) throw userInsertError;

    return Response.json({ success: true, user: data.user });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await request.json();
    console.log('1. Iniciando borrado de usuario:', userId);

    // 1. Borrar todas las relaciones en orden
    const cleanupPromises = [
      // Borrar mensajes
      supabaseAdmin
        .from('client_messages')
        .delete()
        .eq('user_id', userId),

      // Borrar roles
      supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId),

      // Borrar clientes
      supabaseAdmin
        .from('clientes')
        .delete()
        .eq('user_id', userId),

      // Borrar sesiones
      supabaseAdmin
        .from('auth.sessions')
        .delete()
        .eq('user_id', userId),

      // Borrar identities
      supabaseAdmin
        .from('auth.identities')
        .delete()
        .eq('user_id', userId),

      // Borrar referencias en users
      supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)
    ];

    const results = await Promise.allSettled(cleanupPromises);
    console.log('2. Resultados de limpieza:', results);

    // 2. Finalmente borrar el usuario de auth
    const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userError) {
      console.error('Error borrando usuario:', userError);
      throw userError;
    }

    console.log('3. Usuario borrado exitosamente');
    return Response.json({ success: true });

  } catch (error) {
    console.error('Error completo:', error);
    return Response.json({ 
      error: error.message,
      details: {
        message: error.message,
        name: error.name,
        stack: error.stack
      }
    }, { status: 500 });
  }
} 