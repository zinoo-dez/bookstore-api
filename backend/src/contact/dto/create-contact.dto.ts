import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { ContactType } from '@prisma/client';

export class CreateContactDto {
  @ApiProperty({ enum: ContactType })
  @IsEnum(ContactType)
  type!: ContactType;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Order issue' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'My message...' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
