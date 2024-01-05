import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { User } from '@*company-data-covered*/consumer-web-types';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import mapper from './user.mapper';

@Injectable()
export default class UserService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  /** Retrieves the base path for the Station service from the config service. */
  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  /** Retrieves an object with all of the headers required to communicate with Station APIs. Formatted for Axios request configuration. */
  private async getCommonHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  async fetch(email?: string): Promise<User> {
    let url = `${this.basePath}/api/users/user`;
    if (email) {
      url += `?email=${email}`;
    }
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: User = mapper.StationUserToUser(response.data);

    return data;
  }
}
