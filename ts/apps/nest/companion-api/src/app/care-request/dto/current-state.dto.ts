import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CareRequestStatusText } from '../enums/care-request-status.enum';
import { CareRequestStateMetadata } from './care-request-state-metadata.dto';

export class CurrentStateDto {
  @ApiProperty({
    description: 'The unique identifier of the status.',
    example: 123,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The name of the status.',
    example: CareRequestStatusText.Requested,
    enum: CareRequestStatusText,
  })
  @IsEnum(CareRequestStatusText)
  name: CareRequestStatusText;

  @ApiProperty({
    description: 'The time the status stated at.',
    example: '2021-07-08T20:39:08.305Z',
  })
  @IsDateString()
  startedAt: string;

  @ApiProperty({
    description: 'The time the status was created at.',
    example: '2021-07-08T20:39:08.305Z',
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'The time the status updated at.',
    example: '2021-07-08T20:39:08.305Z',
  })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'The index of the status.', example: 1 })
  @IsNumber()
  statusIndex: number;

  @ApiPropertyOptional({
    description: 'Care request state additional information',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CareRequestStateMetadata)
  metadata?: CareRequestStateMetadata;
}
