import { Id } from './shifts';

export type SUPPORTED_TEST_MARKETS =
  | 'denver'
  | 'atlanta'
  | 'columbus'
  | 'nashville'
  | 'lasVegas'
  | 'houston'
  | 'dallas'
  | 'daytonaBeach'
  | 'cleveland'
  | 'seattle'
  | 'olympia'
  | 'phoenix'
  | 'tucson'
  | 'tacoma'
  | 'knoxville'
  | 'richmond'
  | 'northernVirginia'
  | 'portland'
  | 'tampa'
  | 'miami'
  | 'sanAntonio';

export declare namespace Markets {
  type MarketId = Id;
  type ShortName = {
    shortName: string;
  };
  type State = {
    state: string;
  };
  type Market = {
    market: MarketBody;
  };

  type MarketAddress = State & {
    streetAddress1: string;
    streetAddress2: string;
    city: string;
    zipCode: string;
    latitude: string;
    longitude: string;
  };

  type MarketBody = MarketId &
    ShortName & {
      name: string;
      fullState: string;
      timeZoneCity: string;
      careRequestAddress: MarketAddress;
    };
}
