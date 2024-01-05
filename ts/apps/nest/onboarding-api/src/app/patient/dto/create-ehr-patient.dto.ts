import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export default class CreateEhrPatientDto {
  @ApiProperty({
    description: 'billing city id',
    example: '5',
  })
  @IsNumber()
  billingCityId: number;
}
