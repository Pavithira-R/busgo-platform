// Shapes returned by the BusGo API (see the backend's Swagger docs at /docs).

export type Role = 'passenger' | 'staff' | 'admin';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  idNumber: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export type ServiceType = 'normal' | 'semi_luxury' | 'luxury' | 'super_luxury';
