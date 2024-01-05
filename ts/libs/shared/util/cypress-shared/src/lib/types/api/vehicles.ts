import { Id } from './shifts';
import { Markets } from './markets';

export declare namespace Vehicles {
  type VehicleId = Id;
  type Name = {
    name?: string;
  };
  type Count = {
    count?: number;
  };

  type Vehicle = VehicleId & Name;
  type CreateVehicle = Name & Count & Markets.Market;
  type UpdateGeoLocation = VehicleId & {
    currentLat: string;
    currentLong: string;
  };
}
