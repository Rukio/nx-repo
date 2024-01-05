import { ApiProperty } from '@nestjs/swagger';
import { Note } from '@*company-data-covered*/consumer-web-types';
import UserDto from './user.dto';

export default class NoteDto implements Omit<Note, 'id' | 'careRequestId'> {
  @ApiProperty({
    description: 'Featured',
    example: true,
  })
  featured: boolean;

  @ApiProperty({
    description: 'Note',
    example: 'Some note',
  })
  note: string;

  @ApiProperty({
    description: 'In timeline',
    example: false,
  })
  inTimeline: boolean;

  @ApiProperty({
    description: 'Meta data',
    example: null,
  })
  metaData: Record<string, unknown>;

  @ApiProperty({
    description: 'Type of the note',
    example: 'regular',
  })
  noteType: string;

  @ApiProperty({
    description: 'User',
  })
  user: UserDto;

  @ApiProperty({
    description: 'User id',
    example: 84970,
  })
  userId: number;
}
