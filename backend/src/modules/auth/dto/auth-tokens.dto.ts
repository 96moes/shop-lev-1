import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ description: 'Short-lived bearer token for API requests.' })
  accessToken: string;

  @ApiProperty({ description: 'Long-lived token used to obtain a new access token.' })
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Access token lifetime in seconds.' })
  expiresIn: number;
}
