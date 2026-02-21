import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Weekend Flash Sale' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Up to 35% off selected titles this weekend only.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;

  @ApiPropertyOptional({ example: '/books?sortBy=price&sortOrder=asc' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  link?: string;
}
