import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { parseBooleanQueryValue } from '../../common/transforms/parse-boolean-query-value';

export class DiscountCodesFilterDto {
  @IsOptional()
  @IsString()
  partialCode?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(parseBooleanQueryValue)
  isActive?: boolean;
}
