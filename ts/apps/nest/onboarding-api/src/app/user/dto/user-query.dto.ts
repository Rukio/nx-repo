import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export default class UserQueryDto {
  @ApiProperty({
    description: 'User email',
    required: false,
  })
  @IsOptional()
  email?: string;
}
