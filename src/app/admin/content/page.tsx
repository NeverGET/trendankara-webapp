'use client';

import { useState, useEffect, useCallback } from 'react';
import { MobilePreview } from '@/components/admin/MobilePreview';
import { ComponentPalette, getDefaultProps } from '@/components/admin/ComponentPalette';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Layout,
  ChevronLeft,
  FileText,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Globe,
  Home,
  Settings,
  RefreshCw,
  Check,
  X
} from 'lucide-react';

interface ContentPage {
  id?: number;
  title: string;
  slug: string;
  description?: string;
  components: any[];
  meta?: {
    keywords?: string[];
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  is_published?: boolean;
  is_homepage?: boolean;
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  creator_name?: string;
}

export default function AdminContentPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [currentPage, setCurrentPage] = useState<ContentPage | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPageList, setShowPageList] = useState(true);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [previewScale, setPreviewScale] = useState(0.85);

  // Fetch all pages
  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content');
      const data = await response.json();
      if (data.success) {
        setPages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      // Mock data fallback
      setPages([
        {
          id: 1,
          title: 'Ana Sayfa',
          slug: 'anasayfa',
          description: 'Mobil uygulama ana sayfası',
          components: [],
          is_published: true,
          is_homepage: true,
          view_count: 1234
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // Create new page
  const createNewPage = () => {
    const newPage: ContentPage = {
      title: 'Yeni Sayfa',
      slug: `yeni-sayfa-${Date.now()}`,
      description: '',
      components: [],
      meta: {},
      is_published: false,
      is_homepage: false
    };
    setCurrentPage(newPage);
    setShowPageList(false);
  };

  // Load existing page
  const loadPage = async (pageId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/content?id=${pageId}`);
      const data = await response.json();
      if (data.success) {
        setCurrentPage(data.data);
        setShowPageList(false);
      }
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save page
  const savePage = async () => {
    if (!currentPage) return;

    setIsSaving(true);
    try {
      const method = currentPage.id ? 'PUT' : 'POST';
      const body = currentPage.id
        ? { ...currentPage, id: currentPage.id }
        : currentPage;

      const response = await fetch('/api/admin/content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        setCurrentPage(data.data);
        await fetchPages();
      }
    } catch (error) {
      console.error('Error saving page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete page
  const deletePage = async (pageId: number) => {
    if (!confirm('Bu sayfayı silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/content?id=${pageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPages();
        if (currentPage?.id === pageId) {
          setCurrentPage(null);
          setShowPageList(true);
        }
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  // Duplicate page
  const duplicatePage = async (pageId: number) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pageId,
          action: 'duplicate'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchPages();
        setCurrentPage(data.data);
        setShowPageList(false);
      }
    } catch (error) {
      console.error('Error duplicating page:', error);
    }
  };

  // Publish/Unpublish page
  const togglePublish = async (pageId: number, publish: boolean) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pageId,
          action: publish ? 'publish' : 'unpublish'
        })
      });

      if (response.ok) {
        await fetchPages();
        if (currentPage?.id === pageId) {
          setCurrentPage(prev => prev ? { ...prev, is_published: publish } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  // Set as homepage
  const setAsHomepage = async (pageId: number) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pageId,
          action: 'set_homepage'
        })
      });

      if (response.ok) {
        await fetchPages();
        if (currentPage?.id === pageId) {
          setCurrentPage(prev => prev ? { ...prev, is_homepage: true } : null);
        }
      }
    } catch (error) {
      console.error('Error setting homepage:', error);
    }
  };

  // Add component
  const addComponent = (componentDef: any) => {
    if (!currentPage) return;

    const newComponent = {
      id: `comp-${Date.now()}`,
      type: componentDef.type,
      props: { ...componentDef.defaultProps },
      order: currentPage.components.length
    };

    setCurrentPage({
      ...currentPage,
      components: [...currentPage.components, newComponent]
    });
    setSelectedComponentId(newComponent.id);
  };

  // Delete component
  const deleteComponent = (componentId: string) => {
    if (!currentPage) return;

    setCurrentPage({
      ...currentPage,
      components: currentPage.components.filter(c => c.id !== componentId)
    });
    setSelectedComponentId(undefined);
  };

  // Duplicate component
  const duplicateComponent = (componentId: string) => {
    if (!currentPage) return;

    const component = currentPage.components.find(c => c.id === componentId);
    if (!component) return;

    const newComponent = {
      ...component,
      id: `comp-${Date.now()}`,
      order: currentPage.components.length
    };

    setCurrentPage({
      ...currentPage,
      components: [...currentPage.components, newComponent]
    });
  };

  // Move component
  const moveComponent = (componentId: string, direction: 'up' | 'down') => {
    if (!currentPage) return;

    const index = currentPage.components.findIndex(c => c.id === componentId);
    if (index === -1) return;

    const newComponents = [...currentPage.components];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newComponents.length) return;

    [newComponents[index], newComponents[targetIndex]] = [newComponents[targetIndex], newComponents[index]];

    // Update order values
    newComponents.forEach((comp, i) => {
      comp.order = i;
    });

    setCurrentPage({
      ...currentPage,
      components: newComponents
    });
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    const componentData = e.dataTransfer.getData('componentData');

    if (componentType && componentData) {
      const componentDef = JSON.parse(componentData);
      addComponent(componentDef);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  if (showPageList) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mobil İçerik Yönetimi</h1>
            <p className="text-gray-600 mt-2">Mobil uygulama sayfalarını yönetin</p>
          </div>
          <Button onClick={createNewPage} className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Yeni Sayfa
          </Button>
        </div>

        {/* Pages Grid */}
        {isLoading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : pages.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Henüz sayfa oluşturulmamış</p>
            <Button onClick={createNewPage}>İlk Sayfayı Oluştur</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <Card
                key={page.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => page.id && loadPage(page.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{page.title}</h3>
                  <div className="flex gap-1">
                    {page.is_homepage && (
                      <Badge variant="info" className="text-xs">
                        <Home className="h-3 w-3 mr-1" />
                        Ana Sayfa
                      </Badge>
                    )}
                    {page.is_published ? (
                      <Badge variant="success" className="text-xs">Yayında</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">Taslak</Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{page.description || 'Açıklama yok'}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>/{page.slug}</span>
                  {page.view_count && <span>{page.view_count} görüntülenme</span>}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      page.id && togglePublish(page.id, !page.is_published);
                    }}
                  >
                    {page.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      page.id && duplicatePage(page.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {!page.is_homepage && (
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        page.id && setAsHomepage(page.id);
                      }}
                    >
                      <Home className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      page.id && deletePage(page.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!currentPage) return null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="small"
            onClick={() => setShowPageList(true)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sayfalar
          </Button>

          <div>
            <Input
              value={currentPage.title}
              onChange={(e) => setCurrentPage({ ...currentPage, title: e.target.value })}
              className="font-semibold text-lg border-0 px-0"
              placeholder="Sayfa Başlığı"
            />
            <Input
              value={currentPage.slug}
              onChange={(e) => setCurrentPage({ ...currentPage, slug: e.target.value })}
              className="text-sm text-gray-500 border-0 px-0"
              placeholder="sayfa-url"
            />
          </div>

          <div className="flex gap-2">
            {currentPage.is_homepage && (
              <Badge variant="info">
                <Home className="h-3 w-3 mr-1" />
                Ana Sayfa
              </Badge>
            )}
            {currentPage.is_published ? (
              <Badge variant="success">Yayında</Badge>
            ) : (
              <Badge variant="default">Taslak</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Ölçek: {Math.round(previewScale * 100)}%
          </span>
          <input
            type="range"
            min="50"
            max="100"
            value={previewScale * 100}
            onChange={(e) => setPreviewScale(parseInt(e.target.value) / 100)}
            className="w-24"
          />

          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              if (currentPage.id) {
                togglePublish(currentPage.id, !currentPage.is_published);
              }
            }}
          >
            {currentPage.is_published ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Yayından Kaldır
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Yayınla
              </>
            )}
          </Button>

          <Button
            onClick={savePage}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Kaydet
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Component Palette */}
        <div className="w-80 border-r overflow-y-auto">
          <ComponentPalette onAddComponent={addComponent} />
        </div>

        {/* Mobile Preview */}
        <div className="flex-1 overflow-auto bg-gray-100">
          <MobilePreview
            components={currentPage.components}
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
            onDeleteComponent={deleteComponent}
            onDuplicateComponent={duplicateComponent}
            onMoveComponent={moveComponent}
            onEditComponent={(id) => {
              const comp = currentPage.components.find(c => c.id === id);
              setEditingComponent(comp);
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            title={currentPage.title}
            scale={previewScale}
          />
        </div>

        {/* Properties Panel */}
        {selectedComponentId && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Bileşen Özellikleri</h3>
            {(() => {
              const component = currentPage.components.find(c => c.id === selectedComponentId);
              if (!component) return null;

              return (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Tip</label>
                    <p className="font-medium">{component.type}</p>
                  </div>

                  {/* Dynamic property editor based on component type */}
                  {Object.entries(component.props).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-sm text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      {typeof value === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            const updatedComponents = currentPage.components.map(c =>
                              c.id === selectedComponentId
                                ? { ...c, props: { ...c.props, [key]: e.target.checked } }
                                : c
                            );
                            setCurrentPage({ ...currentPage, components: updatedComponents });
                          }}
                          className="mt-1"
                        />
                      ) : (
                        <Input
                          value={value as string}
                          onChange={(e) => {
                            const updatedComponents = currentPage.components.map(c =>
                              c.id === selectedComponentId
                                ? { ...c, props: { ...c.props, [key]: e.target.value } }
                                : c
                            );
                            setCurrentPage({ ...currentPage, components: updatedComponents });
                          }}
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => deleteComponent(selectedComponentId)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Bileşeni Sil
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}