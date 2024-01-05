import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PartnerLine } from '@*company-data-covered*/consumer-web-types';
import mapper from './partner-lines.mapper';

@Injectable()
export default class PartnerLinesService {
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
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
      'Content-Type': 'application/json',
    };
  }

  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    const countryCodeMatch = cleaned.match(/^(1)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]})${match[2]}-${match[3]}`;
    }
    if (countryCodeMatch) {
      return `(${countryCodeMatch[2]})${countryCodeMatch[3]}-${countryCodeMatch[4]}`;
    }

    return null;
  }

  async fetchAll(): Promise<PartnerLine[]> {
    const url = `${this.basePath}/api/partner_lines`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: PartnerLine[] = response.data.map(
      mapper.StationPartnerLineToPartnerLine
    );

    return data;
  }

  async fetch(phoneNumber: string): Promise<PartnerLine> {
    const partnerLines: PartnerLine[] = await this.fetchAll();

    const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);

    const data: PartnerLine =
      formattedPhoneNumber &&
      partnerLines.find(
        (pl: PartnerLine) => pl.digits === formattedPhoneNumber
      );

    return data;
  }
}
