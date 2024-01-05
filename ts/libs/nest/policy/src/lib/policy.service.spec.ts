import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PolicyModule } from './policy.module';
import { PolicyService } from './policy.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { MOCK_POLICY_HOST, mockHttpService } from '../mocks/http.service.mock';
import { mockConfigService } from '../mocks/config.service.mock';
import { PolicyActor } from '@*company-data-covered*/nest/auth';

const noResult = {};

describe(`${PolicyService.name}`, () => {
  let app: INestApplication;
  let service: PolicyService;

  const policyActor: PolicyActor = {
    type: 'm2m',
    properties: { client_name: 'Patients Service M2M' },
  };

  const badPolicyActor: PolicyActor = {
    type: 'user',
    properties: { markets: [1, 2, 3] },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PolicyModule.forRoot({
          policyServiceBaseUrl: MOCK_POLICY_HOST,
        }),
      ],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    service = moduleRef.get<PolicyService>(PolicyService);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`service is instance of PolicyService`, async () => {
    expect(service).toBeInstanceOf(PolicyService);
  });

  describe('queryPolicy', () => {
    it('should retrieve a result', async () => {
      expect(
        await service.queryPolicy('result = data.policies.audit', {
          actor: policyActor,
          resource: {},
        })
      ).toEqual({
        result: [
          {
            result: { create_audit_event: true },
          },
        ],
      });
    });

    it('should return empty for a bad query', async () => {
      expect(
        await service.queryPolicy('result = data.policies.bad_query', {
          actor: policyActor,
          resource: {},
        })
      ).toEqual(noResult);
    });

    it('should return empty for a missing query', async () => {
      expect(
        await service.queryPolicy('', {
          actor: policyActor,
          resource: {},
        })
      ).toEqual(noResult);
    });
  });

  type CreateAuditEventPolicy = {
    create_audit_event: true;
  };

  describe('checkPolicy', () => {
    it('should be authorized with good actor', async () => {
      const expected = {
        create_audit_event: true,
      };

      expect(
        await service.checkPolicy<CreateAuditEventPolicy>('audit', policyActor)
      ).toEqual(expected);
    });

    it('should be unauthorized with bad actor', async () => {
      const expected = {
        create_audit_event: false,
      };
      expect(
        await service.checkPolicy<CreateAuditEventPolicy>(
          'audit',
          badPolicyActor
        )
      ).toEqual(expected);
    });

    it('should be null with bad policy', async () => {
      expect(
        await service.checkPolicy<CreateAuditEventPolicy>(
          'wrong_policy',
          policyActor
        )
      ).toBeNull;
    });
  });

  describe('allowed', () => {
    const policy = 'audit.create_audit_event';

    it('should be true with good actor', async () => {
      expect(await service.allowed(policy, policyActor)).toEqual(true);
    });

    it('should be false with bad actor', async () => {
      expect(await service.allowed(policy, badPolicyActor)).toEqual(false);
    });

    it('should be false with bad policy', async () => {
      expect(await service.allowed('wrong_policy', policyActor)).toEqual(false);
    });
  });
});
