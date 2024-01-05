import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AppointmentSlotDto {
  @ApiPropertyOptional({
    description: `The ID of the scheduled appointment.`,
    example: 123,
  })
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiProperty({
    description: `The ID of the associated care request.`,
    example: 12345,
  })
  @IsNumber()
  careRequestId: number;

  @ApiPropertyOptional({
    description: `The start timestamp of scheduled appointment.`,
    example: `'2021-07-08T18:39:08.305Z'`,
  })
  @IsString()
  @IsOptional()
  startTime: string;

  @ApiPropertyOptional({
    description: `The created timestamp of scheduled appointment.`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsString()
  @IsOptional()
  createdAt: string;

  @ApiPropertyOptional({
    description: `The updated timestamp of scheduled appointment.`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsString()
  @IsOptional()
  updatedAt: string;
}
