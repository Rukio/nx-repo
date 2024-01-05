import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Analytics } from '@segment/analytics-node';
import { SegmentModule } from '../segment.module';
import { SegmentService } from '../segment.service';

jest.mock('@segment/analytics-node');

const initializationSettings = {
  writeKey: 'Qw3rTyD1sPA7chH34l7He45yAs123abc',
};

describe(`${SegmentService.name}`, () => {
  let app: INestApplication;
  let segmentService: SegmentService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        SegmentModule.forRoot({
          initializationSettings,
          isGlobal: true,
        }),
      ],
    }).compile();

    segmentService = moduleRef.get<SegmentService>(SegmentService);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('identify', () => {
    it('should call Segment API', async () => {
      const identifySegmentFnSpy = jest
        .spyOn(Analytics.prototype, 'identify')
        .mockImplementation((params, callback) => {
          callback?.();
        });
      const segmentServiceIdentifyFnSpy = jest.spyOn(
        segmentService,
        'identify'
      );
      const identifyFnParams = { userId: '' };

      await expect(
        segmentService.identify(identifyFnParams)
      ).resolves.toBeUndefined();
      expect(segmentServiceIdentifyFnSpy).toHaveBeenCalledTimes(1);
      expect(identifySegmentFnSpy).toHaveBeenCalledTimes(1);
      expect(identifySegmentFnSpy).toHaveBeenCalledWith(
        identifyFnParams,
        expect.any(Function)
      );
    });

    it('rejects if Segment API call fails', async () => {
      const identifySegmentFnSpy = jest
        .spyOn(Analytics.prototype, 'identify')
        .mockImplementation((params, callback) => {
          const err = new Error();
          callback?.(err);
        });
      const identifyFnParams = { userId: '' };

      await expect(
        segmentService.identify(identifyFnParams)
      ).rejects.toBeDefined();
      expect(identifySegmentFnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('track', () => {
    it('should call Segment API', async () => {
      const trackSegmentFnSpy = jest
        .spyOn(Analytics.prototype, 'track')
        .mockImplementation((params, callback) => {
          callback?.();
        });
      const segmentServiceTrackFnSpy = jest.spyOn(segmentService, 'track');
      const trackFnParams = { userId: '', event: '' };

      await expect(
        segmentService.track(trackFnParams)
      ).resolves.toBeUndefined();
      expect(segmentServiceTrackFnSpy).toHaveBeenCalledTimes(1);
      expect(trackSegmentFnSpy).toHaveBeenCalledTimes(1);
      expect(trackSegmentFnSpy).toHaveBeenCalledWith(
        trackFnParams,
        expect.any(Function)
      );
    });

    it('rejects if Segment API call fails', async () => {
      const trackSegmentFnSpy = jest
        .spyOn(Analytics.prototype, 'track')
        .mockImplementation((params, callback) => {
          const err = new Error();
          callback?.(err);
        });
      const trackFnParams = { userId: '', event: '' };

      await expect(segmentService.track(trackFnParams)).rejects.toBeDefined();
      expect(trackSegmentFnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('shutdown', () => {
    it('should shutdown and flush segment service', async () => {
      const closeAndFlushSpy = jest.spyOn(Analytics.prototype, 'closeAndFlush');

      expect(segmentService.shutdown()).toBeUndefined();
      expect(closeAndFlushSpy).toHaveBeenCalledTimes(1);
    });
  });
});
