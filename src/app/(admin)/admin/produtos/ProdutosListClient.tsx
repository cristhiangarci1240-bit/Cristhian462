'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { ImportProductModal } from '@/components/admin/ImportProductModal';
import { AddProductMethodModal } from '@/components/admin/AddProductMethodModal';

interface ProdutosListClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ProdutosListClient({ initialProducts, categories }: ProdutosListClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('novo') === '1' || params.get('novo') === 'true') {
        setIsMethodModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'Não definida';
  };

  const handleProductImported = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleToggleActive = async (product: Product) => {
    setLoadingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch (_) {}
    setLoadingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoadingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Erro ao excluir produto.');
      }
    } catch (_) {
      alert('Erro ao excluir produto.');
    }
    setLoadingId(null);
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      (p.gtin && p.gtin.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = !selectedCat || p.categoryId === selectedCat;

    return matchesSearch && matchesCat;
  });

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Gestão de Produtos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Cadastre, edite especificações e gerencie o catálogo corporativo da TECH7.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="btn btn-secondary"
            id="btn-open-import-modal"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Globe size={16} style={{ color: '#2563EB' }} />
            <span>Importar produto por URL</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMethodModalOpen(true)}
            className="btn btn-primary"
            id="btn-add-product"
          >
            <Plus size={16} />
            <span>Adicionar produto</span>
          </button>
        </div>
      </div>

      {/* Filtros da Tabela */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          backgroundColor: 'var(--brand-surface-card)',
          border: '1px solid var(--brand-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Pesquisar por nome, SKU, GTIN ou marca..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <select
            className="form-select"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div
        style={{
          backgroundColor: 'var(--brand-surface-card)',
          border: '1px solid var(--brand-border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--brand-border)', backgroundColor: '#F8FAFC', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '14px 18px', width: '70px' }}>Imagem</th>
                <th style={{ padding: '14px 18px' }}>Nome & SKU</th>
                <th style={{ padding: '14px 18px' }}>Categoria</th>
                <th style={{ padding: '14px 18px' }}>Marca / Modelo</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Preço Venda</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Consultas</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((prod) => (
                  <tr
                    key={prod.id}
                    style={{
                      borderBottom: '1px solid var(--brand-border)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <td style={{ padding: '12px 18px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '4px',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.mainImage}
                          alt={prod.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
                        {prod.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
                          SKU: {prod.sku}
                        </span>
                        {prod.marketplace && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontWeight: 700,
                              backgroundColor: prod.marketplace === 'mercadolivre' ? '#FEF08A' : '#FED7AA',
                              color: prod.marketplace === 'mercadolivre' ? '#854D0E' : '#9A3412',
                            }}
                          >
                            {prod.marketplace === 'mercadolivre' ? 'ML' : 'Amazon'}
                          </span>
                        )}
                        {prod.gtin && (
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            EAN: {prod.gtin}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                      {getCategoryName(prod.categoryId)}
                    </td>

                    <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                      <div>{prod.brand}</div>
                      {prod.model && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{prod.model}</div>}
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 600 }}>
                      {prod.sellingPrice !== undefined ? (
                        <span style={{ color: '#059669' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: prod.currency || 'BRL' }).format(prod.sellingPrice)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sob consulta</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(prod)}
                        disabled={loadingId === prod.id}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: prod.isActive ? '#00E676' : '#EF4444',
                        }}
                        title="Clique para alternar status ativo/inativo"
                      >
                        {prod.isActive ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {prod.inquiriesCount || 0}
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link
                          href={`/produtos/${prod.slug}`}
                          target="_blank"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Ver na loja pública"
                        >
                          <ExternalLink size={14} />
                        </Link>

                        <Link
                          href={`/admin/produtos/${prod.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Editar produto"
                        >
                          <Edit2 size={14} />
                        </Link>

                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          disabled={loadingId === prod.id}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', color: '#EF4444' }}
                          title="Excluir produto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum produto cadastrado com os critérios informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Seleção de Método para Adicionar Produto */}
      <AddProductMethodModal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        onSelectManual={() => {
          setIsMethodModalOpen(false);
          router.push('/admin/produtos/novo');
        }}
        onSelectAI={() => {
          setIsMethodModalOpen(false);
          setIsImportModalOpen(true);
        }}
      />

      {/* Modal de Importação por URL */}
      <ImportProductModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={categories}
        onProductImported={handleProductImported}
      />
    </div>
  );
}
