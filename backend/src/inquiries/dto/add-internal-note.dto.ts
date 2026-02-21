import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddInternalNoteDto {
  @ApiProperty({
    example:
      'Customer provided valid invoice, waiting for finance confirmation.',
  })
  @IsString()
  @IsNotEmpty()
  note!: string;
}
