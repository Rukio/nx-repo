import { Injectable, PipeTransform } from '@nestjs/common';
import { CompanionLinkNotFoundException } from '.';
import { CompanionService } from '../companion.service';

@Injectable()
export class ParseLinkPipe implements PipeTransform {
  constructor(private companionService: CompanionService) {}

  async transform(linkId: string) {
    const link = await this.companionService.findLinkById(linkId);

    if (!link) {
      throw new CompanionLinkNotFoundException();
    }

    return link;
  }
}
