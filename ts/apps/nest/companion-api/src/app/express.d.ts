import { CompanionSessionUserModel } from './companion/companion.strategy';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends CompanionSessionUserModel {}
  }
}
