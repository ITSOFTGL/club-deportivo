import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  IsEmail,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  customization?: string;
}

export class CreateOrderDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsString()
  @IsEmail()
  buyerEmail!: string;

  @IsString()
  buyerName!: string;

  @IsString()
  buyerPhone!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  pickupBranchId?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsIn(['PAY', 'RESERVE'])
  mode?: 'PAY' | 'RESERVE';

  @IsOptional()
  @IsString()
  notes?: string;
}
