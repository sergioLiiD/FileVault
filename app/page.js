'use client';

import { useState } from 'react';
import { Auth } from '@/components/Auth';
import { Clientes } from '@/components/Clientes';
import TemplateList from '@/components/TemplateList';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('clientes'); // 'clientes' o 'templates'

  return (
    <Container>
      {!isLoggedIn ? (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-full max-w-md">
            <Auth setIsLoggedIn={setIsLoggedIn} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-4 border-b pb-4">
            <Button
              variant={activeTab === 'clientes' ? 'default' : 'outline'}
              onClick={() => setActiveTab('clientes')}
            >
              Clientes
            </Button>
            <Button
              variant={activeTab === 'templates' ? 'default' : 'outline'}
              onClick={() => setActiveTab('templates')}
            >
              Templates
            </Button>
          </div>

          {activeTab === 'clientes' ? (
            <Clientes />
          ) : (
            <TemplateList />
          )}
        </div>
      )}
    </Container>
  );
} 