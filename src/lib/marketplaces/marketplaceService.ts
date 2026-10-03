import { MercadoLivreAdapter } from './mercadoLivre/adapter';
import { AmazonAdapter } from './amazon/adapter';
import type {
  ImportedProduct,
  ImportProductResponse,
  MarketplaceAdapter,
  DuplicateMatch,
} from './types';
import { getProducts, getCategories } from '@/lib/db';

const ADAPTERS: MarketplaceAdapter[] = [
  new MercadoLivreAdapter(),
  new AmazonAdapter(),
];

// Strictly allowed marketplace domains for SSRF mitigation
const ALLOWED_DOMAINS = [
  'mercadolivre.com.br',
  'produto.mercadolivre.com.br',
  'mercadolibre.com',
  'amazon.com.br',
  'amazon.com',
  'amzn.to',
];

/**
 * Validates the URL or ASIN code to protect against SSRF and unsupported domains.
 */
export function validateMarketplaceUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL ou código ASIN inválido.' };
  }

  const trimmed = url.trim();

  // Allow direct 10-char Amazon ASIN
  if (/^B[A-Z0-9]{9}$/i.test(trimmed)) {
    return { isValid: true };
  }

  // Basic protocol check
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isValid: false, error: 'Informe uma URL completa (com https://) ou o código ASIN (10 dígitos).' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Formato de URL inválido.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block private/local IP ranges
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('169.254.')
  ) {
    return { isValid: false, error: 'Endereço de rede não permitido por segurança.' };
  }

  // Whitelist check
  const isAllowed = ALLOWED_DOMAINS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowed) {
    return {
      isValid: false,
      error: 'Marketplace não reconhecido. Atualmente suportamos Mercado Livre e Amazon Brasil.',
    };
  }

  return { isValid: true };
}

/**
 * Finds duplicate products in database.json according to priority rules:
 * 1. marketplace + sourceProductId
 * 2. asin
 * 3. gtin/ean
 * 4. sku
 * 5. brand + model
 */
export async function findDuplicateProduct(imported: ImportedProduct): Promise<DuplicateMatch | null> {
  const existingProducts = await getProducts();

  for (const p of existingProducts) {
    // 1. Marketplace + SourceProductId
    if (
      imported.sourceProductId &&
      p.sourceProductId &&
      p.sourceProductId.toLowerCase() === imported.sourceProductId.toLowerCase() &&
      p.marketplace === imported.marketplace
    ) {
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        matchedBy: 'sourceProductId',
        description: `Produto já cadastrado com o ID de origem "${p.sourceProductId}" no ${imported.marketplace}.`,
      };
    }

    // 2. ASIN
    if (
      imported.asin &&
      p.asin &&
      p.asin.toLowerCase() === imported.asin.toLowerCase()
    ) {
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        matchedBy: 'asin',
        description: `Produto já cadastrado com o ASIN "${p.asin}".`,
      };
    }

    // 3. GTIN / EAN
    if (
      imported.gtin &&
      p.gtin &&
      p.gtin.trim() !== '' &&
      p.gtin.toLowerCase() === imported.gtin.toLowerCase()
    ) {
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        matchedBy: 'gtin',
        description: `Produto já cadastrado com o código de barras/GTIN "${p.gtin}".`,
      };
    }

    // 4. SKU
    if (
      imported.sku &&
      p.sku &&
      p.sku.toLowerCase() === imported.sku.toLowerCase()
    ) {
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        matchedBy: 'sku',
        description: `Já existe um produto com o SKU "${p.sku}".`,
      };
    }

    // 5. Brand + Model
    if (
      imported.brand &&
      imported.model &&
      p.brand &&
      p.model &&
      p.brand.toLowerCase() === imported.brand.toLowerCase() &&
      p.model.toLowerCase() === imported.model.toLowerCase()
    ) {
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        matchedBy: 'brand_model',
        description: `Produto similar já existente: Marca "${p.brand}" e Modelo "${p.model}".`,
      };
    }
  }

  return null;
}

/**
 * Intelligent heuristic to suggest one of the existing TECH7 categories:
 * - Celulares (cat_01)
 * - Computadores (cat_02)
 * - Sala de conferências (cat_03)
 * - Brindes corporativos (cat_04)
 */
export async function suggestCategory(product: ImportedProduct): Promise<string | undefined> {
  const categories = await getCategories();
  if (categories.length === 0) return undefined;

  const corpus = `${product.title} ${product.shortDescription} ${product.brand} ${product.model} ${Object.values(product.specifications).join(' ')}`.toLowerCase();

  // Rules for Celulares (cat_01)
  if (
    corpus.includes('celular') ||
    corpus.includes('smartphone') ||
    corpus.includes('iphone') ||
    corpus.includes('galaxy s') ||
    corpus.includes('galaxy z') ||
    corpus.includes('redmi') ||
    corpus.includes('xiaomi') ||
    corpus.includes('motorola edge') ||
    corpus.includes('snapdragon')
  ) {
    const found = categories.find((c) => c.slug === 'celulares' || c.id === 'cat_01');
    if (found) return found.id;
  }

  // Rules for Sala de conferências (cat_03)
  if (
    corpus.includes('conferência') ||
    corpus.includes('conferencia') ||
    corpus.includes('videoconferência') ||
    corpus.includes('videoconferencia') ||
    corpus.includes('projetor') ||
    corpus.includes('microfone de mesa') ||
    corpus.includes('webcam 4k') ||
    corpus.includes('polycom') ||
    corpus.includes('logitech meetup') ||
    corpus.includes('jabra speak') ||
    corpus.includes('tela interativa')
  ) {
    const found = categories.find((c) => c.slug === 'sala-de-conferencias' || c.id === 'cat_03');
    if (found) return found.id;
  }

  // Rules for Computadores (cat_02)
  if (
    corpus.includes('notebook') ||
    corpus.includes('laptop') ||
    corpus.includes('computador') ||
    corpus.includes('desktop') ||
    corpus.includes('workstation') ||
    corpus.includes('macbook') ||
    corpus.includes('thinkpad') ||
    corpus.includes('intel core') ||
    corpus.includes('ryzen') ||
    corpus.includes('ultrabook')
  ) {
    const found = categories.find((c) => c.slug === 'computadores' || c.id === 'cat_02');
    if (found) return found.id;
  }

  // Rules for Brindes corporativos (cat_04)
  if (
    corpus.includes('brinde') ||
    corpus.includes('powerbank') ||
    corpus.includes('fone de ouvido') ||
    corpus.includes('headphone') ||
    corpus.includes('headset') ||
    corpus.includes('earbuds') ||
    corpus.includes('carregador por indução') ||
    corpus.includes('mochila executiva') ||
    corpus.includes('caixa de som bluetooth')
  ) {
    const found = categories.find((c) => c.slug === 'brindes-corporativos' || c.id === 'cat_04');
    if (found) return found.id;
  }

  return categories[0]?.id;
}

/**
 * Main marketplace detection and extraction function.
 */
export async function detectAndFetchMarketplaceProduct(url: string): Promise<ImportProductResponse> {
  const validation = validateMarketplaceUrl(url);
  if (!validation.isValid) {
    throw new Error(validation.error || 'URL inválida.');
  }

  const trimmed = url.trim();
  const effectiveUrl = /^B[A-Z0-9]{9}$/i.test(trimmed)
    ? `https://www.amazon.com.br/dp/${trimmed.toUpperCase()}`
    : trimmed;

  // Select appropriate adapter
  const adapter = ADAPTERS.find((a) => a.canHandle(effectiveUrl));
  if (!adapter) {
    throw new Error('Marketplace não reconhecido. Apenas Mercado Livre e Amazon Brasil são suportados.');
  }

  // Fetch product from official API or structured ASIN template
  const product = await adapter.fetchProduct(effectiveUrl);

  // Check for duplicates
  const duplicateMatch = await findDuplicateProduct(product);

  // Suggest category
  const suggestedCategoryId = await suggestCategory(product);
  product.suggestedCategoryId = suggestedCategoryId;

  return {
    product,
    duplicateMatch,
    suggestedCategoryId,
    isManualMode: product.isManualMode,
    notice: product.notice,
  };
}
