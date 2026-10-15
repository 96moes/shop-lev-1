import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import {
  Coupon,
  DiscountType,
} from '../../database/entities/coupon.entity.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';
import { formatMoney } from '../../common/currency.js';

export interface CouponEvaluation {
  coupon: Coupon | null;
  valid: boolean;
  reason: string | null;
  discount: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}

  findAll(): Promise<Coupon[]> {
    return this.couponsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('کد تخفیف یافت نشد');
    }
    return coupon;
  }

  /**
   * Applies the eligibility rules to a coupon and computes the discount.
   *
   * Shared by the public validation endpoint and order checkout so the two can
   * never disagree about whether a code is usable. Reasons are written in
   * Persian because they are surfaced directly to the customer at checkout.
   */
  evaluate(
    coupon: Coupon | null,
    subtotal: number,
    now: Date = new Date(),
  ): CouponEvaluation {
    if (!coupon) {
      return { coupon: null, valid: false, reason: 'این کد تخفیف معتبر نیست', discount: 0 };
    }
    if (!coupon.isActive) {
      return { coupon, valid: false, reason: 'این کد تخفیف دیگر فعال نیست', discount: 0 };
    }
    if (coupon.startsAt && coupon.startsAt > now) {
      return { coupon, valid: false, reason: 'این کد تخفیف هنوز فعال نشده است', discount: 0 };
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { coupon, valid: false, reason: 'این کد تخفیف منقضی شده است', discount: 0 };
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return {
        coupon,
        valid: false,
        reason: 'این کد تخفیف به سقف تعداد استفاده رسیده است',
        discount: 0,
      };
    }

    const minOrder = Number(coupon.minOrderAmount);
    if (subtotal < minOrder) {
      return {
        coupon,
        valid: false,
        reason: `این کد تخفیف برای سفارش‌های بالای ${formatMoney(minOrder)} است`,
        discount: 0,
      };
    }

    const value = Number(coupon.discountValue);
    let discount =
      coupon.discountType === DiscountType.PERCENTAGE
        ? round2((subtotal * value) / 100)
        : round2(value);

    if (coupon.maxDiscountAmount !== null) {
      discount = Math.min(discount, Number(coupon.maxDiscountAmount));
    }
    // A discount can never exceed the order or make it negative.
    discount = Math.min(discount, subtotal);

    return { coupon, valid: true, reason: null, discount: round2(discount) };
  }

  /** Looks up by code and evaluates in one step. */
  async evaluateCode(code: string, subtotal: number): Promise<CouponEvaluation> {
    const coupon = await this.couponsRepository.findOne({
      where: { code: code.trim().toUpperCase() },
    });
    return this.evaluate(coupon, subtotal);
  }

  /**
   * Evaluates a code using a transaction's entity manager, so checkout sees a
   * consistent view of `usedCount` inside its transaction.
   */
  async evaluateCodeWithManager(
    manager: EntityManager,
    code: string,
    subtotal: number,
  ): Promise<CouponEvaluation> {
    const coupon = await manager.findOne(Coupon, {
      where: { code: code.trim().toUpperCase() },
    });
    return this.evaluate(coupon, subtotal);
  }

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.couponsRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`کد تخفیف «${code}» از قبل وجود دارد`);
    }

    const coupon = this.couponsRepository.create({
      code,
      description: dto.description ?? null,
      discountType: dto.discountType,
      discountValue: dto.discountValue.toFixed(2),
      minOrderAmount: (dto.minOrderAmount ?? 0).toFixed(2),
      maxDiscountAmount:
        dto.maxDiscountAmount === undefined
          ? null
          : dto.maxDiscountAmount.toFixed(2),
      usageLimit: dto.usageLimit ?? null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
    });

    return this.couponsRepository.save(coupon);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findById(id);

    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();
      if (code !== coupon.code) {
        const clash = await this.couponsRepository.findOne({ where: { code } });
        if (clash) throw new ConflictException(`کد تخفیف «${code}» از قبل وجود دارد`);
        coupon.code = code;
      }
    }

    if (dto.description !== undefined) coupon.description = dto.description ?? null;
    if (dto.discountType !== undefined) coupon.discountType = dto.discountType;
    if (dto.discountValue !== undefined) {
      coupon.discountValue = dto.discountValue.toFixed(2);
    }
    if (dto.minOrderAmount !== undefined) {
      coupon.minOrderAmount = dto.minOrderAmount.toFixed(2);
    }
    if (dto.maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount =
        dto.maxDiscountAmount === null ? null : dto.maxDiscountAmount.toFixed(2);
    }
    if (dto.usageLimit !== undefined) coupon.usageLimit = dto.usageLimit ?? null;
    if (dto.startsAt !== undefined) {
      coupon.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    }
    if (dto.expiresAt !== undefined) {
      coupon.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    if (dto.isActive !== undefined) coupon.isActive = dto.isActive;

    return this.couponsRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findById(id);
    await this.couponsRepository.remove(coupon);
  }
}
