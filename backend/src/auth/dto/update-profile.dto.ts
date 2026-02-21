import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name?: string;

  @ApiPropertyOptional({
    description: 'Avatar type',
    enum: ['emoji', 'upload'],
    example: 'emoji',
  })
  @IsOptional()
  @IsString()
  avatarType?: string;

  @ApiPropertyOptional({
    description: 'Selected avatar value (emoji char or image URL)',
    example: 'avatar-1',
  })
  @IsOptional()
  @IsString()
  avatarValue?: string;

  @ApiPropertyOptional({
    description: 'Selected background color class',
    example: 'bg-blue-500',
  })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Pronouns shown on profile',
    example: 'she/her',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  pronouns?: string;

  @ApiPropertyOptional({
    description: 'Short bio shown on profile cards',
    example: 'Reader, writer, and software engineer.',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  shortBio?: string;

  @ApiPropertyOptional({
    description: 'Long-form about section',
    example: 'I write about books, product design, and developer life.',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  about?: string;

  @ApiPropertyOptional({
    description: 'Profile cover image URL',
    example: 'https://images.example.com/covers/user-1.jpg',
    maxLength: 2048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImage?: string;
}
