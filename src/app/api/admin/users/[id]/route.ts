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
  deleted_at: string | null;
}

interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'super_admin' | 'editor';
  is_active?: boolean;
}

/**
 * PUT /api/admin/users/[id]
 * Kullanıcıyı güncelle - sadece super_admin için
 * Body parameters:
 * - email: kullanıcı email adresi (optional)
 * - password: yeni şifre (optional, varsa yeniden hash'lenir)
 * - name: kullanıcı adı (optional)
 * - role: kullanıcı rolü (optional, admin, editor)
 * - is_active: aktif durumu (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz kullanıcı ID' },
        { status: 400 }
      );
    }

    // Request body'yi al
    const body: UpdateUserRequest = await request.json();
    const { email, password, name, role, is_active } = body;

    // En az bir alan güncellenmeli
    if (!email && !password && !name && role === undefined && is_active === undefined) {
      return NextResponse.json(
        { success: false, error: 'Güncellenecek en az bir alan belirtilmeli' },
        { status: 400 }
      );
    }

    // Kullanıcının var olup olmadığını kontrol et
    const existingUserQuery = 'SELECT id, email, name, role, is_active FROM users WHERE id = ?';
    const existingUserResult = await db.query<UserRow>(existingUserQuery, [userId]);

    if (existingUserResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const existingUser = existingUserResult.rows[0];

    // Input validation
    let updateFields: string[] = [];
    let updateValues: any[] = [];

    // Email validation
    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { success: false, error: 'Email adresi boş olamaz' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Geçerli bir email adresi giriniz' },
          { status: 400 }
        );
      }

      // Email uniqueness kontrolü (sadece farklı kullanıcılar için)
      if (email !== existingUser.email) {
        const emailCheckQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
        const emailCheckResult = await db.query<RowDataPacket>(emailCheckQuery, [email, userId]);

        if (emailCheckResult.rows.length > 0) {
          return NextResponse.json(
            { success: false, error: 'Bu email adresi zaten kullanılıyor' },
            { status: 409 }
          );
        }
      }

      updateFields.push('email = ?');
      updateValues.push(email);
    }

    // Password validation ve hashing
    if (password !== undefined) {
      if (!password.trim()) {
        return NextResponse.json(
          { success: false, error: 'Şifre boş olamaz' },
          { status: 400 }
        );
      }

      const passwordValidation = validatePasswordComplexity(password);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { success: false, error: passwordValidation.message },
          { status: 400 }
        );
      }

      // Şifreyi yeniden hash'le
      const hashedPassword = await hashPassword(password);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    // Name validation
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { success: false, error: 'İsim boş olamaz' },
          { status: 400 }
        );
      }

      updateFields.push('name = ?');
      updateValues.push(name.trim());
    }

    // Role validation
    if (role !== undefined) {
      if (!['admin', 'editor'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Geçersiz rol - admin veya editor olmalı' },
          { status: 400 }
        );
      }

      updateFields.push('role = ?');
      updateValues.push(role);
    }

    // Active status validation
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'is_active boolean değeri olmalı' },
          { status: 400 }
        );
      }

      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    // Updated timestamp ekle
    updateFields.push('updated_at = NOW()');

    // Update query'yi oluştur ve çalıştır
    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    updateValues.push(userId);

    const updateResult = await db.update(updateQuery, updateValues);

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı güncellenemedi' },
        { status: 500 }
      );
    }

    // Güncellenmiş kullanıcının bilgilerini getir
    const updatedUserQuery = `
      SELECT id, email, name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `;

    const updatedUserResult = await db.query<UserRow>(updatedUserQuery, [userId]);
    const updatedUser = updatedUserResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          is_active: updatedUser.is_active,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at
        }
      },
      message: 'Kullanıcı başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Admin users PUT hatası:', error);

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

/**
 * DELETE /api/admin/users/[id]
 * Kullanıcıyı soft delete ile sil - sadece super_admin için
 * Kullanıcıyı tamamen silmez, deleted_at timestamp'i ekler
 * Ayrıca kullanıcının tüm oturumlarını geçersiz kılar
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz kullanıcı ID' },
        { status: 400 }
      );
    }

    // Kullanıcının var olup olmadığını ve zaten silinip silinmediğini kontrol et
    const existingUserQuery = 'SELECT id, email, name, role, deleted_at FROM users WHERE id = ?';
    const existingUserResult = await db.query<UserRow>(existingUserQuery, [userId]);

    if (existingUserResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const existingUser = existingUserResult.rows[0];

    // Zaten silinmiş kullanıcı kontrolü
    if (existingUser.deleted_at) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı zaten silinmiş' },
        { status: 400 }
      );
    }

    // Kendini silme kontrolü
    const currentUserId = parseInt(session.user.id);
    if (userId === currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      );
    }

    // Transaction ile kullanıcıyı soft delete yap ve oturumları geçersiz kıl
    await db.transaction(async (connection) => {
      // Soft delete - deleted_at timestamp'i ekle
      const softDeleteQuery = `
        UPDATE users
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;

      const deleteResult = await connection.execute(softDeleteQuery, [userId]);

      if ((deleteResult as any).affectedRows === 0) {
        throw new Error('Kullanıcı silinemedi');
      }

      // Kullanıcının tüm aktif oturumlarını sil
      const invalidateSessionsQuery = `
        DELETE FROM sessions
        WHERE user_id = ?
      `;

      await connection.execute(invalidateSessionsQuery, [userId]);
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role
        }
      },
      message: 'Kullanıcı başarıyla silindi ve oturumları geçersiz kılındı'
    });

  } catch (error) {
    console.error('Admin users DELETE hatası:', error);

    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}