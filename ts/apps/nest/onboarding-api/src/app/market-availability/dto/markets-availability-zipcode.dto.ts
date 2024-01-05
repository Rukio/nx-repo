import { ApiProperty } from '@nestjs/swagger';

export default class MarketsAvailabilityZipcodeDto {
  @ApiProperty({
    description: 'Zipcode',
    example: '80205',
  })
  zipcode: number | string;
}
