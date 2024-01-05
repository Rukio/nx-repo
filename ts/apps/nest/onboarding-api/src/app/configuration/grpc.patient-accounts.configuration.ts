import { Transport } from '@nestjs/microservices';
import { resolve } from 'path';
import { registerAs } from '@nestjs/config';

import { PATIENTS_ACCOUNTS_PACKAGE_NAME } from '@*company-data-covered*/protos/nest/patients/accounts/service';
import { GRPCConfigEnum } from '../common/enums';

export default registerAs(GRPCConfigEnum.PATIENT_ACCOUNTS, () => ({
  name: PATIENTS_ACCOUNTS_PACKAGE_NAME,
  transport: Transport.GRPC,
  options: {
    url: process.env.PATIENT_ACCOUNTS_SERVICE_GRPC_URL,
    protoPath: [
      resolve(__dirname, 'proto/patients/accounts/service.proto'),
      resolve(__dirname, 'proto/patients/service.proto'),
      resolve(__dirname, 'proto/common/logistics.proto'),
    ],
    package: PATIENTS_ACCOUNTS_PACKAGE_NAME,
    loader: {
      includeDirs: [resolve(__dirname, 'proto')],
      keepCase: true,
    },
  },
}));
