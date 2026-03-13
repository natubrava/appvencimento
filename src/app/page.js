'use client';

import { useEffect } from 'react';
import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration.scope);
        })
        .catch((error) => {
          console.error('Falha ao registrar o Service Worker:', error);
        });
    }

    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Permissão de notificação concedida!');
          }
        });
      }
    }
  }, []);

  return <Dashboard />;
}
