import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, checkRole } from '@/lib/auth/utils';
import { db } from '@/lib/db/client';
import { hashPassword, validatePasswordComplexity } from '@/lib/auth/password';
import type { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserListResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/admin/users
 * Kullanıcı listesini getir - sadece super_admin için
 * Query parameters:
 * - page: sayfa numarası (varsayılan: 1)
 * - limit: sayfa başına kayıt sayısı (varsayılan: 20, max: 100)
 * - role: role'e göre filtrele (admin, editor, super_admin)
 * - active: aktif duruma göre filtrele (true, false)
 * - search: email veya isme göre arama
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication gerekli
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Super admin rolü kontrolü
    if (!checkRole(session, 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Yetersiz yetki - sadece super admin erişebilir' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Pagination parametreleri
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Filtering parametreleri
    const roleFilter = searchParams.get('role');
    const activeFilter = searchParams.get('active');
    const searchTerm = searchParams.get('search');

    // WHERE koşulları oluştur
    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Role filtresi
    if (roleFilter && ['admin', 'editor', 'super_admin'].includes(roleFilter)) {
      whereConditions.push('role = ?');
      queryParams.push(roleFilter);
    }

    // Active filtresi
    if (activeFilter !== null) {
      whereConditions.push('is_active = ?');
      queryParams.push(activeFilter === 'true');
    }

    // Arama terimi
    if (searchTerm && searchTerm.trim()) {
      whereConditions.push('(email LIKE ? OR name LIKE ?)');
      const searchPattern = `%${searchTerm.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Toplam kayıt sayısını al
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const countResult = await db.query<RowDataPacket>(countQuery, queryParams);
    const totalCount = countResult.rows[0]?.total || 0;

    // Kullanıcıları getir
    const usersQuery = `
      SELECT
        id,
        email,
        name,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const usersResult = await db.query<UserRow>(
      usersQuery,
      [...queryParams, limit, offset]
    );

    // Response formatı
    const users: UserListResponse[] = usersResult.rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    // Pagination bilgileri
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
          startIndex: offset + 1,
          endIndex: Math.min(offset + limit, totalCount)
        },
        filters: {
          role: roleFilter,
          active: activeFilter,
          search: searchTerm
        }
      },
      message: `${users.length} kullanıcı listelendi`
    });

  } catch (error) {
    console.error('Admin users GET hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Yeni kullanıcı oluştur - sadece super_admin için
 * Body parameters:
 * - email: kullanıcı email adresi (unique)
 * - password: kullanıcı şifresi
 * - name: kullanıcı adı
 * - role: kullanıcı rolü (admin, editor)
 * - is_active: aktif durumu (varsayılan: true)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication gerekli
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Super admin rolü kontrolü
    if (!checkRole(session, 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Yetersiz yetki - sadece super admin erişebilir' },
        { status: 403 }
      );
    }

    // Request body'yi al
    const body = await request.json();
    const { email, password, name, role = 'editor', is_active = true } = body;

    // Input validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, şifre ve isim gerekli' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      );
    }

    // Role validation
    if (!['admin', 'editor'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz rol - admin veya editor olmalı' },
        { status: 400 }
      );
    }

    // Password validation
    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Email uniqueness kontrolü
    const existingUserQuery = 'SELECT id FROM users WHERE email = ?';
    const existingUserResult = await db.query<RowDataPacket>(existingUserQuery, [email]);

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu email adresi zaten kullanılıyor' },
        { status: 409 }
      );
    }

    // Şifreyi hash'le
    const hashedPassword = await hashPassword(password);

    // Kullanıcıyı oluştur
    const insertQuery = `
      INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const insertResult = await db.query(
      insertQuery,
      [email, hashedPassword, name, role, is_active]
    );

    // Yeni kullanıcının bilgilerini getir
    const newUserQuery = `
      SELECT id, email, name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `;

    const newUserResult = await db.query<UserRow>(
      newUserQuery,
      [insertResult.insertId]
    );

    const newUser = newUserResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          is_active: newUser.is_active,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        }
      },
      message: 'Kullanıcı başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Admin users POST hatası:', error);

    // Duplicate entry hatası için özel mesaj
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      return NextResponse.json(
        { success: false, error: 'Bu email adresi zaten kullanılıyor' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}