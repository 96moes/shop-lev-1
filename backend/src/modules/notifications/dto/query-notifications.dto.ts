import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class QueryNotificationsDto {
  @ApiPropertyOptional({ description: 'Return only unread notifications.' })
  @IsOptional()
  // Query params arrive as strings; accept "true"/"1".
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean({ message: 'فقط خوانده‌نشده‌ها باید درست یا غلط باشد' })
  unreadOnly?: boolean;
}
