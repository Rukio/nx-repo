import { Protocol, StationProtocol } from '@*company-data-covered*/consumer-web-types';

const StationSymptomToSymptom = (input: StationProtocol): Protocol => {
  const output: Protocol = {
    id: input.id,
    name: input.name,
    weight: 0,
  };

  return output;
};

export default { StationSymptomToSymptom };
