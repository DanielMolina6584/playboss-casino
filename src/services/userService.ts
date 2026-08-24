import type { User } from '@/types';

const MOCK_DELAY = 500;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Preparado para: PATCH /users/me, PUT /users/me/password
export const userService = {
  async updateProfile(user: User, changes: Partial<Pick<User, 'fullName' | 'email'>>): Promise<User> {
    await wait(MOCK_DELAY);
    return { ...user, ...changes };
  },
};
