import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@*company-data-covered*/consumer-web-types';

export default class StatusDto implements Status {
  @ApiProperty({
    description: 'comment of status',
  })
  comment: string;

  @ApiProperty({
    description: 'commentor name of status',
  })
  commentorName: string;

  @ApiProperty({
    description: 'id of status',
  })
  id: number;

  @ApiProperty({
    description: 'shift team details of status',
  })
  metaData?: {
    shiftTeamId: number;
    eta: string;
    autoAssigned: boolean;
    driveTime: number;
    why: string[];
    rto: boolean;
    assignmentId: string;
  };

  @ApiProperty({
    description: 'name of status',
    example: 'Requested',
  })
  name: string;

  @ApiProperty({
    description: 'started time of status',
  })
  startedAt: string;

  @ApiProperty({
    description: 'user id of status',
  })
  userId: number;

  @ApiProperty({
    description: 'user name of status',
  })
  userName: string;
}
