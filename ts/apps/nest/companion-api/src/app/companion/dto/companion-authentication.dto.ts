import { PickType } from '@nestjs/swagger';
import { PatientDto } from '../../care-request/dto/care-request.dto';

export class CompanionAuthenticationDto extends PickType(PatientDto, ['dob']) {}
