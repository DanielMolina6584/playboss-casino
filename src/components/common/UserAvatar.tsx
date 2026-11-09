import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { userService } from '@/services/userService';

/** Fotos ya descargadas, por id de Drive, para no pedirlas en cada render. */
const cache = new Map<string, string>();

const SIZES = { sm: 'h-8 w-8 text-sm', md: 'h-14 w-14 text-xl', lg: 'h-24 w-24 text-3xl' } as const;

/** URL local de la foto de perfil (descargada de la API, que la lee de Google Drive). */
export function useUserPhoto(user: User): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => (user.photoId ? cache.get(user.photoId) : undefined));

  useEffect(() => {
    const photoId = user.photoId;
    if (!photoId) {
      setUrl(undefined);
      return;
    }
    if (cache.has(photoId)) {
      setUrl(cache.get(photoId));
      return;
    }
    let active = true;
    userService
      .getPhoto()
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        cache.set(photoId, objectUrl);
        if (active) setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl(undefined);
      });
    return () => {
      active = false;
    };
  }, [user.photoId]);

  return url;
}

/** Foto de perfil del usuario (guardada en Google Drive); si no tiene, muestra su inicial. */
export function UserAvatar({ user, size = 'md' }: { user: User; size?: keyof typeof SIZES }) {
  const url = useUserPhoto(user);
  const classes = `${SIZES[size]} shrink-0 rounded-full`;
  if (url) return <img src={url} alt={`Foto de ${user.fullName}`} className={`${classes} object-cover ring-2 ring-gold/40`} />;

  return (
    <div className={`${classes} flex items-center justify-center bg-gold/15 font-bold text-gold`} aria-hidden="true">
      {user.fullName.charAt(0).toUpperCase()}
    </div>
  );
}
