import { NextRequest, NextResponse } from 'next/server';
import {
  getPublishedPages,
  getHomepage,
  getContentPageBySlug,
  trackPageView
} from '@/lib/db/content-pages';
import { fixMediaUrlsInObject } from '@/lib/utils/url-fixer';

/**
 * GET /api/mobile/v1/content/pages
 * Get published content pages for mobile app
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const isHomepage = searchParams.get('homepage');

    // Get homepage if requested
    if (isHomepage === 'true') {
      const homepage = await getHomepage();

      if (!homepage) {
        return NextResponse.json({
          success: false,
          error: 'No homepage configured'
        }, { status: 404 });
      }

      // Track page view
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');
      const referrer = request.headers.get('referer');

      await trackPageView((homepage as any).id, {
        ip_address: ip || undefined,
        user_agent: userAgent || undefined,
        referrer: referrer || undefined
      });

      return NextResponse.json({
        success: true,
        data: fixMediaUrlsInObject({
          id: (homepage as any).id,
          title: (homepage as any).title,
          slug: (homepage as any).slug,
          description: (homepage as any).description,
          components: (homepage as any).components,
          meta: (homepage as any).meta,
          is_homepage: true,
          updated_at: (homepage as any).updated_at
        })
      });
    }

    // Get specific page by slug
    if (slug) {
      const page = await getContentPageBySlug(slug);

      if (!page || !(page as any).is_published) {
        return NextResponse.json({
          success: false,
          error: 'Page not found'
        }, { status: 404 });
      }

      // Track page view
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');
      const referrer = request.headers.get('referer');

      await trackPageView((page as any).id, {
        ip_address: ip || undefined,
        user_agent: userAgent || undefined,
        referrer: referrer || undefined
      });

      return NextResponse.json({
        success: true,
        data: fixMediaUrlsInObject({
          id: (page as any).id,
          title: (page as any).title,
          slug: (page as any).slug,
          description: (page as any).description,
          components: (page as any).components,
          meta: (page as any).meta,
          is_homepage: (page as any).is_homepage,
          updated_at: (page as any).updated_at
        })
      });
    }

    // Get all published pages
    const pages = await getPublishedPages();

    return NextResponse.json({
      success: true,
      data: pages.map((page: any) => fixMediaUrlsInObject({
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
        meta: page.meta,
        is_homepage: page.is_homepage,
        updated_at: page.updated_at
      }))
    });

  } catch (error) {
    console.error('Error in mobile content pages GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}