import { Link } from 'react-router-dom';

/** Si el 422 del API es por límite superado o autoexclusión, ofrece ir a "Mis límites". */
export function isLimitMessage(message: string): boolean {
  return /autoexclu|superas tu l[ií]mite/i.test(message);
}

export function LimitLink({ message, onNavigate }: { message: string; onNavigate?: () => void }) {
  if (!isLimitMessage(message)) return null;
  return (
    <Link to="/perfil#limites" onClick={onNavigate} className="mt-1 block font-semibold text-gold underline">
      Ver mis límites de juego responsable
    </Link>
  );
}
