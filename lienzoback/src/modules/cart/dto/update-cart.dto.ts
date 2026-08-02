import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class UpdateCartItemDto {
  @IsUUID()
  itemId: string;

  @IsInt()
  @Min(0)
  quantity: number;
}

export class UpdateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCartItemDto)
  updates: UpdateCartItemDto[];
}
