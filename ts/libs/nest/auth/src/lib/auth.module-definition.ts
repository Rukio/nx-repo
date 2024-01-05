import { ConfigurableModuleBuilder } from '@nestjs/common';
import { AuthenticationModuleOptions } from './auth.module-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<AuthenticationModuleOptions>()
    .setFactoryMethodName('createAuthOptions')
    .build();
