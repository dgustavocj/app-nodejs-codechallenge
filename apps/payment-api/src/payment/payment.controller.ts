import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreatePaymentDto, PaymentResponseDto } from '@app/shared';
import { PaymentService } from './payment.service';
import { PaymentMapper } from './payment.mapper';

@Controller('transactions')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<PaymentResponseDto> {
    const correlationId = (req.headers['x-correlation-id'] ?? '') as string;
    const payment = await this.paymentService.createPayment(dto, correlationId);
    return PaymentMapper.toResponse(payment);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.findPayment(id);
    return PaymentMapper.toResponse(payment);
  }
}
