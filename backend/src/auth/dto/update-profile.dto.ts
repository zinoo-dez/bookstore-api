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
}
