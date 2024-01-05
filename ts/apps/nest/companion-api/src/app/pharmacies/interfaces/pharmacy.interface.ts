import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class Pharmacy {
  @ApiProperty({
    description: 'The Athena clinical provider ID of the pharmacy.',
  })
  @IsNumber()
  id: number;
}
