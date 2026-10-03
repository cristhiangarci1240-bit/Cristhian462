import type { ImportedProduct, MarketplaceAdapter } from '../types';

export class MercadoLivreAdapter implements MarketplaceAdapter {
  readonly marketplace = 'mercadolivre' as const;

  /**
   * Checks if the given URL corresponds to Mercado Livre Brasil.
   */
  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname === 'mercadolivre.com.br' ||
        hostname.endsWith('.mercadolivre.com.br') ||
        hostname === 'produto.mercadolivre.com.br' ||
        hostname === 'mercadolibre.com' ||
        hostname.endsWith('.mercadolibre.com')
      );
    } catch {
      return false;
    }
  }

  /**
   * Extracts the Mercado Livre item or catalog ID (e.g. MLB1234567890).
   */
  extractId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const fullPath = parsed.pathname + parsed.search;

      // Pattern 1: Standard /MLB-1234567890-... or /MLB1234567890-...
      const itemMatch = fullPath.match(/MLB-?(\d+)/i);
      if (itemMatch && itemMatch[1]) {
        return `MLB${itemMatch[1]}`;
      }

      // Pattern 2: Catalog /p/MLB12345678 or /p/MLB-12345678
      const catalogMatch = fullPath.match(/\/p\/(MLB-?\d+)/i);
      if (catalogMatch && catalogMatch[1]) {
        return catalogMatch[1].replace('-', '').toUpperCase();
      }

      // Pattern 3: Query parameter id or wid
      const wid = parsed.searchParams.get('wid') || parsed.searchParams.get('id');
      if (wid && /MLB-?\d+/i.test(wid)) {
        return wid.replace('-', '').toUpperCase();
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches official product data using Mercado Livre's public REST API.
   */
  async fetchProduct(url: string): Promise<ImportedProduct> {
    const itemId = this.extractId(url);
    if (!itemId) {
      throw new Error('Não foi possível identificar o código do produto (MLB) na URL informada.');
    }

    // 1. Fetch item core data from official Mercado Libre API
    const itemUrl = `https://api.mercadolibre.com/items/${itemId}`;
    const itemRes = await fetch(itemUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TECH7-Electronics-Importer/1.0',
      },
    });

    if (!itemRes.ok) {
      // If /items/ 404s, try catalog /products/ endpoint
      if (itemRes.status === 404) {
        return this.fetchCatalogProduct(itemId, url);
      }
      throw new Error(`Não foi possível localizar o produto no Mercado Livre (status ${itemRes.status}).`);
    }

    const item = await itemRes.json();

    // 2. Fetch description from official endpoint
    let descriptionText = '';
    try {
      const descRes = await fetch(`https://api.mercadolibre.com/items/${itemId}/description`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TECH7-Electronics-Importer/1.0',
        },
      });
      if (descRes.ok) {
        const descData = await descRes.json();
        descriptionText = descData.plain_text || descData.text || '';
      }
    } catch {
      // Description is optional; fall back to title if unavailable
    }

    // 3. Extract structured attributes
    const attributes: Array<{ id: string; name: string; value_name?: string }> =
      item.attributes || [];

    const getAttr = (ids: string[]): string => {
      for (const id of ids) {
        const found = attributes.find((a) => a.id?.toUpperCase() === id.toUpperCase());
        if (found && found.value_name) return found.value_name.trim();
      }
      return '';
    };

    const brand = getAttr(['BRAND', 'MARCA']) || 'TECH7';
    const model = getAttr(['MODEL', 'MODELO', 'LINE', 'LINHA']) || '';
    const gtin = getAttr(['GTIN', 'EAN', 'UPC', 'CODIGO_UNIVERSAL_DO_PRODUTO']);
    const sellerSku = getAttr(['SELLER_SKU', 'SKU']);

    // Build specs record from all available attributes
    const specifications: Record<string, string> = {};
    const features: string[] = [];

    for (const attr of attributes) {
      if (attr.name && attr.value_name && attr.value_name !== 'null') {
        specifications[attr.name] = attr.value_name;
        // Collect key specs as feature bullet points
        if (
          [
            'BRAND',
            'MODEL',
            'PROCESSOR_MODEL',
            'RAM',
            'INTERNAL_MEMORY',
            'SCREEN_SIZE',
            'BATTERY_CAPACITY',
            'MAIN_COLOR',
          ].includes(attr.id)
        ) {
          features.push(`${attr.name}: ${attr.value_name}`);
        }
      }
    }

    // Extract pictures
    const images: string[] = [];
    if (Array.isArray(item.pictures)) {
      for (const pic of item.pictures) {
        const picUrl = pic.secure_url || pic.url;
        if (picUrl && !images.includes(picUrl)) {
          images.push(picUrl);
        }
      }
    }

    const shortDescription =
      descriptionText.length > 0
        ? descriptionText.slice(0, 300).trim() + (descriptionText.length > 300 ? '...' : '')
        : `${item.title} — Equipamento corporativo de alto desempenho homologado pela TECH7.`;

    const isAvailable =
      item.status === 'active' && typeof item.available_quantity === 'number'
        ? item.available_quantity > 0
        : true;

    return {
      marketplace: 'mercadolivre',
      sourceUrl: item.permalink || url,
      sourceProductId: itemId,
      title: item.title || 'Produto sem título',
      brand,
      model,
      sku: sellerSku || itemId,
      gtin: gtin || undefined,
      description: descriptionText || item.title || '',
      shortDescription,
      images,
      features: features.length > 0 ? features : [item.title],
      specifications,
      price: typeof item.price === 'number' ? item.price : undefined,
      currency: item.currency_id || 'BRL',
      availability: isAvailable ? 'in_stock' : 'out_of_stock',
      seller: item.seller_id ? `Vendedor #${item.seller_id}` : undefined,
      importedAt: new Date().toISOString(),
    };
  }

  /**
   * Fallback for catalog products (/p/MLB...)
   */
  private async fetchCatalogProduct(productId: string, originalUrl: string): Promise<ImportedProduct> {
    const catalogUrl = `https://api.mercadolibre.com/products/${productId}`;
    const res = await fetch(catalogUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TECH7-Electronics-Importer/1.0',
      },
    });

    if (!res.ok) {
      throw new Error('Produto não encontrado na API oficial do Mercado Livre.');
    }

    const product = await res.json();
    const attributes: Array<{ id: string; name: string; value_name?: string }> =
      product.attributes || [];

    const getAttr = (ids: string[]): string => {
      for (const id of ids) {
        const found = attributes.find((a) => a.id?.toUpperCase() === id.toUpperCase());
        if (found && found.value_name) return found.value_name.trim();
      }
      return '';
    };

    const brand = getAttr(['BRAND', 'MARCA']) || 'TECH7';
    const model = getAttr(['MODEL', 'MODELO']) || '';
    const gtin = getAttr(['GTIN', 'EAN']);

    const specifications: Record<string, string> = {};
    for (const attr of attributes) {
      if (attr.name && attr.value_name) {
        specifications[attr.name] = attr.value_name;
      }
    }

    const images: string[] = (product.pictures || []).map((p: any) => p.url).filter(Boolean);

    return {
      marketplace: 'mercadolivre',
      sourceUrl: originalUrl,
      sourceProductId: productId,
      title: product.name || 'Produto sem título',
      brand,
      model,
      sku: productId,
      gtin: gtin || undefined,
      description: product.description || product.name || '',
      shortDescription: product.name || '',
      images,
      features: [product.name],
      specifications,
      price: typeof product.buy_box_winner?.price === 'number' ? product.buy_box_winner.price : undefined,
      currency: product.buy_box_winner?.currency_id || 'BRL',
      availability: 'in_stock',
      seller: 'Mercado Livre',
      importedAt: new Date().toISOString(),
    };
  }
}
