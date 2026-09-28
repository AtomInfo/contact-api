import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ContactStatus } from '../entities/contact.entity';

export const CONTACT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'email',
  'status',
  'applicationId',
] as const;

export const CONTACT_SORT_ORDERS = ['asc', 'desc'] as const;

export type ContactSortField = (typeof CONTACT_SORT_FIELDS)[number];
export type ContactSortOrder = (typeof CONTACT_SORT_ORDERS)[number];

export class ListContactsQueryDto {
  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(CONTACT_SORT_FIELDS)
  sortBy?: ContactSortField;

  @IsOptional()
  @IsIn(CONTACT_SORT_ORDERS)
  order?: ContactSortOrder;
}
