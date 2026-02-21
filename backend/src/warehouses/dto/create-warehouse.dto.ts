import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Northeast Distribution Center' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'NE-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'Boston' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city!: string;

  @ApiProperty({ example: 'MA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  state!: string;

  @ApiPropertyOptional({ example: '12 Example St, Boston, MA' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
