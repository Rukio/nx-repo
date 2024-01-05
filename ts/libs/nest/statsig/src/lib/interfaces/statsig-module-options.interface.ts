import { StatsigOptions } from 'statsig-node';

export interface StatsigModuleOptions {
  /** The secret api key corresponds the server secret key of Statsig. */
  secretApiKey: string;
  /** Properties for initializing the sdk with advanced options. */
  options: StatsigOptions;
}
