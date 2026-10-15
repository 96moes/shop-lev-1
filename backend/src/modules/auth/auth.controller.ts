import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { User } from '../../database/entities/user.entity.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { AuthTokensDto } from './dto/auth-tokens.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { UpdateProfileDto } from '../users/dto/update-profile.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthUser } from './auth.types.js';

/** Registration and login responses pair the safe user with a token set. */
class AuthResultDto {
  user: UserResponseDto;
  tokens: AuthTokensDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a customer account and sign in.' })
  @ApiResponse({ status: 201, type: AuthResultDto })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async register(@Body() dto: CreateUserDto): Promise<AuthResultDto> {
    const { user, tokens } = await this.authService.register(dto);
    return { user: await this.toResponse(user), tokens };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Exchange credentials for a token pair.' })
  @ApiResponse({ status: 200, type: AuthResultDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() dto: LoginDto): Promise<AuthResultDto> {
    const { user, tokens } = await this.authService.login(
      dto.email,
      dto.password,
    );
    return { user: await this.toResponse(user), tokens };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token into a new token pair.' })
  @ApiResponse({ status: 200, type: AuthResultDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResultDto> {
    const { user, tokens } = await this.authService.refresh(dto.refreshToken);
    return { user: await this.toResponse(user), tokens };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the stored refresh token.' })
  async logout(@CurrentUser() user: AuthUser): Promise<void> {
    await this.authService.logout(user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated user.' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid token.' })
  profile(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.toResponseById(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the authenticated user’s profile.' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    await this.usersService.updateProfile(user.id, dto);
    return this.toResponseById(user.id);
  }

  /** Re-reads the user so the response reflects stored values, not token claims. */
  private async toResponse(user: User): Promise<UserResponseDto> {
    return this.toResponseById(user.id);
  }

  private async toResponseById(id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findPublicById(id);
    return user as UserResponseDto;
  }
}
