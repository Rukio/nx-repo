import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticationModuleOptions } from './auth.module-options.interface';
import {
  MissingConfigurationSettingException,
  getRequiredEnvironmentVariable,
} from './config';

export type Auth0ConfigurationSettings = {
  domainKey: string;
  clientIdKey: string;
  clientSecretKey: string;
  audienceKey: string;
  issuerKey: string;
  tokenKey: string;
};

@Injectable()
export class Auth0ConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      AuthenticationModuleOptions,
      'createAuthOptions'
    >
{
  protected domain: string;
  protected clientId: string | undefined;
  protected clientSecret: string | undefined;

  constructor(
    protected config: ConfigService,
    private settings: Auth0ConfigurationSettings
  ) {
    this.domain = getRequiredEnvironmentVariable(settings.domainKey, config);
    this.clientId = getRequiredEnvironmentVariable(
      settings.clientIdKey,
      config
    );
    this.clientSecret = getRequiredEnvironmentVariable(
      settings.clientSecretKey,
      config
    );
  }

  async createAuthOptions(): Promise<AuthenticationModuleOptions> {
    const audience = getRequiredEnvironmentVariable(
      this.settings.audienceKey,
      this.config
    );
    const issuer = getRequiredEnvironmentVariable(
      this.settings.issuerKey,
      this.config
    );

    if (!this.settings.tokenKey) {
      throw new MissingConfigurationSettingException('tokenKey');
    }

    return {
      auth0ClientOptions: {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        domain: this.domain,
      },
      audience,
      issuer,
      tokenKey: this.settings.tokenKey,
    };
  }
}
