import { OSSUserCache } from '@*company-data-covered*/consumer-web-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export default class OSSUserCacheDto implements OSSUserCache {
  @ApiPropertyOptional({
    description: 'Requester data',
  })
  @IsOptional()
  requester?: OSSUserCache['requester'];

  @ApiPropertyOptional({
    description: 'Patient info',
  })
  @IsOptional()
  patientInfo?: OSSUserCache['patientInfo'];

  @ApiPropertyOptional({
    description: 'Power of attorney data',
  })
  @IsOptional()
  powerOfAttorney?: OSSUserCache['powerOfAttorney'];

  @ApiPropertyOptional({
    description: 'Preferred patient ETA',
  })
  @IsOptional()
  preferredEta?: OSSUserCache['preferredEta'];

  @ApiPropertyOptional({
    description: 'Symptopms',
    example: 'Headache',
  })
  @IsOptional()
  symptoms?: string;

  @ApiPropertyOptional({
    description: 'Address id',
    example: 12345,
  })
  @IsOptional()
  addressId?: number;

  @ApiPropertyOptional({
    description: 'ID of the patient',
    example: 123456,
  })
  @IsOptional()
  patientId?: number;

  @ApiPropertyOptional({
    description: 'ID of the care request',
    example: 1234,
  })
  @IsOptional()
  careRequestId?: number;

  @ApiPropertyOptional({
    description: 'Place of service',
  })
  @IsOptional()
  placeOfService?: string;

  @ApiPropertyOptional({
    description: 'ID of the market',
  })
  @IsOptional()
  marketId?: string | number;
}
