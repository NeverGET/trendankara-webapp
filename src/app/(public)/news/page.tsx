'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { NewsGrid } from '@/components/news/NewsGrid';
import { NewsModal } from '@/components/news/NewsModal';
import { Button } from '@/components/ui/button';
import { getNews, getNewsByCategory, getNewsArticle } from '@/lib/api/news';
import { NewsArticle, NewsCategory } from '@/types/news';

const categories: { value: NewsCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tümü' },
  { value: 'MAGAZINE', label: 'Magazin' },
  { value: 'ARTIST', label: 'Sanatçı' },
  { value: 'ALBUM', label: 'Albüm' },
  { value: 'CONCERT', label: 'Konser' },
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'ALL'>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadNews = useCallback(async (pageNum: number, reset: boolean = false) => {
    setLoading(true);
    try {
      const response = selectedCategory === 'ALL'
        ? await getNews(pageNum, 9)
        : await getNewsByCategory(selectedCategory, pageNum, 9);

      if (reset) {
        setArticles(response?.articles || []);
      } else {
        setArticles(prev => [...prev, ...(response?.articles || [])]);
      }
      setHasMore(response?.pagination?.hasNext || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadNews(1, true);
  }, [loadNews]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNews(page + 1, false);
    }
  };

  const handleCategoryChange = (category: NewsCategory | 'ALL') => {
    setSelectedCategory(category);
    setPage(1);
    setArticles([]);
  };

  const handleArticleClick = async (id: number) => {
    const article = await getNewsArticle(id);
    if (article) {
      setSelectedArticle(article);
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1024px' }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-text-primary mb-4">Haberler</h1>
          <p className="text-dark-text-secondary">
            Müzik dünyasından en güncel haberler ve duyurular.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'secondary'}
              size="sm"
              onClick={() => handleCategoryChange(category.value)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* News Grid */}
        <NewsGrid
          articles={articles}
          loading={loading && articles.length === 0}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          onArticleClick={handleArticleClick}
        />
      </div>

      {/* News Modal */}
      <NewsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        article={selectedArticle}
      />
    </>
  );
}