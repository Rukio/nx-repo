import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export default class UpdateCareRequestStatusDto {
  @ApiProperty({
    description: 'New care request status',
    example: 'archived',
  })
  status: string;

  @ApiProperty({
    description: 'Reason for status change',
    example: 'Patient declined',
  })
  @IsString()
  @IsOptional()
  comment: string;

  @ApiProperty({
    description: 'The shift team id',
    example: 141659,
  })
  @IsNumber()
  @IsOptional()
  shiftTeamId: number;

  @ApiProperty({
    description: 'The reason for Shift team reassignment',
    example: 'Patient Time Window needs adjustment',
  })
  @IsString()
  @IsOptional()
  reassignmentReasonText: string;

  @ApiProperty({
    description: 'The other reason for Shift team reassignment',
    example: 'Free Text',
  })
  @IsString()
  @IsOptional()
  reassignmentReasonOtherText: string;
}
