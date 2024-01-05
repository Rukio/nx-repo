import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AbbreviatedState,
  ConsentDefinitionLanguage,
} from '../domain/definition';

export class ConsentDefinitionsQuery {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
  @IsString()
  state: AbbreviatedState;
  @IsArray()
  signerIds: string[];
  @IsNumber()
  serviceLine: number;
  @IsEnum(ConsentDefinitionLanguage)
  languageId: ConsentDefinitionLanguage;
}
