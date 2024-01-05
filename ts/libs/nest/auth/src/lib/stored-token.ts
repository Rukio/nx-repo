import { TokenResponse } from 'auth0';

export class StoredToken {
  static readonly TOKEN_EXPIRATION_OFFSET_MS = 60 * 1000;

  private readonly expiresAt: number;

  private get utcNow() {
    return new Date().getTime();
  }

  private constructor(
    readonly accessToken: string,
    readonly tokenType: string,
    expiresInMs: number,
    readonly refreshToken?: string
  ) {
    this.expiresAt = new Date(
      this.utcNow + expiresInMs - StoredToken.TOKEN_EXPIRATION_OFFSET_MS
    ).getTime();
  }

  get expired(): boolean {
    return this.utcNow >= this.expiresAt;
  }

  get authorizationValue(): string {
    return `${this.tokenType} ${this.accessToken}`;
  }

  static fromTokenResponse({
    access_token,
    token_type,
    refresh_token,
    expires_in,
  }: TokenResponse): StoredToken {
    return new StoredToken(
      access_token,
      token_type,
      expires_in * 1000,
      refresh_token
    );
  }
}
