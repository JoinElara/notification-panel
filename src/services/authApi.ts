import { api } from '@/lib/api';

export interface AuthUserDto {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function loginRequest(email: string, password: string) {
  return api.post<{ access_token: string; user: AuthUserDto }>('/auth/login', {
    email,
    password,
  });
}

export async function meRequest() {
  return api.get<{ user: AuthUserDto }>('/auth/me');
}
