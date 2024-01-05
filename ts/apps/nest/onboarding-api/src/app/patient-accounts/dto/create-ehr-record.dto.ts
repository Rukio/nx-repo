import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export default class CreateEhrRecordDto {
  @ApiProperty({
    description: 'The billing city id',
    example: 123,
  })
  @IsNumber()
  billingCityId: number;

  @ApiProperty({
    description: 'The unverified patient id',
    example: 123,
  })
  @IsNumber()
  unverifiedPatientId: number;
}
