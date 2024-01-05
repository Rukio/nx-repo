import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './auth.module-definition';
import { AuthService } from './auth.service';
import { Auth0Client } from './auth0.client';
import { MemoryTokenStore } from './memory-token-store';

@Module({
  imports: [],
  providers: [AuthService, MemoryTokenStore, Auth0Client],
  exports: [AuthService],
})
export class AuthModule extends ConfigurableModuleClass {}
