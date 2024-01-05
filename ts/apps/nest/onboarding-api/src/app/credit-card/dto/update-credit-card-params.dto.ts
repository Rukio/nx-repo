import { UpdateCreditCardParams } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export default class UpdateCreditCardParamsDto
  implements UpdateCreditCardParams
{
  @ApiProperty({
    description: 'The card number',
    example: '4242424242424242',
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'place of service',
    example: 'Home',
  })
  @IsString()
  placeOfService: string;

  @ApiProperty({
    description: 'The billing city id',
    example: 5,
  })
  @IsNumber()
  billingCityId: number;

  @ApiProperty({
    description: 'If the credit card should be stored for future use',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  saveForFutureUse: boolean;

  @ApiProperty({
    description: 'The card expiration data',
    example: '2022-11-01',
  })
  @IsString()
  expiration: string;

  @ApiProperty({
    description: 'The card secure code',
    example: '101',
  })
  @IsString()
  cvv: string;

  @ApiProperty({
    description: 'The patient Id',
    example: 394412,
  })
  @IsNumber()
  patientId: number;
}
