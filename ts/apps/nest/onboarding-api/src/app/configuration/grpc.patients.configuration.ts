import { Transport } from '@nestjs/microservices';
import { resolve } from 'path';
import { registerAs } from '@nestjs/config';

import { PATIENTS_PACKAGE_NAME } from '@*company-data-covered*/protos/nest/patients/service';

export default registerAs('patientOptions', () => ({
  name: PATIENTS_PACKAGE_NAME,
  transport: Transport.GRPC,
  options: {
    url: process.env.PATIENT_SERVICE_GRPC_URL,
    protoPath: [
      resolve(__dirname, 'proto/patients/service.proto'),
      resolve(__dirname, 'proto/athena/pharmacy.proto'),
    ],
    package: PATIENTS_PACKAGE_NAME,
    loader: {
      includeDirs: [resolve(__dirname, 'proto')],
      keepCase: true,
    },
  },
}));
