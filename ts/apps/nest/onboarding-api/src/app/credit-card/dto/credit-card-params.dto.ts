import { CreditCardParams } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export default class CreditCardParamsDto implements CreditCardParams {
  @ApiProperty({
    description: 'The card number.',
    example: '4242424242424242',
  })
  @IsString()
  number: string;

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
    description: '',
    example: 'Home',
  })
  @IsString()
  placeOfService: string;

  @ApiProperty({
    description: 'Id of billing city',
    example: 12412,
  })
  @IsNumber()
  billingCityId: number;

  @ApiProperty({
    description: 'Indicate that the card can be saved',
    example: true,
  })
  @IsBoolean()
  saveForFutureUse: boolean;

  @ApiProperty({
    description: 'The patient Id',
    example: 394412,
  })
  @IsNumber()
  patientId: number;

  @ApiProperty({
    description: 'The care request Id',
    example: 555617,
  })
  @IsNumber()
  careRequestId: number;
}
