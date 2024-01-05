import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class EtaRangeDto {
  @ApiProperty({
    description: `The ID of the ETA range.`,
    example: `123456`,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: `The start timestamp of the care team's ETA range.`,
    example: `'2021-07-08T18:39:08.305Z'`,
  })
  @IsDateString()
  startsAt: string;

  @ApiProperty({
    description: `The end timestamp of the care team's ETA range.`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsDateString()
  endsAt: string;

  @ApiProperty({
    description: `The ID of the care request.`,
    example: `123456`,
  })
  @IsNumber()
  careRequestId: number;

  @ApiProperty({
    description: `The ID of the care request status.`,
    example: `123456`,
  })
  @IsNumber()
  careRequestStatusId: number;

  @ApiProperty({
    description: `The created timestamp of the care team's ETA range.`,
    example: `'2021-07-08T18:39:08.305Z'`,
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: `The updated timestamp of the care team's ETA range.`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsDateString()
  updatedAt: string;
}
