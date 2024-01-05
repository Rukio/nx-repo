import { TokenResponse } from 'auth0';
import { Injectable } from '@nestjs/common';
import { Auth0Client } from './auth0.client';
import { InjectAuthOptions } from './auth.decorators';
import { MemoryTokenStore } from './memory-token-store';
import { StoredToken } from './stored-token';
import { AuthenticationModuleOptions } from './auth.module-options.interface';
import { DecodedToken, validate } from 'auth0/src/auth/idToken';
import { PolicyActor } from './policy-actor.types';

@Injectable()
export class AuthService {
  private readonly tokenKey: string;

  private readonly audience: string;

  private readonly issuer: string;

  constructor(
    private client: Auth0Client,
    private store: MemoryTokenStore,
    @InjectAuthOptions()
    { tokenKey, audience, issuer }: AuthenticationModuleOptions
  ) {
    this.tokenKey = tokenKey;
    this.audience = audience;
    this.issuer = issuer;
  }

  async getToken(): Promise<StoredToken> {
    let token = this.store.getToken(this.tokenKey);

    if (!token || (token.expired && !token.refreshToken)) {
      const tokenResponse = await this.fetchToken();
      token = StoredToken.fromTokenResponse(tokenResponse);
      this.store.saveToken(this.tokenKey, token);
    } else if (token.expired && token.refreshToken) {
      const tokenResponse = await this.refreshToken(token.refreshToken);
      token = StoredToken.fromTokenResponse(tokenResponse);
      this.store.saveToken(this.tokenKey, token);
    }

    return token;
  }

  validateToken(token: string): DecodedToken {
    return validate(token, {
      audience: this.audience,
      issuer: this.issuer,
    });
  }

  async getPolicyActor(): Promise<PolicyActor> {
    const token = await this.getToken();
    const validatedToken = this.validateToken(token.accessToken);
    const payload = validatedToken.payload;

    return {
      type: payload['https://*company-data-covered*.com/type'],
      properties: payload['https://*company-data-covered*.com/props'],
    };
  }

  private fetchToken(): Promise<TokenResponse> {
    return this.client.clientCredentialsGrant({
      audience: this.audience,
    });
  }

  private refreshToken(refreshToken: string): Promise<TokenResponse> {
    return this.client.refreshToken({
      refresh_token: refreshToken,
    });
  }
}
