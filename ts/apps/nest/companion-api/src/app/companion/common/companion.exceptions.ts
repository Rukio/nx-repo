import { NotFoundException } from '@nestjs/common';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from './companion.constants';

export class CompanionLinkNotFoundException extends NotFoundException {
  constructor() {
    super(COMPANION_LINK_NOT_FOUND_ERROR_TEXT);
  }
}
