import { ApiProperty } from '@nestjs/swagger';
import { Requester } from '@*company-data-covered*/consumer-web-types';

export default class RequesterDto implements Requester {
  @ApiProperty({
    description: 'id of existing requester',
    example: '3422',
  })
  id?: number;

  @ApiProperty({
    description: 'Relation to patient',
    example: 'patient',
  })
  relationToPatient: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'requester origin phone',
    example: '3035001518',
  })
  phone: string;

  @ApiProperty({
    description: 'Dispatch health phone',
    example: '1023567434',
  })
  dhPhone: string;

  @ApiProperty({
    description: 'the conversation id of the requester',
    example: '12342',
  })
  conversationId: string;
}
