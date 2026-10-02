export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'EDITOR';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  model?: string;
  categoryId: string;
  shortDesc: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  mainImage: string;
  galleryImages: string[];
  order: number;
  isActive: boolean;
  inquiriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  logo: string;
  website?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppInquiry {
  id: string;
  productId?: string;
  productName?: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SiteSettings {
  id: string;
  logoUrl: string;
  logoMobileUrl?: string;
  loginLogoUrl?: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroImage?: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  whatsappProductMessage: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  customerName: string;
  companyName?: string;
  avatarUrl?: string;
  rating: number; // 1 to 5
  comment: string;
  reviewDate?: string;
  isVerified?: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  products: Product[];
  clients: Client[];
  videos?: Video[];
  reviews?: Review[];
  whatsappInquiries: WhatsAppInquiry[];
  settings: SiteSettings;
}


