import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpsertRolePermissionsDto {
  @ApiProperty({
    type: [String],
    example: ['warehouse.view', 'warehouse.stock.update'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionKeys!: string[];
}
