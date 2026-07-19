export interface User {
  id: string;
  email: string;
  mfaEnabled: boolean;
}

export interface RegisterRequest {
  email: string;
  authKey: string;
  salt: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export interface SaltResponse {
  salt: string;
}

export interface LoginRequest {
  email: string;
  authKey: string;
}

export interface LoginResponse {
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface MeResponse {
  id: string;
  email: string;
  mfaEnabled: boolean;
}

export interface VaultItem {
  id: string;
  encryptedData: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaultItemRequest {
  encryptedData: string;
}

export interface UpdateVaultItemRequest {
  encryptedData: string;
}

export interface VaultItemListResponse {
  items: VaultItem[];
}
