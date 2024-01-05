import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class PrimaryCareProvider {
  @ApiProperty({
    description:
      'The Athena clinical provider ID of the primary care provider.',
  })
  @IsNumber()
  id: number;
}
