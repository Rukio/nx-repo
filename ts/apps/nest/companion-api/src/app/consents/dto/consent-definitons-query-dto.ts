import { Transform, TransformFnParams } from 'class-transformer';
import { IsNumberString, IsOptional } from 'class-validator';

export class ConsentDefinitionsQueryDto {
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value === 'true')
  incomplete?: boolean;

  @IsNumberString()
  signerId: string;
}
