import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SetStoreStockDto {
  @ApiProperty({ example: 24 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(1)
  lowStockThreshold: number = 5;
}
