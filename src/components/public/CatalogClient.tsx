'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Smartphone, Laptop, Video, Gift, LayoutGrid } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/public/ProductCard';
import styles from './CatalogClient.module.css';

interface CatalogClientProps {
  products: Product[];
  categories: Category[];
}

export function CatalogClient({ products, categories }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const initialCategorySlug = searchParams.get('categoria') || '';
  const initialSearch = searchParams.get('q') || '';

  // Encontrar categoria inicial pelo slug do parâmetro URL
  // Se nenhum slug fornecido, começa com null (mostrar todas)
  const initialCat = useMemo(() => {
    if (!initialCategorySlug) return null;
    return categories.find((c) => c.slug === initialCategorySlug) || null;
  }, [initialCategorySlug, categories]);

  // null = "Todos os Produtos"; Category object = categoria específica
  const [activeCategory, setActiveCategory] = useState<Category | null>(initialCat);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'order'>('order');

  // Sincronizar activeCategory quando o parâmetro 'categoria' da URL mudar
  useEffect(() => {
    if (initialCategorySlug) {
      const cat = categories.find((c) => c.slug === initialCategorySlug) || null;
      setActiveCategory(cat);
    } else {
      setActiveCategory(null);
    }
    setSelectedBrands([]);
  }, [initialCategorySlug, categories]);

  // ── Filtros encadeados: primeiro filtrar por categoria, depois extrair marcas disponíveis ──

  // Produtos filtrados só pela categoria (para derivar marcas disponíveis)
  const productsInCategory = useMemo(() => {
    let list = products.filter((p) => p.isActive);
    if (activeCategory) {
      list = list.filter((p) => p.categoryId === activeCategory.id);
    }
    return list;
  }, [products, activeCategory]);

  // Marcas disponíveis dinamicamente, baseadas nos produtos da categoria atual
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(productsInCategory.map((p) => p.brand).filter(Boolean)));
    return brands.sort((a, b) => a.localeCompare(b));
  }, [productsInCategory]);

  // Resetar seleção de marcas ao trocar categoria
  const handleSetCategory = (cat: Category | null) => {
    setActiveCategory(cat);
    setSelectedBrands([]);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Filtro completo: categoria + busca + marcas + ordenação
  const filteredProducts = useMemo(() => {
    let list = [...productsInCategory];

    // Filtro por busca
    if (initialSearch) {
      const q = initialSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    // Filtro por marcas selecionadas — correspondência exata de marca
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }

    // Ordenação
    switch (sortBy) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'order':
      default:
        list.sort((a, b) => a.order - b.order);
        break;
    }

    return list;
  }, [productsInCategory, initialSearch, selectedBrands, sortBy]);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'celulares':
        return <Smartphone size={16} />;
      case 'computadores':
        return <Laptop size={16} />;
      case 'sala-de-conferencias':
        return <Video size={16} />;
      case 'brindes-corporativos':
        return <Gift size={16} />;
      default:
        return <LayoutGrid size={16} />;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className="container">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Início</Link>
          <ChevronRight size={14} />
          <span>{activeCategory ? activeCategory.name : 'Catálogo'}</span>
        </div>

        {/* Layout com Sidebar e Área Principal */}
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Seção Categorias */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>Categorias</h3>
              <div className={styles.categoryList}>
                {/* Opção "Todos" */}
                <button
                  onClick={() => handleSetCategory(null)}
                  className={`${styles.categoryBtn} ${activeCategory === null ? styles.categoryBtnActive : ''}`}
                >
                  <LayoutGrid size={16} />
                  <span>Todos os Produtos</span>
                </button>

                {/* Categorias dinâmicas do banco */}
                {categories.map((cat) => {
                  const isActive = activeCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSetCategory(cat)}
                      className={`${styles.categoryBtn} ${isActive ? styles.categoryBtnActive : ''}`}
                    >
                      {getCategoryIcon(cat.slug)}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção Filtro de Marca — derivado dinamicamente */}
            {availableBrands.length > 0 && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Filtros</h3>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '10px' }}>
                    Marca
                  </span>
                  <div className={styles.filterGroup}>
                    {availableBrands.map((brand) => (
                      <label key={brand} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className={styles.checkbox}
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedBrands.length > 0 && (
                  <button
                    onClick={() => setSelectedBrands([])}
                    style={{
                      fontSize: '12px',
                      color: 'var(--brand-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </aside>

          {/* Área Principal */}
          <main className={styles.mainArea}>
            <div className={styles.topBar}>
              <div className={styles.titleArea}>
                <h1 className={styles.categoryHeading}>
                  {activeCategory ? activeCategory.name : 'Todos os Produtos'}
                </h1>
                <p className={styles.categorySubheading}>
                  {activeCategory?.description || 'Toda a linha corporativa TECH7 Electronics.'}
                </p>
              </div>

              <div className={styles.controlsArea}>
                <span className={styles.productCount}>
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: '#64748B' }}>Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={styles.sortSelect}
                  >
                    <option value="order">Destaque</option>
                    <option value="recent">Mais recentes</option>
                    <option value="name">Nome (A - Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid de Produtos */}
            {filteredProducts.length > 0 ? (
              <div className={styles.grid}>
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Nenhum produto encontrado
                </h3>
                <p style={{ fontSize: '14px', maxWidth: '380px', margin: '0 auto', color: '#64748B' }}>
                  {selectedBrands.length > 0
                    ? `Nenhum produto da marca "${selectedBrands.join(', ')}" nesta categoria.`
                    : 'Não encontramos produtos correspondentes aos filtros selecionados.'}
                </p>
                {selectedBrands.length > 0 && (
                  <button
                    onClick={() => setSelectedBrands([])}
                    style={{
                      marginTop: '16px',
                      fontSize: '13px',
                      color: 'var(--brand-primary)',
                      background: 'none',
                      border: '1px solid var(--brand-primary)',
                      borderRadius: '6px',
                      padding: '8px 18px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Limpar filtros de marca
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
