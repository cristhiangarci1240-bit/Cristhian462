// ==============================================================================
// TECH7 ELECTRONICS — MARKETPLACE INTEGRATION TYPES
// ==============================================================================

export type MarketplaceType = 'mercadolivre' | 'amazon' | 'unknown';

export interface ImportedProduct {
  marketplace: MarketplaceType;
  sourceUrl: string;
  sourceProductId: string;
  asin?: string;
  title: string;
  brand: string;
  model: string;
  sku: string;
  gtin?: string;
  description: string;
  shortDescription: string;
  images: string[];
  features: string[];
  specifications: Record<string, string>;
  price?: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  seller?: string;
  suggestedCategoryId?: string;
  importedAt: string;
  isManualMode?: boolean;
  notice?: string;
}

export type DuplicateMatchReason =
  | 'sourceProductId'
  | 'asin'
  | 'gtin'
  | 'sku'
  | 'brand_model';

export interface DuplicateMatch {
  id: string;
  name: string;
  sku: string;
  matchedBy: DuplicateMatchReason;
  description: string;
}

export interface MarketplaceAdapter {
  readonly marketplace: MarketplaceType;
  canHandle(url: string): boolean;
  extractId(url: string): string | null;
  fetchProduct(url: string): Promise<ImportedProduct>;
}

export interface ImportProductResponse {
  product: ImportedProduct;
  duplicateMatch: DuplicateMatch | null;
  suggestedCategoryId?: string;
  isManualMode?: boolean;
  notice?: string;
}
