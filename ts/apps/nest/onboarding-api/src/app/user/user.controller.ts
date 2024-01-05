import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  User,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import UserBodyDto from './dto/user-body.dto';
import UserQueryDto from './dto/user-query.dto';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import UserService from './user.service';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';

@Controller('users')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.User)
@ApiBearerAuth()
export default class UserController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: UserService
  ) {}

  @Get('/me')
  @ApiQuery({
    type: UserQueryDto,
    description: 'The data needed to get user',
  })
  @ApiOperation({
    summary: 'Get current authenticated user information',
  })
  @ApiOkResponse({
    type: UserBodyDto,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetch(
    @Query() query: UserQueryDto
  ): Promise<CareRequestAPIResponse<User>> {
    try {
      const { email } = query;
      const data: User = await this.service.fetch(email);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`UserController error: ${error?.message}`, query);

      return ErrorResponse(error);
    }
  }
}
