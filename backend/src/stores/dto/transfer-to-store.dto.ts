import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TransferToStoreDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromWarehouseId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toStoreId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
