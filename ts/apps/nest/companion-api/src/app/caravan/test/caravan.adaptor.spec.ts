import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { CaravanAdapter } from '../caravan.adapter';
import { CaravanModule } from '../caravan.module';
import { CaravanConsentsAdapter } from '../caravan-consents.adapter';

describe(`${CaravanAdapter.name}`, () => {
  let app: INestApplication | undefined;
  let adapter: CaravanAdapter;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CaravanModule, CommonModule],
    }).compile();

    adapter = moduleRef.get<CaravanAdapter>(CaravanAdapter);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  test(`should be defined correctly`, async () => {
    expect(adapter).toBeInstanceOf(CaravanAdapter);
    expect(adapter.consents).toBeInstanceOf(CaravanConsentsAdapter);
  });
});
