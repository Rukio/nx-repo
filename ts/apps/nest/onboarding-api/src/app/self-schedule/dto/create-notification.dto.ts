import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export default class CreateNotificationDto {
  @ApiProperty({
    description: 'The care request id',
    example: '12345',
  })
  @IsString()
  @IsNotEmpty()
  careRequestId: string;
}
