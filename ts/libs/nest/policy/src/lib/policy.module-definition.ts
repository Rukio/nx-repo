import { ConfigurableModuleBuilder, Inject } from '@nestjs/common';

export type PolicyModuleOptions = {
  /** The base url of the Policy Service. */
  policyServiceBaseUrl: string;
};

export const InjectPolicyOptions = () => Inject(POLICY_MODULE_OPTIONS_TOKEN);

export const {
  ConfigurableModuleClass: PolicyConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: POLICY_MODULE_OPTIONS_TOKEN,
} = new ConfigurableModuleBuilder<PolicyModuleOptions>()
  .setClassMethodName('forRoot')
  .setFactoryMethodName('createPolicyOptions')
  .build();
