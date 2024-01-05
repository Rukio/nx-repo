# nest-policy

This library is a NestJS module that provides a service for making policy queries to the Policy Service.

## Basic Usage

To use this module, import it into your app module as follows:

```typescript
import { Module, NestModule } from '@nestjs/common';
import { PolicyModule } from '@*company-data-covered*/nest-policy';

@Module({
  imports: [PolicyModule.forRoot({ isGlobal: true })],
  providers: [],
})
export class AppModule implements NestModule {}
```

It will likely be used as a global module (`isGlobal: true`).

To use the service to query the Policy service log metrics, it can now be injected into NestJS controllers and providers:

```typescript
import { Controller, Get } from '@nestjs/common';
import { PolicyService } from '@*company-data-covered*/nest-policy';
import { AuthService } from '@*company-data-covered*/nest-auth';

@Controller('example')
export class ExampleController {
  constructor(private policy: PolicyService, private auth: AuthService) {}

  @Get()
  async canAudit() {
    const actor = await this.auth.getPolicyActor();
    return await this.service.allowed('audit.create_audit_event', actor);
  }
}
```
