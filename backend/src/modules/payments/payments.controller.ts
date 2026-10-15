import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Payment } from '../../database/entities/payment.entity.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PaymentResultDto } from './dto/payment-result.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a payment for one of your orders and record the transaction.',
  })
  verify(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyPaymentDto,
  ): Promise<PaymentResultDto> {
    return this.paymentsService.verify(user.id, dto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'List payments recorded against your order.' })
  listForOrder(
    @CurrentUser() user: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<Payment[]> {
    return this.paymentsService.listForOrder(user.id, orderId);
  }
}
