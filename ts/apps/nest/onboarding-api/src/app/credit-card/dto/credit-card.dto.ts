import { CreditCard } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export default class CreditCardDto implements CreditCard {
  @ApiProperty({
    description: 'The card id.',
    example: '124',
  })
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: 'The card number.',
    example: '4242424242424242',
  })
  @IsString()
  number?: string;

  @ApiProperty({
    description: 'The card expiration data',
    example: '2022-11-01',
  })
  @IsString()
  expiration?: string;

  @ApiProperty({
    description: '',
    example: 'John Doe',
  })
  @IsString()
  nameOnCard?: string;

  @ApiProperty({
    description: 'Last 4 digits',
    example: '4242',
  })
  @IsString()
  lastFour?: string;

  @ApiProperty({
    description: 'Card type',
    example: 'VISA',
  })
  @IsString()
  cardType?: string;
}
