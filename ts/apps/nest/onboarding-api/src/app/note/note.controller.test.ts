import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { wrapInAxiosResponse } from '../../testUtils/utils';
import NoteController from './note.controller';
import NoteService from './note.service';
import { CacheConfigService } from '../common/cache.config.service';
import LoggerModule from '../logger/logger.module';

let httpService: HttpService;

describe('NoteController', () => {
  let controller: NoteController;

  const note = {
    featured: false,
    inTimeline: null,
    metaData: null,
    note: 'some note',
    noteType: 'regular',
    userId: 84970,
  };
  const mockNoteService = mockDeep<NoteService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [NoteService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(NoteService)
      .useValue(mockNoteService)
      .compile();

    httpService = app.get<HttpService>(HttpService);

    controller = app.get<NoteController>(NoteController);
  });

  beforeEach(async () => {
    mockReset(mockNoteService);
  });

  describe('NoteController', () => {
    it('create Note', async () => {
      const response: AxiosResponse = wrapInAxiosResponse([]);

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(response));

      const result = await controller.create(note, 'care-request-id');
      expect(result.success).toEqual(true);
    });

    it('fetch all Note', async () => {
      const response: AxiosResponse = wrapInAxiosResponse([]);

      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));

      const result = await controller.fetchAll('care-request-id');
      expect(result.success).toEqual(true);
    });

    it('fetch all Note error', async () => {
      mockNoteService.fetchAll.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchAll('12893');
      }).rejects.toThrow(HttpException);
    });

    it('update Note', async () => {
      const response: AxiosResponse = wrapInAxiosResponse([{ id: 'id' }]);

      jest.spyOn(httpService, 'put').mockImplementationOnce(() => of(response));

      const result = await controller.update(note, 'care-request-id', 'id');
      expect(result.success).toEqual(true);
    });

    it('update Note error', async () => {
      mockNoteService.update.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.update(
          {
            note: 'Test',
            noteType: 'some',
            featured: false,
            inTimeline: null,
            metaData: null,
          },
          '1234',
          '30'
        );
      }).rejects.toThrow(HttpException);
    });

    it('remove Note', async () => {
      const response: AxiosResponse = wrapInAxiosResponse([]);

      jest
        .spyOn(httpService, 'delete')
        .mockImplementationOnce(() => of(response));

      const result = await controller.remove('care-request-id', 'id');
      expect(result.success).toEqual(true);
    });

    it('remove Note error', async () => {
      mockNoteService.remove.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.remove('1234', '30');
      }).rejects.toThrow(HttpException);
    });
  });
});
