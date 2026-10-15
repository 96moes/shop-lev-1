import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryReviewsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شماره صفحه باید یک عدد صحیح باشد' })
  @Min(1, { message: 'شماره صفحه کمتر از حد مجاز است' })
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد در هر صفحه باید یک عدد صحیح باشد' })
  @Min(1, { message: 'تعداد در هر صفحه کمتر از حد مجاز است' })
  @Max(50, { message: 'تعداد در هر صفحه بیشتر از حد مجاز است' })
  limit?: number;
}
