import { ApiProperty } from '@nestjs/swagger';
import { CompanionTaskStatusName } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTaskStatusDto {
  @ApiProperty({
    description: 'The new status name for the task.',
    enum: CompanionTaskStatusName,
  })
  @IsEnum(CompanionTaskStatusName)
  statusName: CompanionTaskStatusName;
}
