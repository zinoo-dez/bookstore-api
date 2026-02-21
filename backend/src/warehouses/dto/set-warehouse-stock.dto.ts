import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class SetWarehouseStockDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  lowStockThreshold?: number;
}
