import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ProviderPosition } from '../../dashboard/types/dashboard-care-request';

export class ProviderDto {
  @ApiProperty({
    description: 'The unique identifier of the provider.',
    example: 'unique_id',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'The first (given) name of the provider.',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'The last (family name of the provider.',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'The medical credentials of the provider.',
    example: 'doctor',
  })
  @IsString()
  providerProfileCredentials: string;

  @ApiProperty({
    description: `The shortened URL of the provider's profile photo.`,
    example: '',
  })
  @IsString()
  providerImageTinyUrl: string;

  @ApiProperty({
    description: `The provider's job title.`,
    example: 'virtual doctor',
  })
  @IsString()
  providerProfilePosition: ProviderPosition;
}
