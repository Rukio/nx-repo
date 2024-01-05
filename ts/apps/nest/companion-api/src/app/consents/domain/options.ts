import { Expose } from 'class-transformer';

export interface Option {
  id: number;
  order: number;
  name: string;
}

export interface RequirableOption extends Option {
  required: boolean;
}

export class Options {
  @Expose()
  signers: Option[];

  @Expose()
  languages: Option[];

  @Expose()
  frequencies: Option[];

  @Expose()
  categories: RequirableOption[];

  @Expose({ name: 'capture_methods', toPlainOnly: true })
  captureMethods: Option[];
}
