import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
