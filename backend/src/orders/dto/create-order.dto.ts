import { IsString, IsOptional, IsNumber, IsArray, Min, IsEmail, IsUrl } from 'class-validator';

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
}