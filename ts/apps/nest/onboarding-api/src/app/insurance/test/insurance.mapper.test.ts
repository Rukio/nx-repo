import mapper from '../insurance.mapper';
import {
  MOCK_INSURANCE,
  MOCK_INSURANCE_PARAMS,
  MOCK_RESULT_SELF_UPLOADED_INSURANCE,
  MOCK_STATION_INSURANCE,
  MOCK_STATION_INSURANCE_PARAMS,
  MOCK_STATION_RESULT_SELF_UPLOADED_INSURANCE,
} from './mocks/insurance.mock';

describe('Insurance mapper tests', () => {
  it('station insurance to insurance', async () => {
    const transformedResult = mapper.StationInsuranceToInsurance(
      MOCK_STATION_INSURANCE
    );
    expect(transformedResult).toEqual(MOCK_INSURANCE);
  });

  it('insurance to station insurance', async () => {
    const transformedResult =
      mapper.InsuranceToStationInsurance(MOCK_INSURANCE);
    expect(transformedResult).toEqual(MOCK_STATION_INSURANCE);
  });

  it('station self upload insurance to self upload insurance', async () => {
    const transformedResult =
      mapper.StationSelfUploadInsuranceToSelfUploadInsurance(
        MOCK_STATION_RESULT_SELF_UPLOADED_INSURANCE
      );
    expect(transformedResult).toEqual(MOCK_RESULT_SELF_UPLOADED_INSURANCE);
  });

  it('station self upload insurance to self upload insurance', async () => {
    const transformedResult =
      mapper.StationSelfUploadInsuranceToSelfUploadInsurance(
        MOCK_STATION_RESULT_SELF_UPLOADED_INSURANCE
      );
    expect(transformedResult).toEqual(MOCK_RESULT_SELF_UPLOADED_INSURANCE);
  });

  it('insurance params to station insurance params', async () => {
    const transformedResult = mapper.InsuranceParamsToStationInsuranceParams(
      MOCK_INSURANCE_PARAMS
    );
    expect(transformedResult).toEqual(MOCK_STATION_INSURANCE_PARAMS);
  });
});
