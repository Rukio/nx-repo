# nest-segment

A NestJS library that supports the use of [Segment](https://segment.com/docs/connections/sources/catalog/libraries/server/node/) to log analytics events.

## Resources

[EDD](https://github.com/*company-data-covered*/services/blob/trunk/docs/edd/segment_companion-api_document.md)

## Usage

To use this module, import it into your app module as follows:

```typescript
// segment.configuration.factory.ts
import { SegmentModuleOptions } from '@*company-data-covered*/nest-segment';
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SegmentConfigurationFactory
  implements
    ConfigurableModuleOptionsFactory<
      SegmentModuleOptions,
      'createSegmentOptions'
    >
{
  constructor(private config: ConfigService) {}

  createSegmentOptions(): SegmentModuleOptions {
    // build module options using ConfigService
}


// app.module.ts
import { SegmentConfigurationFactory } from './segment.configuration.factory.ts';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SegmentModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: SegmentConfigurationFactory,
      isGlobal: true,
    }),
  ],
  providers: [],
})
export class AppModule implements NestModule {}
```

To use the service, it can now be injected into NestJS controllers and providers:

```typescript
import { Injectable } from '@nestjs/common';
import { SegmentService } from '@*company-data-covered*/nest-segment';

@Injectable()
export class ExampleService {
  constructor(private segment: SegmentService) {}

  // ...
}
```

For details on all available methods, see [segment.service.ts](./src/lib/segment.service.ts).
