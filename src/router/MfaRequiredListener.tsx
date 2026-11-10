import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

/**
 * Cuando la API responde 403 `mfa_requerido` (rol que exige 2FA sin activarlo), marca al usuario como
 * "sin 2FA" y lo lleva a Perfil > Seguridad para configurarlo.
 */
export function MfaRequiredListener() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handler = () => {
      if (user && user.mfaActive !== false) updateUser({ ...user, mfaActive: false, mfaRequired: true });
      showToast('Tu rol exige la verificación en dos pasos. Actívala para continuar.', 'info');
      navigate('/perfil#seguridad', { state: { mfaRequired: true } });
    };
    window.addEventListener('playboss:mfa-required', handler);
    return () => window.removeEventListener('playboss:mfa-required', handler);
  }, [user, updateUser, navigate, showToast]);

  return null;
}
