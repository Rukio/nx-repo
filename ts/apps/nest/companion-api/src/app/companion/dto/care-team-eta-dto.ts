import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { EtaPrecision } from '../../care-request/enums/care-request-eta-precision';

export class CareTeamEtaDto {
  @ApiProperty({
    description: `The estimated time of arrival for the care team in Unix timestamp.`,
    example: 1668211110,
  })
  @IsNumber()
  estimatedArrivalTimestampSec: number;

  @ApiProperty({
    description: `Timestamp precision. PRECISION_COARSE: Coarse precision, with only approximate accuracy, PRECISION_EN_ROUTE_REALTIME: Realtime enroute precision`,
    enum: EtaPrecision,
    example: EtaPrecision['PRECISION_COARSE'],
  })
  @IsEnum(EtaPrecision)
  precision: EtaPrecision;
}
