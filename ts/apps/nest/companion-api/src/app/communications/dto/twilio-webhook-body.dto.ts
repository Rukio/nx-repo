import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TwilioWebhookBodyDto {
  @ApiProperty({
    description: `The account or subaccount SID for the Twilio Error Webhook.`,
    example: 'ACxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  AccountSid: string;
  @ApiProperty({
    description: `The level of the Twilio Webhook.`,
    example: 'ERROR',
  })
  @IsString()
  Level: string;
  @ApiProperty({
    description: `The parent account SID for the Twilio Error Webhook.`,
    example: 'ACxxxxxxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  ParentAccountSid: string;
  @ApiProperty({
    description: `The payload for the webhook.`,
    example:
      '{"resource_sid":"CAxxxxxxxx","service_sid":null,"error_code":"11200","more_info":{"msg":"An attempt to retrieve content from https://yyy.zzz returned the HTTP status code 404","Msg":"An attempt to retrieve content from https://yyy.zzz returned the HTTP status code 404","sourceComponent":"12000","ErrorCode":"11200","httpResponse":"404","url":"https://yyy.zzz","LogLevel":"ERROR"},"webhook":{"type":"application/json","request":{}}}',
  })
  @IsString()
  Payload: string;
  @ApiProperty({
    description: `The content type of the payload.`,
    example: 'application/json',
  })
  @IsString()
  PayloadType: string;
  @ApiProperty({
    description: `The SID of the webhook from Twilio.`,
    example: 'NOxxxxx',
  })
  @IsString()
  Sid: string;
  @ApiProperty({
    description: `Timestamp for the error.`,
    example: '2020-01-01T23:28:54Z',
  })
  @IsString()
  Timestamp: string;
}
