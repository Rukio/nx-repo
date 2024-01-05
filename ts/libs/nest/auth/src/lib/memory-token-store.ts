import { Injectable } from '@nestjs/common';
import { StoredToken } from './stored-token';

@Injectable()
export class MemoryTokenStore {
  private static TOKENS: Record<string, StoredToken | undefined> = {};

  public getToken(key: string): StoredToken | undefined {
    return MemoryTokenStore.TOKENS[key];
  }

  public saveToken(key: string, token: StoredToken): void {
    MemoryTokenStore.TOKENS[key] = token;
  }
}
