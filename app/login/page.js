'use client';

import { Auth } from '@/components/Auth';
import { Container } from '@/components/ui/container';

export default function LoginPage() {
  return (
    <Container>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <Auth />
        </div>
      </div>
    </Container>
  );
} 