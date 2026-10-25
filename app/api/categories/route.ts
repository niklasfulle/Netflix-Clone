import { Prisma } from '@prisma/client';

import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { adminMutationAudit } from '@/lib/admin-mutation-audit';
import { ApiError, handleApiError } from '@/lib/api-helpers';
import { CategoryCreateSchema, CategoryUpdateSchema } from '@/lib/category-validation';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function categoryBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError('VALIDATION_ERROR', 'Invalid request.');
  }
}

async function runCategoryRoute(
  operation: () => Promise<Response>,
  audit?: ReturnType<typeof adminMutationAudit.begin>,
) {
  try {
    if (!(await isCurrentUserAdmin())) {
      await audit?.denied();
      throw new ApiError('FORBIDDEN', 'Administrator access required.');
    }
    return await operation();
  } catch (error) {
    await audit?.failed();
    if (error instanceof SyntaxError) {
      return handleApiError(new ApiError('VALIDATION_ERROR', 'Invalid request.'), 'api_categories');
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return handleApiError(new ApiError('CONFLICT', 'This category already exists.'), 'api_categories');
      if (error.code === 'P2025') return handleApiError(new ApiError('NOT_FOUND', 'Category not found.'), 'api_categories');
    }
    return handleApiError(error, 'api_categories');
  }
}

export async function GET() {
  return runCategoryRoute(async () => {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, nameEn: true, _count: { select: { movies: true } } },
    });
    return Response.json({ categories: categories.map(({ id, name, nameEn, _count }) => ({ id, name, nameEn, contentCount: _count.movies })) }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  });
}

export async function POST(request: Request) {
  const audit = adminMutationAudit.begin('category.create');
  return runCategoryRoute(async () => {
    const parsed = CategoryCreateSchema.safeParse(await categoryBody(request));
    if (!parsed.success) throw new ApiError('VALIDATION_ERROR', 'Use a category name between 1 and 80 characters.');
    const { name, nameEn } = parsed.data;
    const category = await db.category.create({ data: { name, nameEn, normalizedName: name.toLowerCase() } });
    await audit.succeeded({ target: { type: 'category', id: category.id } });
    return Response.json(category, { status: 201 });
  }, audit);
}

export async function PATCH(request: Request) {
  const audit = adminMutationAudit.begin('category.update');
  return runCategoryRoute(async () => {
    const parsed = CategoryUpdateSchema.safeParse(await categoryBody(request));
    if (!parsed.success) throw new ApiError('VALIDATION_ERROR', 'Use a category name between 1 and 80 characters.');
    const { id, name, nameEn } = parsed.data;
    const category = await db.category.update({ where: { id }, data: { name, nameEn, normalizedName: name.toLowerCase() } });
    await audit.succeeded({ target: { type: 'category', id }, metadata: { changedFields: ['name', 'nameEn'] } });
    return Response.json(category);
  }, audit);
}

export async function DELETE(request: Request) {
  const audit = adminMutationAudit.begin('category.delete');
  return runCategoryRoute(async () => {
    const id = new URL(request.url).searchParams.get('id');
    if (!id || id.length > 191) throw new ApiError('VALIDATION_ERROR', 'Category ID is required.');
    await db.category.delete({ where: { id } });
    await audit.succeeded({ target: { type: 'category', id } });
    return Response.json({ success: true });
  }, audit);
}
