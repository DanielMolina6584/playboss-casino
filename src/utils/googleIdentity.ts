interface CredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: { client_id: string; callback: (r: CredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let scriptPromise: Promise<GoogleAccountsId> | null = null;

/** Carga Google Identity Services una sola vez. Requiere VITE_GOOGLE_CLIENT_ID. */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const id = window.google?.accounts.id;
      if (id) resolve(id);
      else reject(new Error('gis-missing'));
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('gis-script'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

