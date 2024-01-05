# nest-statsig

This library is a NestJS module that provides StatsigService. It makes use of the `statsig-node` SDK.

## Installation

To install:

```sh
# NPM
npm install @*company-data-covered*/nest-statsig

# Yarn
yarn add @*company-data-covered*/nest-statsig
```

## Usage

To use this module, import it into your app module as follows:

```typescript
// statsig.configuration.factory.ts
import { StatsigModuleOptions } from '@*company-data-covered*/nest-statsig';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StatsigConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      StatsigModuleOptions,
      'createStatsigOptions'
    >
{
  constructor(private config: ConfigService) {}

  createStatsigOptions(): StatsigModuleOptions {
    // build module options using ConfigService
  }
}

// app.module.ts
import { StatsigConfigurationFactory } from './statsig.configuration.factory.ts';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    StatsigModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: StatsigConfigurationFactory,
      isGlobal: true,
    }),
  ],
  providers: [],
})
export class AppModule implements NestModule {}
```

It will likely be used as a global module (`isGlobal: true`) unless multiple Statsig projects are required (not recommended).

To use the service, it can now be injected into NestJS controllers and providers:

```typescript
import { Injectable } from '@nestjs/common';
import { StatsigUser } from 'statsig-node';
import { StatsigService } from '@*company-data-covered*/nest-statsig';

@Injectable()
export class ExampleService {
  constructor(private statsig: StatsigService) {}

  async getExampleExperiment() {
    const statsigUser: StatsigUser = {
      userID: 'user-id',
    };
    const experimentName = 'example_experiment';
    const experimentConfig = await this.statsig.getExperiment(
      statsigUser,
      experimentName
    );
  }

  async checkExampleGate() {
    const statsigUser: StatsigUser = {
      userID: 'user-id',
    };
    const gateName = 'example_gate';
    const isGateEnabled = await this.statsig.checkGate(statsigUser, gateName);
  }
}
```

For details on all available methods, see [statsig.service.ts](./src/lib/statsig.service.ts).
