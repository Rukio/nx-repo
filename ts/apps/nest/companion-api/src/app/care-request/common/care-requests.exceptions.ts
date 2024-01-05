import { NotFoundException } from '@nestjs/common';

export class CareRequestNotFoundException extends NotFoundException {
  constructor(id: number) {
    super(`Care request not found with ID: ${id}`);
  }
}
