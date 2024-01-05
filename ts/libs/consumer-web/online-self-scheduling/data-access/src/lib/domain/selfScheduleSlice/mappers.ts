import { skipToken } from '@reduxjs/toolkit/query';
import { SelectCheckMarketFeasibilityPayload } from './selfSchedule.slice';

export const prepareCheckMarketFeasibilityPayload = (
  zipcode?: string,
  marketId?: number,
  date?: string
): SelectCheckMarketFeasibilityPayload =>
  zipcode && marketId && date
    ? {
        zipcode,
        marketId,
        date,
      }
    : skipToken;
