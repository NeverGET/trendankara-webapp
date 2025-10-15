import { notFound } from 'next/navigation';
import { getNewsBySlug } from '@/lib/db/news';
import { fixMediaUrl } from '@/lib/utils/url-fixer';
import { Metadata } from 'next';

interface NewsDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news) {
    return {
      title: 'Haber Bulunamadı - Trend Ankara'
    };
  }

  const imageUrl = news.featured_image ? fixMediaUrl(news.featured_image) : null;

  return {
    title: `${news.title} - Trend Ankara`,
    description: news.summary || news.title,
    openGraph: {
      title: news.title,
      description: news.summary || news.title,
      images: imageUrl ? [imageUrl] : undefined,
      type: 'article',
      publishedTime: news.published_at || news.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description: news.summary || news.title,
      images: imageUrl ? [imageUrl] : undefined,
    }
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const news = await getNewsBySlug(slug);

  if (!news || !news.is_active || news.deleted_at) {
    notFound();
  }

  const featuredImageUrl = news.featured_image ? fixMediaUrl(news.featured_image) : null;
  const publishDate = new Date(news.published_at || news.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '800px' }}>
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-dark-text-secondary">
            <li>
              <a href="/" className="hover:text-dark-text-primary transition-colors">
                Ana Sayfa
              </a>
            </li>
            <li>/</li>
            <li>
              <a href="/news" className="hover:text-dark-text-primary transition-colors">
                Haberler
              </a>
            </li>
            <li>/</li>
            <li className="text-dark-text-primary">{news.title}</li>
          </ol>
        </nav>

        {/* Article */}
        <article className="bg-dark-bg-secondary rounded-lg overflow-hidden">
          {/* Featured Image */}
          {featuredImageUrl && (
            <div className="w-full aspect-video relative overflow-hidden">
              <img
                src={featuredImageUrl}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Category & Date */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              {news.category_name && (
                <span className="px-3 py-1 bg-dark-accent rounded-full text-white font-medium">
                  {news.category_name}
                </span>
              )}
              <span className="text-dark-text-secondary">{publishDate}</span>
              {news.views > 0 && (
                <span className="text-dark-text-secondary">{news.views} görüntülenme</span>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {news.is_breaking && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                  SON DAKİKA
                </span>
              )}
              {news.is_hot && (
                <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded">
                  GÜNDEM
                </span>
              )}
              {news.is_featured && (
                <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded">
                  ÖNE ÇIKAN
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-dark-text-primary mb-4">
              {news.title}
            </h1>

            {/* Summary */}
            {news.summary && (
              <p className="text-lg text-dark-text-secondary mb-6 leading-relaxed">
                {news.summary}
              </p>
            )}

            {/* Content */}
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:text-dark-text-primary
                prose-p:text-dark-text-secondary
                prose-a:text-dark-accent prose-a:no-underline hover:prose-a:underline
                prose-strong:text-dark-text-primary
                prose-ul:text-dark-text-secondary
                prose-ol:text-dark-text-secondary"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            {/* Author & Meta */}
            <div className="mt-8 pt-6 border-t border-dark-border">
              <div className="flex items-center justify-between text-sm text-dark-text-secondary">
                <div>
                  {news.creator_name && (
                    <span>Yazar: <span className="text-dark-text-primary">{news.creator_name}</span></span>
                  )}
                </div>
                <div>
                  {`Güncelleme: ${new Date(news.updated_at).toLocaleDateString('tr-TR')}`}
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Back Button */}
        <div className="mt-8">
          <a
            href="/news"
            className="inline-flex items-center gap-2 px-4 py-2 bg-dark-bg-secondary text-dark-text-primary rounded-lg hover:bg-dark-bg-tertiary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Haberlere Dön
          </a>
        </div>
      </div>
    </div>
  );
}
