import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject } from 'class-validator';
import { PrimaryCareProvider } from '../interfaces/pcp.interface';

export class PrimaryCareProviderDto {
  @ApiProperty({
    description: `The clinical provider ID.`,
    example: {
      id: 1,
    },
  })
  @IsObject()
  @Type(() => PrimaryCareProvider)
  clinicalProvider: PrimaryCareProvider;
}
