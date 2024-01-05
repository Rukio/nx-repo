import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class IdentificationUploadDto {
  @ApiProperty({
    type: 'file',
    format: 'binary',
    description: `The image file of the form of identification.`,
  })
  @IsString()
  image: string;
}
