import type { ImportedProduct, MarketplaceAdapter } from '../types';

/**
 * Adapter para Amazon Brasil com suporte duplo:
 * 1. Integração opcional com a Amazon Creators API (OAuth 2.0).
 * 2. Modo manual desacoplado via ASIN/URL quando as chaves de API não estiverem configuradas.
 * 
 * Permite que o lojista importe produtos da Amazon por link ou ASIN sem ser bloqueado,
 * completando os dados manualmente ou ativando a Creators API posteriormente via .env.
 */
export class AmazonAdapter implements MarketplaceAdapter {
  readonly marketplace = 'amazon' as const;

  // Endpoint oficial OAuth 2.0 (LWA - Login with Amazon)
  private readonly tokenEndpoint = 'https://api.amazon.com/auth/o2/token';

  /**
   * Verifica se a entrada é um ASIN direto ou pertence aos domínios da Amazon.
   */
  canHandle(url: string): boolean {
    try {
      const trimmed = url.trim();
      // Aceita código ASIN direto de 10 caracteres (começando com B)
      if (/^B[A-Z0-9]{9}$/i.test(trimmed)) {
        return true;
      }
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname === 'amazon.com.br' ||
        hostname.endsWith('.amazon.com.br') ||
        hostname === 'amazon.com' ||
        hostname.endsWith('.amazon.com') ||
        hostname === 'amzn.to'
      );
    } catch {
      return false;
    }
  }

  /**
   * Extrai o identificador padrão alfanumérico ASIN (10 caracteres) da URL ou do texto.
   */
  extractId(url: string): string | null {
    try {
      const trimmed = url.trim();
      if (/^B[A-Z0-9]{9}$/i.test(trimmed)) {
        return trimmed.toUpperCase();
      }

      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const fullPath = parsed.pathname;

      // Padrão 1: /dp/B0XXXXXXXX ou /gp/product/B0XXXXXXXX ou /product/B0XXXXXXXX ou /d/B0XXXXXXXX
      const dpMatch = fullPath.match(/\/(?:dp|gp\/product|product|d)\/([A-Z0-9]{10})/i);
      if (dpMatch && dpMatch[1]) {
        return dpMatch[1].toUpperCase();
      }

      // Padrão 2: Segmento de caminho com ASIN iniciando em B
      const asinMatch = fullPath.match(/\/([A-Z0-9]{10})(?:[/?#]|$)/i);
      if (asinMatch && asinMatch[1] && asinMatch[1].startsWith('B')) {
        return asinMatch[1].toUpperCase();
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extrai um título legível a partir do slug da URL da Amazon se presente.
   */
  private extractTitleFromUrl(url: string, asin: string): string {
    try {
      const trimmed = url.trim();
      if (!trimmed.startsWith('http')) return `Produto Amazon (${asin})`;

      const parsed = new URL(trimmed);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const dpIndex = segments.findIndex(
        (s) => s.toLowerCase() === 'dp' || s.toLowerCase() === 'product' || s.toLowerCase() === 'd'
      );

      if (dpIndex > 0) {
        const rawSlug = segments[dpIndex - 1];
        if (rawSlug && rawSlug.length > 2 && !rawSlug.toLowerCase().startsWith('gp')) {
          const clean = decodeURIComponent(rawSlug.replace(/[-_]+/g, ' ')).trim();
          if (clean && clean.length > 3) {
            // Capitaliza suavemente a primeira letra
            return clean.charAt(0).toUpperCase() + clean.slice(1);
          }
        }
      }

      return `Produto Amazon (${asin})`;
    } catch {
      return `Produto Amazon (${asin})`;
    }
  }

  /**
   * Obtém token de acesso via OAuth 2.0 (Client Credentials flow) para a Creators API.
   */
  private async getOAuthToken(clientId: string, clientSecret: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'creators::catalog',
    });

    const res = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      throw new Error(`Falha na autenticação OAuth 2.0 da Amazon Creators API: ${res.statusText}`);
    }

    const data = await res.json();
    return data.access_token;
  }

  /**
   * Tenta obter com segurança a imagem oficial a partir da página pública da Amazon Brasil.
   * Utiliza timeout curto e AbortController. Se a Amazon bloquear ou não fornecer,
   * falha silenciosamente sem interromper o fluxo (Regras 4 e 5).
   */
  private async tryFetchPublicImage(canonicalUrl: string): Promise<string | undefined> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(canonicalUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        },
      });

      clearTimeout(timer);

      if (!resp.ok) return undefined;

      const html = await resp.text();

      // 1. Meta og:image
      const ogMatch =
        html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);

      if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http') && !ogMatch[1].includes('captcha')) {
        return ogMatch[1];
      }

      // 2. data-old-hires ou dynamic images do CDN oficial da Amazon
      const hiresMatch = html.match(/data-old-hires=["'](https:\/\/[^"']+\.jpg)["']/i);
      if (hiresMatch && hiresMatch[1]) {
        return hiresMatch[1];
      }

      // 3. Imagem de landing principal
      const landingMatch = html.match(/id=["']landingImage["'][^>]+src=["'](https:\/\/[^"']+)["']/i);
      if (landingMatch && landingMatch[1] && !landingMatch[1].includes('transparent')) {
        return landingMatch[1];
      }

      return undefined;
    } catch {
      // Falha silenciosa permitida conforme regras 4 e 5
      return undefined;
    }
  }

  /**
   * Consulta os dados do produto ou cria estrutura base para preenchimento manual.
   * Não bloqueia o usuário caso a Creators API não esteja configurada.
   */
  async fetchProduct(url: string): Promise<ImportedProduct> {
    const asin = this.extractId(url);
    if (!asin) {
      throw new Error('Não foi possível identificar o código ASIN na URL ou código informado.');
    }

    const title = this.extractTitleFromUrl(url, asin);
    const canonicalUrl = url.trim().startsWith('http')
      ? url.trim()
      : `https://www.amazon.com.br/dp/${asin}`;

    // Credenciais opcionais da Amazon Creators API
    const clientId = process.env.AMAZON_CREATORS_CLIENT_ID;
    const clientSecret = process.env.AMAZON_CREATORS_CLIENT_SECRET;
    const storeId = process.env.AMAZON_CREATORS_STORE_ID;

    // Se as credenciais estiverem configuradas, tenta consultar a Creators API oficial
    if (clientId && clientSecret && storeId) {
      try {
        const accessToken = await this.getOAuthToken(clientId, clientSecret);
        if (accessToken) {
          // Quando os endpoints de catálogo da Creators API estiverem mapeados para a loja:
          // const apiProduct = await this.fetchCatalogProduct(accessToken, storeId, asin);
          // return apiProduct;
        }
      } catch (err: any) {
        console.warn(
          `[AmazonAdapter] Aviso ao consultar Creators API (${err?.message || err}). Alternando para modo manual com ASIN.`
        );
      }
    }

    // Tentativa segura de extração pública da imagem principal (Regra 4)
    const detectedImage = await this.tryFetchPublicImage(canonicalUrl);
    const images = detectedImage ? [detectedImage] : [];

    // Modo Manual Estruturado (Creators API Opcional / Sem bloqueio)
    return {
      marketplace: 'amazon',
      sourceUrl: canonicalUrl,
      sourceProductId: asin,
      asin,
      title,
      brand: '',
      model: '',
      sku: `AMZ-${asin}`,
      description: '',
      shortDescription: `Produto importado por referência do catálogo da Amazon Brasil (ASIN: ${asin}).`,
      images,
      features: [],
      specifications: {
        'ASIN': asin,
        'Marketplace': 'Amazon Brasil',
        'Modo': 'Importação por ASIN (preenchimento manual)',
      },
      currency: 'BRL',
      availability: 'in_stock',
      importedAt: new Date().toISOString(),
      isManualMode: true,
      notice: images.length > 0
        ? `ASIN ${asin} identificado com sucesso e imagem principal obtida. Você pode adicionar mais fotos ou editar os dados manualmente.`
        : `ASIN ${asin} identificado com sucesso. A Creators API é opcional; você pode adicionar a imagem por URL ou arquivo e revisar os dados manualmente.`,
    };
  }
}
