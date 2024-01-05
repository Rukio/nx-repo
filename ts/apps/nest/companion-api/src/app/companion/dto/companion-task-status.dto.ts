import { ApiProperty } from '@nestjs/swagger';
import {
  CompanionTaskType,
  CompanionTaskStatus,
  CompanionTask,
  Prisma,
} from '@prisma/client';
import { IsArray, IsDate, IsEnum, IsNumber, IsObject } from 'class-validator';

export type CompanionTaskWithStatuses = CompanionTask & {
  statuses: CompanionTaskStatus[];
};

export class CompanionTaskStatusDto {
  @ApiProperty({ description: 'The unique identifier of task.' })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The task type.',
    enum: CompanionTaskType,
  })
  @IsEnum(CompanionTaskType)
  type: CompanionTaskType;

  @ApiProperty({
    description: 'The current task status id.',
  })
  @IsNumber()
  activeStatusId: number;

  @ApiProperty({
    description: 'The current task status.',
  })
  @IsObject()
  activeStatus: CompanionTaskStatus;

  @ApiProperty({
    description: 'The task status history.',
    isArray: true,
  })
  @IsArray()
  statuses: CompanionTaskStatus[];

  @ApiProperty({
    description: 'The time the status was updated at.',
    example: '2021-07-08T20:39:08.305Z',
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    description: 'Metadata about the task.',
  })
  metadata: Prisma.JsonValue;

  constructor(init?: Partial<CompanionTaskStatusDto>) {
    Object.assign(this, init);
  }

  static fromCompanionTask(
    task: CompanionTaskWithStatuses
  ): CompanionTaskStatusDto {
    const activeStatus = task.statuses.reduce((previous, current) => {
      return previous.createdAt > current.createdAt ? previous : current;
    });

    return {
      id: task.id,
      type: task.type,
      activeStatusId: activeStatus.id,
      activeStatus,
      statuses: task.statuses,
      updatedAt: task.updatedAt,
      metadata: task.metadata,
    };
  }
}
