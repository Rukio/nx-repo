import { ProviderProfileLicense } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export default class ProviderProfileLicenseDto
  implements ProviderProfileLicense
{
  @ApiProperty({
    description: 'Provider profile license ID',
    example: 77,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Provider profile license number',
    example: '10089',
  })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    description: 'Provider profile license state',
    example: 'CO',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Provider profile license expiration',
    example: '2022-09-01',
  })
  @IsString()
  expiration: string;
}
