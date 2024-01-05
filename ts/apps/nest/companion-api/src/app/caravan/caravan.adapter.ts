import { Injectable } from '@nestjs/common';
import { CaravanConsentsAdapter } from './caravan-consents.adapter';

@Injectable()
export class CaravanAdapter {
  constructor(public consents: CaravanConsentsAdapter) {}
}
