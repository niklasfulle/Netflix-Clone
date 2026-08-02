import type { CatalogItemDto } from '@/hooks/catalog/useCatalogQuery';
import type { UserRole } from '@prisma/client';

export interface ProfileDto {
  id: string;
  userId?: string;
  name?: string;
  image?: string | null;
  profilName?: string;
  inUse?: boolean;
  favoriteIds?: string[];
  createdAt?: string;
}

export interface PlaylistDto {
  id?: string;
  userId?: string;
  profilId?: string;
  title?: string;
  name?: string;
  movies?: CatalogItemDto[];
  createdAt?: string | Date;
}

export interface ProfileImageDto {
  url: string;
}

export interface CurrentUserDto {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
  isTwoFactorEnabled?: boolean;
  oauth?: boolean;
  isOAuth?: boolean;
}

export interface SettingsDto {
  user?: CurrentUserDto;
  profilName?: string;
}

export interface SessionDto {
  user?: CurrentUserDto;
}
