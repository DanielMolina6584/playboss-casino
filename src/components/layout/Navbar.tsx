import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/common/Button';
import { UserAvatar } from '@/components/common/UserAvatar';
import { formatCurrency } from '@/utils/formatters';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/apuestas', label: 'Apuestas' },
  { to: '/mis-apuestas', label: 'Mis Apuestas' },
  { to: '/#bono', label: 'Promociones' },
  { to: '/#pagos', label: 'Pagos' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { authenticated, user, logout } = useAuth();
  const { balance, account } = useWallet();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-primary/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setMenuOpen(false)}>
          <img src="/assets/logo.png" alt="PlayBoss" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-gold' : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {authenticated ? (
            <>
              <Link
                to="/billetera"
                aria-label="Mi saldo"
                className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-bold text-gold hover:bg-gold/15"
              >
                {account ? formatCurrency(balance) : '…'}
              </Link>
              <Link to="/billetera/recarga" className="btn-primary px-4 py-2 text-sm">
                Recargar
              </Link>
              <Link
                to="/perfil"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                {user && <UserAvatar user={user} size="sm" />}
                {user?.fullName?.split(' ')[0] ?? 'Mi cuenta'}
              </Link>
              <Button variant="secondary" onClick={handleLogout} className="px-4 py-2 text-sm">
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn-primary">
                Registrarse
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-text-primary lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-navigation" className="animate-fade-in border-t border-border-subtle bg-bg-primary lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-sm font-medium ${
                    isActive ? 'bg-white/5 text-gold' : 'text-text-secondary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border-subtle pt-3">
              {authenticated ? (
                <>
                  <Link
                    to="/billetera"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-bold text-gold"
                  >
                    <span className="font-medium text-text-secondary">Mi saldo</span>
                    {account ? formatCurrency(balance) : '…'}
                  </Link>
                  <Link to="/billetera/recarga" className="btn-primary" onClick={() => setMenuOpen(false)}>
                    Recargar saldo
                  </Link>
                  <Link to="/perfil" className="btn-secondary" onClick={() => setMenuOpen(false)}>
                    Mi perfil
                  </Link>
                  <Button variant="ghost" onClick={handleLogout}>
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary" onClick={() => setMenuOpen(false)}>
                    Iniciar sesión
                  </Link>
                  <Link to="/registro" className="btn-primary" onClick={() => setMenuOpen(false)}>
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
