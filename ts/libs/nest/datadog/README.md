# nest-datadog

This library is a NestJS module that provides StatsD exporter for Datadog. It makes use of the `hot-shots` StatsD client to send the metrics to the Datadog agent.

## Installation

To install:

```sh
# NPM
npm install @*company-data-covered*/nest-datadog

# Yarn
yarn add @*company-data-covered*/nest-datadog
```

## Basic Usage

To use this module, import it into your app module as follows:

```typescript
import { Module, NestModule } from '@nestjs/common';
import { DatadogModule } from '@*company-data-covered*/nest-datadog';

@Module({
  imports: [DatadogModule.forRoot({ isGlobal: true })],
  providers: [],
})
export class AppModule implements NestModule {}
```

It will likely be used as a global module (`isGlobal: true`) unless your are sending metrics to various Datadog agents.

To use the service to log metrics, it can now be injected into NestJS controllers and providers:

```typescript
import { Controller, Get } from '@nestjs/common';
import { DatadogService } from '@*company-data-covered*/nest-datadog';

@Controller('example')
export class ExampleController {
  constructor(private datadog: DatadogService) {}

  @Get()
  async endpoint() {
    this.datadog.increment('endpoint-stat');
  }
}
```

For more details on the methods available, see [hot-shots documentation](https://github.com/brightcove/hot-shots#statsd-methods).

## Advanced Configuration

To take advantage of the configurable options offered by `hot-shots`, you can use a configuration factory to provide the options to the Datadog module.

```typescript
// datadog.configuration.factory.ts
import { DatadogModuleOptions } from '@*company-data-covered*/nest-datadog';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatadogConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      DatadogModuleOptions,
      'createDatadogOptions'
    >
{
  constructor(private config: ConfigService) {}

  createDatadogOptions(): DatadogModuleOptions {
    // build module options using ConfigService
  }
}

// app.module.ts
import { DatadogConfigurationFactory } from './datadog.configuration.factory.ts';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatadogModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: DatadogConfigurationFactory,
      isGlobal: true,
    }),
  ],
  providers: [],
})
export class AppModule implements NestModule {}
```

For more details on the configuration options available, please refer to the [hot-shots documentation](https://github.com/brightcove/hot-shots#hot-shots).
