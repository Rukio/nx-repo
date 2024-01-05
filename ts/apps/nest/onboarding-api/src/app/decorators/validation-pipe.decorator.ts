import { applyDecorators, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiUnprocessableEntityResponse } from '@nestjs/swagger';

/**
 * Decorator for using the NestJS ValidationPipe.
 *
 * Handles adding the pipe and documentation for validation errors.
 */
export function UseValidationPipe() {
  return applyDecorators(
    UsePipes(ValidationPipe),
    ApiUnprocessableEntityResponse({ description: 'Validation failed.' })
  );
}
