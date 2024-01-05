import { Markets } from './markets';
import { SHIFT_TYPE } from './shiftType';
import { Users } from './users';

export type Id = {
  id: number | string;
};
export type Instance = number;

export declare namespace Shifts {
  type NameGeneration = Markets.ShortName & {
    instance: Instance;
  };

  type ShiftInfo = {
    shiftType: SHIFT_TYPE;
    endShiftIn2Hours?: boolean;
    endShiftIn4Hours?: boolean;
    isVirtual?: boolean;
    isTomorrow?: boolean;
    isSelfShift?: boolean;
  };

  type CreateShift = ShiftInfo &
    Markets.Market & {
      currentInstance: Instance;
    };
  type CreateShifts = Markets.Market &
    Users.LoginUser & {
      shifts: Array<ShiftInfo>;
      endShiftsFirst?: boolean;
    };

  type ShiftRsp = Id & {
    start_time: string;
    members: Array<Users.Provider>;
    market_id: number;
  };

  type FutureShiftRsp = {
    shift_team: Id & {
      start_time: string;
      end_time: string;
      members: Array<Users.Provider>;
      market_id: number;
    };
  };
  type LegacyFutureShiftRsp = Id & {
    start_time: string;
    end_time: string;
    members: Array<Users.Provider>;
    market_id: number;
  };

  type FutureShifts = Markets.MarketId & {
    shifts: Array<ShiftRsp>;
  };
}
