import { useEffect, useState } from 'react';
import { isMockActive, subscribeMockMode } from '@/services/dataSource';
import { DEMO_USER } from '@/mocks/store';

/** Aviso permanente cuando los datos son simulados (sin API real). */
export function MockBanner() {
  const [active, setActive] = useState(isMockActive());

  useEffect(() => subscribeMockMode(() => setActive(isMockActive())), []);
  useEffect(() => {
    // El modo también cambia al iniciar sesión con un token simulado.
    const id = window.setInterval(() => setActive(isMockActive()), 1500);
    return () => window.clearInterval(id);
  }, []);

  if (!active) return null;
  return (
    <div role="note" className="bg-gold/10 px-4 py-1.5 text-center text-xs text-gold">
      <strong className="font-bold">Modo demostración:</strong> datos y pagos simulados, sin dinero real. Demo: {DEMO_USER.email} /{' '}
      {DEMO_USER.password}
    </div>
  );
}
