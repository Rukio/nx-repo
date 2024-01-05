import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { CompanionSessionUserModel } from './companion.strategy';

@Injectable()
export class CompanionSerializer extends PassportSerializer {
  /**
   * Serializes the user into the session.
   *
   * Currently, the entire user object is serialized.
   *
   * @param user The user to serialize.
   * @param done The callback to execute when serialization is complete.
   */
  serializeUser(user: CompanionSessionUserModel, done: CallableFunction): void {
    return done(null, user);
  }

  /**
   * Deserializes the user from the session.
   *
   * Currently, the entire user object is serialized, so we just return it.
   *
   * @param user The serialize user object to deserialize.
   * @param done The callback to execute when deserialization is complete.
   */
  deserializeUser(
    user: CompanionSessionUserModel,
    done: CallableFunction
  ): void {
    return done(null, user);
  }
}
