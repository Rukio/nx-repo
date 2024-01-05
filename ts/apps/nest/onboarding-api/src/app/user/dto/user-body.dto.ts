import { ApiProperty } from '@nestjs/swagger';
import { User, Role } from '@*company-data-covered*/consumer-web-types';

export default class UserBodyDto implements User {
  @ApiProperty({
    description: 'User id',
    example: 34324,
  })
  id?: number;

  @ApiProperty({
    description: 'User email',
    example: 'example@mail.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'test',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'test',
  })
  lastName: string;

  @ApiProperty({
    description: 'User phone no',
    example: '30232323242',
  })
  mobileNumber: string;

  @ApiProperty({
    description: 'contact agent id',
    example: '',
  })
  inContactAgentId: string | number;

  @ApiProperty({
    description: 'User alias',
    example: null,
  })
  alias: string;

  @ApiProperty({
    description: 'User genesys id',
    example: '2212312',
  })
  genesysId: string | number;

  @ApiProperty({
    description: 'User genesys token',
    example: '',
  })
  genesysToken: string | number;

  @ApiProperty({
    description: 'User employee id',
    example: '',
  })
  hrEmployeeId: string;

  @ApiProperty({
    description: 'User rolesd',
    isArray: true,
    example: [
      {
        id: 1,
        name: 'user',
      },
      {
        id: 3,
        name: 'developer',
      },
    ],
  })
  roles: Role[];
}
