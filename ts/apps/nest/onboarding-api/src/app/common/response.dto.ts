import { CareRequestAPIResponse } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export default class ResponseDto<T> implements CareRequestAPIResponse<T> {
  @ApiProperty({
    description: 'Status of request',
    example: 'true',
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty()
  data?: T;
}
