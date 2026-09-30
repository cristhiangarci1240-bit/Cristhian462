import fs from 'fs';
import path from 'path';
import { DatabaseSchema, Product, Category, Client, Video, Review, SiteSettings, User, WhatsAppInquiry } from './types';
import { initialData } from './initialData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure database file exists
function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.videos) {
      parsed.videos = initialData.videos || [];
      saveDb(parsed);
    }
    if (!parsed.reviews) {
      parsed.reviews = initialData.reviews || [];
      saveDb(parsed);
    }
    if (parsed.settings && parsed.settings.loginLogoUrl === undefined) {
      parsed.settings.loginLogoUrl = '';
      saveDb(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('Erro ao ler base de dados, restaurando inicial:', error);
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

// Safe save
function saveDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar DB:', err);
  }
}


// ==========================================
// CONFIGURAÇÕES E APARÊNCIA
// ==========================================
export async function getSettings(): Promise<SiteSettings> {
  const db = ensureDb();
  return db.settings;
}

export async function updateSettings(partial: Partial<SiteSettings>): Promise<SiteSettings> {
  const db = ensureDb();
  db.settings = {
    ...db.settings,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.settings;
}

// ==========================================
// PRODUTOS
// ==========================================
export async function getProducts(options?: {
  categoryId?: string;
  brand?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'order' | 'recent' | 'category';
}): Promise<Product[]> {
  const db = ensureDb();
  let list = [...db.products];

  if (options?.isActive !== undefined) {
    list = list.filter((p) => p.isActive === options.isActive);
  }

  if (options?.categoryId) {
    list = list.filter((p) => p.categoryId === options.categoryId);
  }

  if (options?.brand) {
    const b = options.brand.toLowerCase();
    list = list.filter((p) => p.brand.toLowerCase() === b);
  }

  if (options?.search) {
    const term = options.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        (p.model && p.model.toLowerCase().includes(term)) ||
        p.description.toLowerCase().includes(term)
    );
  }

  // Sorting
  switch (options?.sortBy) {
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'recent':
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'category':
      list.sort((a, b) => a.categoryId.localeCompare(b.categoryId));
      break;
    case 'order':
    default:
      list.sort((a, b) => a.order - b.order);
      break;
  }

  return list;
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = ensureDb();
  return db.products.find((p) => p.id === id) || null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = ensureDb();
  return db.products.find((p) => p.slug === slug) || null;
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'inquiriesCount'>
): Promise<Product> {
  const db = ensureDb();
  const newProduct: Product = {
    ...data,
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    inquiriesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.products.push(newProduct);
  saveDb(db);
  return newProduct;
}

export async function updateProduct(id: string, partial: Partial<Product>): Promise<Product | null> {
  const db = ensureDb();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  db.products[index] = {
    ...db.products[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.products[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = ensureDb();
  const initialLength = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ==========================================
// CATEGORIAS
// ==========================================
export async function getCategories(options?: { isActive?: boolean }): Promise<Category[]> {
  const db = ensureDb();
  let list = [...db.categories];
  if (options?.isActive !== undefined) {
    list = list.filter((c) => c.isActive === options.isActive);
  }
  list.sort((a, b) => a.order - b.order);
  return list;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = ensureDb();
  return db.categories.find((c) => c.id === id) || null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const db = ensureDb();
  return db.categories.find((c) => c.slug === slug) || null;
}

export async function createCategory(
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Category> {
  const db = ensureDb();
  const newCategory: Category = {
    ...data,
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.categories.push(newCategory);
  saveDb(db);
  return newCategory;
}

export async function updateCategory(id: string, partial: Partial<Category>): Promise<Category | null> {
  const db = ensureDb();
  const index = db.categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  db.categories[index] = {
    ...db.categories[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.categories[index];
}

export async function deleteCategory(id: string): Promise<boolean> {
  const db = ensureDb();
  // Verificar se há produtos vinculados
  const hasProducts = db.products.some((p) => p.categoryId === id);
  if (hasProducts) {
    throw new Error('Não é possível excluir categoria que possui produtos vinculados.');
  }

  const initialLength = db.categories.length;
  db.categories = db.categories.filter((c) => c.id !== id);
  if (db.categories.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ==========================================
// CLIENTES (EMPRESAS QUE CONFIAM EM NÓS)
// ==========================================
export async function getClients(options?: { isActive?: boolean }): Promise<Client[]> {
  const db = ensureDb();
  let list = [...db.clients];
  if (options?.isActive !== undefined) {
    list = list.filter((c) => c.isActive === options.isActive);
  }
  list.sort((a, b) => a.order - b.order);
  return list;
}

export async function createClient(
  data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Client> {
  const db = ensureDb();
  const newClient: Client = {
    ...data,
    id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.clients.push(newClient);
  saveDb(db);
  return newClient;
}

export async function updateClient(id: string, partial: Partial<Client>): Promise<Client | null> {
  const db = ensureDb();
  const index = db.clients.findIndex((c) => c.id === id);
  if (index === -1) return null;

  db.clients[index] = {
    ...db.clients[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.clients[index];
}

export async function deleteClient(id: string): Promise<boolean> {
  const db = ensureDb();
  const initialLength = db.clients.length;
  db.clients = db.clients.filter((c) => c.id !== id);
  if (db.clients.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ==========================================
// VÍDEOS DE NOVOS LANÇAMENTOS
// ==========================================
export async function getVideos(options?: {
  isActive?: boolean;
  sortBy?: 'order' | 'recent';
}): Promise<Video[]> {
  const db = ensureDb();
  let list = [...(db.videos || [])];

  if (options?.isActive !== undefined) {
    list = list.filter((v) => v.isActive === options.isActive);
  }

  if (options?.sortBy === 'recent') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // default order: order ASC, then createdAt DESC
    list.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return list;
}

export async function getVideoById(id: string): Promise<Video | null> {
  const db = ensureDb();
  const video = (db.videos || []).find((v) => v.id === id);
  return video || null;
}

export async function createVideo(
  data: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Video> {
  const db = ensureDb();
  if (!db.videos) db.videos = [];

  const newVideo: Video = {
    ...data,
    id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.videos.push(newVideo);
  saveDb(db);
  return newVideo;
}

export async function updateVideo(id: string, partial: Partial<Video>): Promise<Video | null> {
  const db = ensureDb();
  if (!db.videos) db.videos = [];

  const index = db.videos.findIndex((v) => v.id === id);
  if (index === -1) return null;

  db.videos[index] = {
    ...db.videos[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.videos[index];
}

export async function deleteVideo(id: string): Promise<boolean> {
  const db = ensureDb();
  if (!db.videos) db.videos = [];

  const initialLength = db.videos.length;
  db.videos = db.videos.filter((v) => v.id !== id);
  if (db.videos.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ==========================================
// AVALIAÇÕES DE CLIENTES (SOCIAL PROOF)
// ==========================================
export async function getReviews(options?: {
  isActive?: boolean;
  sortBy?: 'order' | 'recent';
}): Promise<Review[]> {
  const db = ensureDb();
  let list = [...(db.reviews || [])];

  if (options?.isActive !== undefined) {
    list = list.filter((r) => r.isActive === options.isActive);
  }

  if (options?.sortBy === 'recent') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // default order: order ASC, then createdAt DESC
    list.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return list;
}

export async function getReviewById(id: string): Promise<Review | null> {
  const db = ensureDb();
  const review = (db.reviews || []).find((r) => r.id === id);
  return review || null;
}

export async function createReview(
  data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Review> {
  const db = ensureDb();
  if (!db.reviews) db.reviews = [];

  const newReview: Review = {
    ...data,
    id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.reviews.push(newReview);
  saveDb(db);
  return newReview;
}

export async function updateReview(id: string, partial: Partial<Review>): Promise<Review | null> {
  const db = ensureDb();
  if (!db.reviews) db.reviews = [];

  const index = db.reviews.findIndex((r) => r.id === id);
  if (index === -1) return null;

  db.reviews[index] = {
    ...db.reviews[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.reviews[index];
}

export async function deleteReview(id: string): Promise<boolean> {
  const db = ensureDb();
  if (!db.reviews) db.reviews = [];

  const initialLength = db.reviews.length;
  db.reviews = db.reviews.filter((r) => r.id !== id);
  if (db.reviews.length !== initialLength) {
    saveDb(db);
    return true;
  }
  return false;
}

// ==========================================
// WHATSAPP E ANALYTICS
// ==========================================
export async function recordWhatsAppClick(
  productId?: string,
  productName?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<WhatsAppInquiry> {
  const db = ensureDb();
  const inquiry: WhatsAppInquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    productId,
    productName,
    createdAt: new Date().toISOString(),
    ipAddress,
    userAgent,
  };

  db.whatsappInquiries.unshift(inquiry);

  // Incrementar contador no produto se houver
  if (productId) {
    const prod = db.products.find((p) => p.id === productId);
    if (prod) {
      prod.inquiriesCount = (prod.inquiriesCount || 0) + 1;
    }
  }

  saveDb(db);
  return inquiry;
}

export async function getWhatsAppInquiries(): Promise<WhatsAppInquiry[]> {
  const db = ensureDb();
  return db.whatsappInquiries;
}

export async function getDashboardStats() {
  const db = ensureDb();
  const totalProducts = db.products.length;
  const activeProducts = db.products.filter((p) => p.isActive).length;
  const totalCategories = db.categories.length;
  const totalClients = db.clients.length;
  const totalInquiries = db.whatsappInquiries.length;

  return {
    totalProducts,
    activeProducts,
    totalCategories,
    totalClients,
    totalInquiries,
    recentInquiries: db.whatsappInquiries.slice(0, 10),
  };
}

// ==========================================
// USUÁRIOS E AUTENTICAÇÃO
// ==========================================
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = ensureDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  const db = ensureDb();
  return db.users.map(({ passwordHash, ...rest }) => rest);
}

export async function createUser(
  name: string,
  email: string,
  plainPassword: string,
  role: 'ADMIN' | 'EDITOR' = 'ADMIN'
): Promise<Omit<User, 'passwordHash'>> {
  const db = ensureDb();
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);

  const { passwordHash: _, ...userSafe } = newUser;
  return userSafe;
}

export async function updateUserPassword(id: string, plainPassword: string): Promise<boolean> {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return false;

  const bcrypt = await import('bcryptjs');
  user.passwordHash = await bcrypt.hash(plainPassword, 10);
  saveDb(db);
  return true;
}
