import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** The information necessary to create a companion link. */
export class DashboardWebhookDtoV1 {
  @ApiProperty({
    description: `The care request payload data that is sent from a webhook in the station application.`,
    example: '{"external_id":867769,"request_status":"accepted"}',
  })
  @IsString()
  care_request: string;
}
