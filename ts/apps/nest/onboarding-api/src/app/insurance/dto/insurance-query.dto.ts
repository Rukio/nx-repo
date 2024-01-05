import { ApiProperty } from '@nestjs/swagger';

export default class InsuranceQueryDto {
  @ApiProperty({
    description: 'Patient ID',
    example: '407474',
  })
  patientId: number | string;

  @ApiProperty({
    description: 'Care Request ID for checking eligibility',
    example: '655821',
    required: false,
  })
  careRequestId: number | string;

  @ApiProperty({
    description: 'Market ID for checking eligibility',
    example: '159',
    required: false,
  })
  marketId: number | string;
}
