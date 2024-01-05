import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { DashboardEtaRange } from '../../dashboard/types/dashboard-eta-range';

/** The information necessary to create a companion link. */
export class DashboardWebhookDtoV2 {
  @ApiProperty({
    description: `The care request id that is sent from a webhook in the station application.`,
    example: '867769',
  })
  @IsNumber()
  care_request_id: number;

  @ApiProperty({
    description: `The care request status that is sent from a webhook in the station application.`,
    example: 'accepted',
  })
  @IsString()
  request_status: string;

  @ApiPropertyOptional({
    description: `The eta range that is sent from a webhook in the station application.`,
    example: {
      id: 1,
      starts_at: '2000-01-01T00:00:00.001Z',
      ends_at: '2000-01-01T12:00:00.000Z',
      user_id: 1001,
      care_request_id: 101,
      care_request_status_id: 1000,
      created_at: '2000-01-01T00:00:00.001Z',
      updated_at: '2000-01-01T01:00:00.000Z',
    },
  })
  @IsObject()
  @IsOptional()
  eta_range?: DashboardEtaRange;
}
