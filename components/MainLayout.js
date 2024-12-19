'use client';

import Link from 'next/link';
import { NotificationsButton } from './NotificationsButton';
import { LogoutButton } from './LogoutButton';

export function MainLayout({ children }) {
  const menuItems = [
    { href: '/', label: 'Inicio' },
    { href: '/users', label: 'Usuarios' },
    { href: '/profile', label: 'Mi Perfil' },
  ];

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">
              FileVault
            </Link>
            <nav className="flex gap-4">
              {menuItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </>
  );
} 