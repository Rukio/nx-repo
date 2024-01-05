import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignTeamParam } from '@*company-data-covered*/consumer-web-types';

export default class AssignTeamQueryDto implements AssignTeamParam {
  @ApiProperty({
    description: 'Care Request ID',
    example: 612985,
  })
  careRequestId: number | string;

  @ApiProperty({
    description: 'Shift Team ID',
    example: 70145,
  })
  shiftTeamId: number | string;

  @ApiPropertyOptional({
    description: 'Assign Team reason',
    example: 'Reason',
  })
  reasonText: string;

  @ApiPropertyOptional({
    description: 'Assign Team reason other text',
    example: 'Other text reason',
  })
  reasonTextOther: string;

  @ApiPropertyOptional({
    description: 'Assign Team assigment date',
    example: '02-02-2022',
  })
  assignmentDate: Date | string;

  @ApiPropertyOptional({
    description: 'Assign Team meta data',
    example: {
      why: 'Test',
      autoAssigned: true,
      driveTime: 548,
    },
  })
  metaData: {
    why?: string;
    autoAssigned?: boolean;
    driveTime?: number;
  };
}
