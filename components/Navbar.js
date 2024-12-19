import { Button } from "@/components/ui/button"
import { supabase } from '../lib/supabase';

function Navbar({ setIsLoggedIn }) {
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">FileVault</h1>
          </div>
          <div>
            <Button variant="ghost" onClick={handleSignOut}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;