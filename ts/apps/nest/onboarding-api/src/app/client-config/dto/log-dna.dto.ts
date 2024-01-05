import { ApiProperty } from '@nestjs/swagger';

export default class LogDnaDto {
  @ApiProperty({
    description: 'Log DNA ingestion key',
  })
  key: string;

  @ApiProperty({
    description: 'Log DNA tier',
  })
  tier: string;

  @ApiProperty({
    description: 'Set if the log is enabled',
    example: true,
  })
  enabled: boolean;
}
