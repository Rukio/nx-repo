import { Injectable } from '@nestjs/common';
import { State } from '@*company-data-covered*/consumer-web-types';
import StationService from '../station/station.service';

@Injectable()
export default class StateService {
  constructor(private stationService: StationService) {}

  async fetchAllActive(): Promise<State[]> {
    return this.stationService.fetchStates();
  }
}
