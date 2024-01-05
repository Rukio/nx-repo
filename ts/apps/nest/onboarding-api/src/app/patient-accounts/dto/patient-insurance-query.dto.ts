import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class PatientAccountsInsuranceQueryDto {
  @ApiProperty({
    description: 'Patient ID',
    example: '407474',
  })
  @IsString()
  patientId: string;
}
