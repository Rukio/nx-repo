import { AssignableShiftTeam } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export default class AssignableShiftTeamDto implements AssignableShiftTeam {
  @ApiProperty({
    description: 'Assignable Shift Team ID',
    example: 142765,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Assignable Shift Team assigment type',
    example: 'auto-assignable',
  })
  @IsString()
  @IsOptional()
  assignmentType?: string;

  @ApiProperty({
    description: 'Assignable Shift Team endTime date',
    example: '2022-08-25T18:00:00.000Z',
  })
  @IsString()
  endTime: string;

  @ApiProperty({
    description: 'Assignable Shift Team insurance values',
    example: [
      'Cigna/Denver',
      'Cigna/Colorado Springs',
      'Denver Health Medical Plan/Denver',
      'Denver Health Medical Plan/Colorado Springs',
      'InnovAge/Denver',
      'InnovAge/Colorado Springs',
      'Medicaid/Denver',
      'Medicaid/Colorado Springs',
      'Medicare/Denver',
    ],
  })
  @IsArray()
  @IsOptional()
  insurance?: string[];

  @ApiProperty({
    description: 'Assignable Shift Team license values',
    example: ['CO', 'pediatric', 'WY'],
  })
  @IsArray()
  @IsOptional()
  license?: string[];

  @ApiProperty({
    description: 'Assignable Shift Team presentation modality',
    example: 'in_person',
  })
  @IsString()
  @IsOptional()
  presentationModality?: string;

  @ApiProperty({
    description: 'Assignable Shift Team car name',
    example: 'DEN01',
  })
  @IsString()
  @IsOptional()
  carName?: string;

  @ApiProperty({
    description: 'Assignable Shift Team car name',
    example: 'Acute',
  })
  @IsString()
  @IsOptional()
  shiftType?: string;

  @ApiProperty({
    description: 'Assignable Shift Team skill IDs',
    example: 136361,
  })
  @IsArray()
  @IsOptional()
  skillId?: number[];

  @ApiProperty({
    description: 'Assignable Shift Team startTime date',
    example: '2022-08-25T06:00:00.000Z',
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'Assignable Shift Team status',
    example: 'STATUS_NOT_ASSIGNABLE',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Assignable Shift Team status of time window',
    example: 'TIME_WINDOW_STATUS_UNSPECIFIED',
  })
  @IsString()
  @IsOptional()
  timeWindowStatus?: string;
}
