import { InformedRequestor } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import InformedQuestionResponseDto from './informer-requestor-answers.dto';

export default class InformedRequestorDto implements InformedRequestor {
  @ApiProperty({
    description: 'The unique identifier of the care request.',
    example: 657383,
  })
  careRequestId: number;

  @ApiProperty({
    description: 'The phone number of the contact person',
    example: '3035001518',
  })
  contactPhone: string;

  @ApiProperty({
    description: 'The first name of the contact person',
    example: 'Joe',
  })
  contactFirstName: string;

  @ApiProperty({
    description: 'The last name of the contact person',
    example: 'Jones',
  })
  contactLastName: string;

  @ApiProperty({
    description: 'The responses',
    example: {
      questions: [
        {
          question: 'Are you currently with the patient?',
          answer: 'No',
        },
        {
          question:
            'Are you a Physician, Advanced Practice Provider, or a Registered Nurse?',
          answer: 'No',
        },
        {
          question:
            'Do you know this patient’s current medical condition well enough to answer a medical screening questionnaire?',
          answer: 'No',
        },
      ],
    },
  })
  response: { questions: InformedQuestionResponseDto[] };
}
