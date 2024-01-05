import { ApiProperty } from '@nestjs/swagger';

export default class PartnerLinesQueryDto {
  @ApiProperty({
    description: 'Phone number of the caller',
    example: 'tel:+17206899684',
  })
  phoneNumber: string;
}
