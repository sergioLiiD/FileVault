import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  const handleAddCliente = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('clientes')
        .insert([
          {
            nombre_completo: nombre,
            telefono,
            correo,
            user_id: userData.user.id,
          },
        ]);

      if (error) throw error;

      alert('Cliente agregado con éxito');
      setNombre('');
      setTelefono('');
      setCorreo('');
      fetchClientes();
    } catch (error) {
      console.error('Error:', error.message);
      alert(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Gestión de Clientes</h2>
      <div className="space-y-4 mb-8">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre Completo"
          className="w-full p-2 border rounded"
        />
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono"
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Correo Electrónico"
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleAddCliente}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Agregar Cliente
        </button>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Lista de Clientes</h3>
        <div className="space-y-4">
          {clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="p-4 border rounded hover:bg-gray-50"
            >
              <p className="font-semibold">{cliente.nombre_completo}</p>
              <p className="text-gray-600">{cliente.telefono}</p>
              <p className="text-gray-600">{cliente.correo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Clientes; 