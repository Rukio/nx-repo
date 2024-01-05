import CareRequestDto from '../../care-request/dto/care-request.dto';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export default class UpdateCareRequestDto extends CareRequestDto {
  @ApiHideProperty()
  @Exclude()
  id?: number;
}
