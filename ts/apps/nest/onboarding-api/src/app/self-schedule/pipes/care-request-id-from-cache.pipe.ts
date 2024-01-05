import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { OSSUserCache } from '@*company-data-covered*/consumer-web-types';

@Injectable()
export class CareRequestIdFromCachePipe implements PipeTransform {
  transform(userCache: OSSUserCache | null) {
    if (!userCache) {
      throw new NotFoundException('User cache is empty');
    }

    const { careRequestId } = userCache;

    if (!careRequestId) {
      throw new NotFoundException('No care request ID in self schedule cache');
    }

    return careRequestId;
  }
}
