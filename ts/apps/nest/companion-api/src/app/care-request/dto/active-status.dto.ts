import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ActiveStatusMetadata } from '../../dashboard/types/dashboard-active-status';

export class ActiveStatusDto {
  @ApiProperty({
    description: `The ID of the status.`,
    example: 123456,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: `The name of the status.`,
    example: 'requested',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: `The user ID associated with the status.`,
  })
  @IsOptional()
  userId?: unknown;

  @ApiProperty({
    description: `The ID of the active status.`,
    example: `'2021-07-08T20:39:08.305Z'`,
  })
  @IsString()
  startedAt: string;

  @ApiPropertyOptional({
    description: `The comment associated with the status.`,
    example: `Enter on the west side of the building.`,
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: `The metadata associated with the status.`,
  })
  @IsObject()
  @IsOptional()
  metadata?: ActiveStatusMetadata;

  @ApiProperty({
    description: `The username associated with the status.`,
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: `The name of the person who provided the status comment.`,
  })
  @IsString()
  commenterName: string;
}
