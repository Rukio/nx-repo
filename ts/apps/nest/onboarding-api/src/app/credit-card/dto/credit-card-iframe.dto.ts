import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class CreditCardIframeDto {
  @ApiProperty({
    description: 'The url of the iframe number.',
    example: 'https:/test.com?frame=fff',
  })
  @IsString()
  url?: string;
}
