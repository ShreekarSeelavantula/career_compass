import type { User } from "@shared/schema";

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function getAuthUser(): User | null {
  const userData = localStorage.getItem("auth_user");
  return userData ? JSON.parse(userData) : null;
}

export function setAuthData(user: User, token: string): void {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export function clearAuthData(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
