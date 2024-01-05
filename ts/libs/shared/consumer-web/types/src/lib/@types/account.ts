export interface Account {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  updatedAt?: string;
  consistencyToken?: Uint8Array | string;
}
