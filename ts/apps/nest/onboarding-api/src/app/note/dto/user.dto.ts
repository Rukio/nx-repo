import { ApiProperty } from '@nestjs/swagger';
import { User } from '@*company-data-covered*/consumer-web-types';

export default class UserDto implements User {
  @ApiProperty({
    description: 'Id of the user',
    example: 84970,
  })
  id: number;

  @ApiProperty({
    description: 'First mane',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last mane',
    example: 'Doe',
  })
  lastName: string;
}
