import { CareRequests } from './careRequests';
import { Markets } from './markets';
import { Shifts } from './shifts';

export declare namespace Assignment {
  type LoginUser = {
    loginUser?: string;
  };

  type AssignCareRequest = CareRequests.CareRequestId & {
    assignTomorrow?: boolean;
    assignVirtual?: boolean;
    shiftId: string | number;
  };

  type AssignmentInfo = {
    assignmentInfo: LoginUser &
      Markets.Market & {
        crId: string | number;
        shifts: Array<Shifts.ShiftInfo>;
        endShiftsFirst?: boolean;
        assignVirtual?: boolean;
      };
  };
}
