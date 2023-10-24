export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  date_of_birth: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
