import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { limitsService } from '@/services/limitsService';
import { wakeApi } from '@/utils/wakeApi';

// Despierta la API (Render gratuito) lo antes posible, antes incluso de cargar los límites.
wakeApi();

// Los límites de negocio vienen de GET /configuracion/limites; se espera un máximo de 2 s
// para no bloquear el primer render si la API está lenta (se usan los valores de respaldo).
Promise.race([limitsService.loadBusinessLimits(), new Promise((r) => setTimeout(r, 2000))]).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
