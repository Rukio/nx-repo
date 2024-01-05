import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiTooManyRequestsResponse,
  ApiOperation,
  ApiBody,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiGoneResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../companion/common/companion.constants';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { ApiTagsText } from '../swagger';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { ClinicalProviderSearchDto } from './dto/clinical-provider-search.dto';
import { ClinicalProvidersRepository } from './clinical-providers.repository';
import { ClinicalProviderSearchResponseDto } from './dto/clinical-provider-response.dto';

@Controller()
@ApiTags(ApiTagsText.ClinicalProviders)
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class ClinicalProvidersController {
  constructor(private repository: ClinicalProvidersRepository) {}

  @Post()
  @ApiCompanionLinkIdParam()
  @ApiOperation({
    summary: `Clinical provider search endpoint.`,
  })
  @ApiBody({
    type: ClinicalProviderSearchDto,
  })
  @ApiNotFoundResponse({
    description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT,
  })
  @ApiOkResponse({
    description: `List of clinical providers.`,
    type: ClinicalProviderSearchResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  async searchClinicalProviders(@Body() dto: ClinicalProviderSearchDto) {
    const clinicalProvider = dto.clinicalProvider;

    const { firstName, lastName, entityName, phone, zip } = clinicalProvider;

    const isValidPhoneSearch = !!phone;
    const isValidEntitySearch = !!entityName && !!zip;
    const isValidPersonSearch = !!firstName && !!lastName && !!zip;

    if (!isValidEntitySearch && !isValidPersonSearch && !isValidPhoneSearch) {
      throw new BadRequestException(
        'Invalid search parameters. For person search, provide both firstName and lastName. For entity search, provide only entityName. For phone search, only phone is required.'
      );
    }

    return this.repository.searchClinicalProviders(clinicalProvider);
  }
}
