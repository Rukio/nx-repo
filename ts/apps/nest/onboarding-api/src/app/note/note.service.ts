import { Injectable } from '@nestjs/common';
import { Note, StationNote } from '@*company-data-covered*/consumer-web-types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import mapper from './note.mapper';

@Injectable()
export default class NoteService {
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

  async create(
    careRequestId: string,
    payload: Omit<Note, 'id' | 'careRequestId'>
  ): Promise<Note> {
    const stationPayload: StationNote = mapper.NoteToStationNote(payload);

    const url = `${this.basePath}/api/care_requests/${careRequestId}/notes`;

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        { note: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: Note = mapper.StationNoteToNote(response.data);

    return data;
  }

  async fetchAll(careRequestId: string): Promise<Note[]> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/notes`;

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: Note[] = response.data.map((s: StationNote) =>
      mapper.StationNoteToNote(s)
    );

    return data;
  }

  async update(
    careRequestId: string,
    id: string | number,
    payload: Omit<Note, 'id' | 'careRequestId'>
  ): Promise<Note> {
    const stationPayload: StationNote = mapper.NoteToStationNote(payload);

    const url = `${this.basePath}/api/care_requests/${careRequestId}/notes/${id}`;

    const response = await lastValueFrom(
      this.httpService.put(
        url,
        { note: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const result = response.data.find((note: { id: number }) => {
      return note.id.toString() === id.toString();
    });

    const data: Note = mapper.StationNoteToNote(result);

    return data;
  }

  async remove(
    careRequestId: string,
    id: string
  ): Promise<{ success: boolean }> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/notes/${id}`;
    await lastValueFrom(
      this.httpService.delete(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    return { success: true };
  }
}
