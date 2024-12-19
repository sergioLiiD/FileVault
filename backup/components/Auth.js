import { useState } from 'react';
import { supabase } from '../lib/supabase';

function Auth({ setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSignUp = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Guardar información adicional del usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user.id,
            nombre_completo: nombre,
            empresa,
            telefono,
          },
        ]);

      if (profileError) throw profileError;

      alert('Usuario registrado con éxito');
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error:', error.message);
      alert(error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      alert('Inicio de sesión exitoso');
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error:', error.message);
      alert(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isRegistering ? 'Registro' : 'Inicio de Sesión'}
      </h2>
      <div className="space-y-4">
        {isRegistering && (
          <>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y Apellido"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full p-2 border rounded"
            />
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono"
              className="w-full p-2 border rounded"
            />
          </>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo Electrónico"
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full p-2 border rounded"
        />
        <button
          onClick={isRegistering ? handleSignUp : handleSignIn}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {isRegistering ? 'Registrar' : 'Iniciar Sesión'}
        </button>
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-blue-500 hover:text-blue-600"
        >
          {isRegistering
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}

export default Auth; 