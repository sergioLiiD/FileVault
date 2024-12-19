export function NewUserEmailTemplate({ tempPassword }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333; text-align: center;">¡Bienvenido a la Plataforma!</h1>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin-bottom: 20px;">Se ha creado una cuenta para ti. Por favor, usa las siguientes credenciales para ingresar:</p>
        
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #0070f3; margin-bottom: 20px;">
          <p style="margin: 0;"><strong>Contraseña temporal:</strong> ${tempPassword}</p>
        </div>

        <p style="color: #666;">Por favor, cambia tu contraseña después de ingresar por primera vez por seguridad.</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
           style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Iniciar Sesión
        </a>
      </div>

      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
        Si no esperabas este email, por favor ignóralo.
      </p>
    </div>
  `;
} 