import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Requires a valid bearer access token. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
