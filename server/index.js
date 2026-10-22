import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, testConnection } from "./db.js";
import { normalizeImageUrl, getDefaultCategoryImage, getDefaultSubcategoryImage } from "./image-utils.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const adminUsername = String(process.env.ADMIN_USERNAME || "kha1512").trim();
const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPasswordHash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();
const adminSessions = new Map();
const adminChallenges = new Map();
const otpLifetimeMs = 10 * 60 * 1000;
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const uploadDirectory = path.resolve("public", "uploads");
const uploadTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const defaultStoreSettings = {
  store_name: "صالون أم علي للأناقة",
  logo_url: "",
  homepage_image_url: "",
  primary_color: "#d81b60",
  secondary_color: "#c59b27",
};
const defaultHomepageContent = {
  slogan: "لأنك تستحقين كل ما هو جميل",
  search_placeholder: "ابحثِ عن فستان أحلامك...",
  nav: {
    login: "تسجيل الدخول",
    cart: "سلة التسوق",
    home: "الرئيسية",
    dresses: "المنتجات",
    offers: "العروض",
    about: "من نحن",
    contact: "اتصل بنا",
  },
  hero: {
    image_url: "",
    badge: "تصاميم حديثة 2025",
    kicker: "خيار العرائس الأول والأرقى",
    title: "أم علي للأناقة",
    category_line: "فساتين عرس - خطوبة - سهرة - أعراس",
    description: "تألقي كالأميرات في ليلتك المميزة. نوفر لكِ أفخم كولكشن لفساتين الأعراس والسهرات المصممة بأعلى معايير الرقي وبأنسب الأسعار للبيع والإيجار.",
    cta: "تسوقي الآن",
  },
  categories: {
    title: "الأقسام الرئيسية",
    description: "خدماتنا المتكاملة لكل مناسبة",
    view_all: "عرض الكل",
  },
  category_actions: {
    offers_image_url: "",
    all_image_url: "",
  },
  products: {
    title: "أحدث الفساتين",
    subtitle: "تألقي بإطلالتك الأجمل مع مجموعة فساتيننا المميزة",
    filters: {
      price_mode: "sale",
      price_ranges: "0-250=أقل من 250;250-500=من 250 إلى 500;500-750=من 500 إلى 750;750+=750 فأكثر",
    },
    status: {
      loading: "جارٍ تحميل المنتجات...",
      empty: "لا توجد منتجات منشورة حالياً.",
      error: "تعذر تحميل المنتجات حالياً. يرجى المحاولة لاحقاً.",
      no_matches: "لا توجد منتجات تطابق الفلتر أو البحث.",
    },
    card: {
      offer: "عرض",
      image_alt: "صورة المنتج",
      no_image: "لا توجد صورة للمنتج",
      missing_name: "منتج",
      code_prefix: "رقم المنتج",
      rental_price: "سعر الإيجار",
      sale_price: "سعر البيع",
      unavailable_price: "غير متاح",
      images_suffix: "صور",
      videos_suffix: "فيديو",
      order: "طلب المنتج",
      availability: "للاستفسار عن التوفر",
      whatsapp_message_template: "🖼️ صورة المنتج:\n{image_url}\n\n✨ تفاصيل المنتج المتاح لدينا ✨\n🔹 اسم المنتج: {product_name}\n📂 القسم الرئيسي: {main_category}\n📁 القسم الفرعي: {subcategory}\n🆔 كود المنتج: {product_code}\n📊 حالة التوفر: {availability}\n💰 الأسعار والخيارات:\n• 🛍️ سعر البيع: {sale_price}\n• 🔑 سعر الإيجار: {rental_price}\n\n🛒 للطلب أو الحجز والاستفسار:\nيرجى الرد مباشرة على هذه الرسالة بتحديد خيارك (شراء أم إيجار) مع كود المنتج، وسيقوم فريقنا بخدمتك فوراً! 🤝\n\n🔗 رابط المنتج:\n{product_url}",
    },
  },
  trust: {
    items: [
      { title: "جودة عالية", subtitle: "أفضل الخامات والتطريز" },
      { title: "توصيل سريع", subtitle: "لكل المحافظات والمناطق" },
      { title: "تشكيلة واسعة", subtitle: "من أجمل التصاميم العصرية" },
      { title: "خدمة عملاء مميزة", subtitle: "تخدمك وتجيبك دائماً" },
    ],
  },
  whatsapp_banner: {
    title: "احصلي على إطلالتك المثالية اليوم",
    description: "فساتيننا ... عنوان الأناقة والجمال لكل عروس",
    cta: "تواصلي معنا عبر الواتساب",
  },
  footer: {
    description: "وجهتك الأولى لكل ما يخص أناقة العروس ومناسبات الخطوبة والاحتفالات. أحدث تشكيلات الفساتين بلمسات راقية وأسعار تنافسية.",
    quick_links: "روابط سريعة",
    address: "بغداد - شارع فلسطين",
    copyright: "جميع الحقوق محفوظة",
  },
  social: {
    tiktok: "",
    instagram: "",
    facebook: "",
    youtube: "",
    whatsapp: "",
  },
  contact: {
    phone: "0986763418",
  },
  colors: {
    background: "#fffafc",
    surface: "#ffffff",
    text: "#333333",
    muted: "#6b7280",
  },
};

const memory = {
  categories: [
    { id: 1, name: "تجهيز عرائسي متكامل", slug: "bridal-setup", description: "فساتين الزفاف والتجهيزات المتكاملة", image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" },
    { id: 2, name: "تأجير فساتين السهرة", slug: "dress-rental", description: "فساتين الحفلات والخطوبة والسهرات للإيجار", image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" },
    { id: 3, name: "إكسسوارات العروس", slug: "bridal-accessories", description: "حقائب وأكسسوارات العروس واللمسات النهائية", image_url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80" },
    { id: 4, name: "ميكب وعطور كوتور", slug: "beauty-luxury", description: "ميك أب فني وعود وعطور مصممة للظهور الفاخر", image_url: "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80" },
  ],
  subcategories: [
    { id: 1, category_id: 1, name: "فساتين زفاف ملكية", slug: "royal-wedding-dresses", image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" },
    { id: 2, category_id: 1, name: "حلة حنة وتراث", slug: "henna-traditional-gowns", image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80" },
    { id: 3, category_id: 1, name: "تسريحة ومكياج", slug: "hair-and-makeup", image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80" },
    { id: 4, category_id: 2, name: "فساتين خطوبة فاخرة", slug: "luxury-engagement-dresses", image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" },
    { id: 5, category_id: 2, name: "فساتين سهرة هادئة", slug: "evening-dresses", image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" },
    { id: 6, category_id: 3, name: "حقائب عروس مخملية", slug: "bridal-bag-sets", image_url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80" },
    { id: 7, category_id: 3, name: "إكسسوارات كريستالية", slug: "crystal-accessories", image_url: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80" },
    { id: 8, category_id: 4, name: "عطور ملكية", slug: "royal-fragrances", image_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80" },
  ],
  products: [
    { id: 1, category_id: 1, subcategory_id: 1, code: "OM-2001", name: "فستان زفاف ملكي كلاسيكي", price: 850, rental_price: 250, stock_status: "available", is_featured: 1, is_active: 1, image_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" },
    { id: 2, category_id: 1, subcategory_id: 2, code: "OM-2003", name: "ثوب حنة ملكي تراثي مطرز", price: 420, rental_price: 95, stock_status: "available", is_featured: 1, is_active: 1, image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80" },
    { id: 3, category_id: 2, subcategory_id: 4, code: "OM-1450", name: "فستان خطوبة فخيم", price: 640, rental_price: 200, stock_status: "reserved", is_featured: 1, is_active: 1, image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" },
    { id: 4, category_id: 2, subcategory_id: 5, code: "OM-2101", name: "فستان سهرة شيفون ناعم", price: 470, rental_price: 180, stock_status: "available", is_featured: 1, is_active: 1, image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80" },
    { id: 5, category_id: 2, subcategory_id: 5, code: "OM-2102", name: "فستان سهرة كريستالي", price: 510, rental_price: 190, stock_status: "out_of_stock", is_featured: 0, is_active: 1, image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80" },
    { id: 6, category_id: 3, subcategory_id: 6, code: "ACC-08", name: "حقيبة عروس فاخره", price: 220, rental_price: 75, stock_status: "available", is_featured: 0, is_active: 1, image_url: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80" },
    { id: 7, category_id: 3, subcategory_id: 7, code: "ACC-15", name: "طقم إكسسوارات كريستالية", price: 180, rental_price: 60, stock_status: "available", is_featured: 0, is_active: 1, image_url: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80" },
    { id: 8, category_id: 4, subcategory_id: 8, code: "BE-120", name: "مجموعة عطور ملكية", price: 330, rental_price: 110, stock_status: "available", is_featured: 1, is_active: 1, image_url: "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80" },
  ],
  customers: [
    { id: 1, full_name: "ليلى محمد", phone: "966500000001", preferred_style: "كلاسيكي" },
    { id: 2, full_name: "سارة علي", phone: "966500000002", preferred_style: "فخيم" },
  ],
  orders: [
    { id: 1, customer_id: 1, product_id: 1, order_type: "rent", status: "confirmed", quantity: 1, total_price: 250, created_at: "2026-10-10" },
    { id: 2, customer_id: 2, product_id: 2, order_type: "buy", status: "pending", quantity: 1, total_price: 640, created_at: "2026-10-12" },
  ],
  admins: [
    { id: 1, full_name: "أم علي", email: "admin@amalaljannah.com", role: "super_admin" },
  ],
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function hashAdminPassword(password) {
  return scryptSync(String(password || ""), String(process.env.ADMIN_PASSWORD_SALT || "ali-ali-admin"), 32).toString("hex");
}
function passwordMatches(password) {
  if (!adminPasswordHash) return false;
  const actual = Buffer.from(hashAdminPassword(password), "hex");
  const expected = Buffer.from(adminPasswordHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function readCookie(req, name) {
  const raw = String(req.headers.cookie || "");
  const entry = raw.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}
function getAdminSession(req) {
  const token = readCookie(req, "admin_session");
  const session = token ? adminSessions.get(token) : null;
  if (!session || session.expiresAt <= Date.now()) {
    if (token) adminSessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + sessionLifetimeMs;
  return session;
}
function isPublicApiRequest(req) {
  const pathName = req.path;
  if (pathName.startsWith("/admin-auth/") || pathName === "/health") return true;
  if (req.method === "GET" && (/^\/(store-settings|categories|subcategories|products)(\/|$)/.test(pathName))) return true;
  if (req.method === "POST" && (pathName === "/auth/login" || pathName === "/customers")) return true;
  return false;
}
function requireAdmin(req, res, next) {
  if (isPublicApiRequest(req)) return next();
  if (!getAdminSession(req)) return res.status(401).json({ message: "تسجيل دخول المدير مطلوب" });
  return next();
}
async function sendAdminOtp(code) {
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && adminEmail;
  if (!smtpConfigured) throw new Error("لم يتم إعداد SMTP لإرسال رمز التحقق");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: "رمز الدخول إلى لوحة تحكم أم علي",
    text: `رمز التحقق الخاص بك هو: ${code}\n\nالرمز صالح لمدة 10 دقائق. إذا لم تطلب تسجيل الدخول فتجاهل هذه الرسالة.`,
  });
}

function normalizeCategoryPayload(body) {
  const { name, slug, description, image_url } = body;
  const safeName = String(name || "").trim();
  return {
    name: safeName,
    slug: slug || safeName.toLowerCase().replace(/\s+/g, "-"),
    description: description || safeName,
    image_url: normalizeImageUrl(image_url, getDefaultCategoryImage(body.id || 1)),
  };
}

function normalizeSubcategoryPayload(body) {
  const { category_id, name, slug, image_url } = body;
  const safeName = String(name || "").trim();
  return {
    category_id: toNumber(category_id),
    name: safeName,
    slug: slug || safeName.toLowerCase().replace(/\s+/g, "-"),
    image_url: normalizeImageUrl(image_url, getDefaultSubcategoryImage(body.id || 1)),
  };
}

function normalizeProductPayload(body) {
  const { category_id, subcategory_id, code, name, description, price, rental_price, stock_status, is_featured, is_active, image_url } = body;
  return {
    category_id: toNumber(category_id),
    subcategory_id: toNumber(subcategory_id),
    code: String(code || "").trim(),
    name: String(name || "").trim() || "منتج جديد",
    description: String(description || "").trim(),
    price: Number(price) || 0,
    rental_price: Number(rental_price) || 0,
    stock_status: ["available", "reserved", "out_of_stock"].includes(String(stock_status || "").toLowerCase())
      ? String(stock_status).toLowerCase()
      : "available",
    is_featured: is_featured ? 1 : 0,
    is_active: is_active !== false ? 1 : 0,
    image_url: normalizeImageUrl(image_url),
  };
}

function hashCustomerPassword(password) {
  return createHash("sha256").update(String(password || "")).digest("hex");
}

function normalizeCustomerPayload(body) {
  return {
    full_name: String(body.full_name || "").trim(),
    phone: String(body.phone || "").trim(),
    password: String(body.password || ""),
    preferred_style: String(body.preferred_style || "").trim(),
  };
}

async function getNextProductCode() {
  try {
    const [[row]] = await db.query("SELECT COALESCE(MAX(CAST(SUBSTRING(code, 4) AS UNSIGNED)), 0) + 1 AS next_id FROM products WHERE code LIKE 'OM-%'");
    return `OM-${String(Number(row?.next_id) || 1).padStart(4, "0")}`;
  } catch {
    const nextId = memory.products.reduce((max, item) => Math.max(max, Number(String(item.code || '').replace(/^OM-/, '')) || 0), 0) + 1;
    return `OM-${String(nextId).padStart(4, "0")}`;
  }
}

function normalizeStoreSettings(body) {
  const storeName = String(body.store_name || "").trim();
  const logoUrl = String(body.logo_url || "").trim();
  const homepageImageUrl = String(body.homepage_image_url || "").trim();
  const primaryColor = String(body.primary_color || "").trim();
  const secondaryColor = String(body.secondary_color || "").trim();
  const homepageContent = normalizeHomepageContent(body.homepage_content);
  const validImageUrl = (value) => !value || /^(https:\/\/|\/uploads\/)[^\s]*$/i.test(value);

  if (!storeName || storeName.length > 120) {
    return { error: "Store name must contain between 1 and 120 characters" };
  }
  if (!validImageUrl(logoUrl) || !validImageUrl(homepageImageUrl)) {
    return { error: "Store images must use an HTTPS URL or an uploaded image path" };
  }
  if (!/^#[0-9a-f]{6}$/i.test(primaryColor) || !/^#[0-9a-f]{6}$/i.test(secondaryColor)) {
    return { error: "Store colors must be six-digit hexadecimal values" };
  }
  if (homepageContent.error) return { error: homepageContent.error };

  return {
    settings: {
      store_name: storeName,
      logo_url: logoUrl,
      homepage_image_url: homepageImageUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      homepage_content: homepageContent.content,
    },
  };
}

function normalizeHomepageContent(input) {
  const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  if (!isRecord(input)) return { content: defaultHomepageContent };

  const mergeText = (defaults, candidate, path = "homepage_content") => {
    const merged = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const value = candidate[key];
      const fieldPath = `${path}.${key}`;
      if (typeof defaultValue === "string") {
        if (value !== undefined && (typeof value !== "string" || value.length > 1200)) {
          throw new Error(`Invalid homepage text field: ${fieldPath}`);
        }
        merged[key] = value === undefined ? defaultValue : value.trim();
      } else if (Array.isArray(defaultValue)) {
        if (value !== undefined && (!Array.isArray(value) || value.length !== defaultValue.length)) {
          throw new Error(`Invalid homepage list field: ${fieldPath}`);
        }
        merged[key] = defaultValue.map((defaultItem, index) => mergeText(defaultItem, value?.[index] || {}, `${fieldPath}[${index}]`));
      } else if (isRecord(defaultValue)) {
        if (value !== undefined && !isRecord(value)) throw new Error(`Invalid homepage group: ${fieldPath}`);
        merged[key] = mergeText(defaultValue, value || {}, fieldPath);
      }
    }
    return merged;
  };

  try {
    const content = mergeText(defaultHomepageContent, input);
    if (content.nav.dresses === "الفساتين") {
      content.nav.dresses = defaultHomepageContent.nav.dresses;
    }
    const legacyTemplate = "السلام عليكم، أود {request_type} المنتج التالي:\nالاسم: {product_name}\nرقم المنتج: {product_code}\nسعر البيع: {sale_price}\nسعر الإيجار: {rental_price}\nالتوفر: {availability}\nالقسم الرئيسي: {main_category}\nالقسم الفرعي: {subcategory}\nصورة المنتج: {image_url}";
    if (content.products.card.whatsapp_message_template === legacyTemplate) {
      content.products.card.whatsapp_message_template = defaultHomepageContent.products.card.whatsapp_message_template;
    }
    const heroGallery = Array.isArray(input?.hero?.gallery) ? input.hero.gallery : [];
    if (heroGallery.length > 30 || heroGallery.some((item) => !item || typeof item.url !== "string" || !/^(https:\/\/|\/uploads\/)[^\s]*$/i.test(item.url) || !["image", "video"].includes(item.media_type))) {
      return { error: "Homepage gallery must contain up to 30 valid images or videos" };
    }
    if (heroGallery.some((item) => item.duration_seconds !== undefined && (!Number.isInteger(Number(item.duration_seconds)) || Number(item.duration_seconds) < 1 || Number(item.duration_seconds) > 60))) {
      return { error: "Each homepage gallery item duration must be between 1 and 60 seconds" };
    }
    content.hero.gallery = heroGallery.map((item) => ({
      url: item.url,
      media_type: item.media_type,
      duration_seconds: item.duration_seconds === undefined ? 5 : Number(item.duration_seconds),
    }));
    const galleryWidth = Number(input?.hero?.gallery_width_percent ?? 66);
    const transitionType = input?.hero?.transition_type ?? "fade";
    if (!Number.isInteger(galleryWidth) || galleryWidth < 40 || galleryWidth > 80) {
      return { error: "Homepage gallery width must be between 40 and 80 percent" };
    }
    if (!["fade", "slide", "zoom", "none"].includes(transitionType)) {
      return { error: "Invalid homepage gallery transition type" };
    }
    content.hero.gallery_width_percent = galleryWidth;
    content.hero.transition_type = transitionType;
    const frameWidth = Number(input?.hero?.frame_width_px ?? 800);
    const frameHeight = Number(input?.hero?.frame_height_px ?? 480);
    if (!Number.isInteger(frameWidth) || frameWidth < 320 || frameWidth > 1600) {
      return { error: "Homepage gallery frame width must be between 320 and 1600 pixels" };
    }
    if (!Number.isInteger(frameHeight) || frameHeight < 180 || frameHeight > 1000) {
      return { error: "Homepage gallery frame height must be between 180 and 1000 pixels" };
    }
    content.hero.frame_width_px = frameWidth;
    content.hero.frame_height_px = frameHeight;
    const imageUrls = [
      content.hero.image_url,
      content.category_actions.offers_image_url,
      content.category_actions.all_image_url,
    ];
    if (imageUrls.some((url) => url && !/^(https:\/\/|\/uploads\/)[^\s]*$/i.test(url))) {
      return { error: "Homepage images must use an HTTPS URL or an uploaded image path" };
    }
    for (const color of Object.values(content.colors)) {
      if (!/^#[0-9a-f]{6}$/i.test(color)) return { error: "Homepage colors must be six-digit hexadecimal values" };
    }
    for (const [network, url] of Object.entries(content.social)) {
      if (url && !/^https:\/\/[^\s]+$/i.test(url)) return { error: `Invalid social link: ${network}` };
    }
    return { content };
  } catch (error) {
    return { error: error.message };
  }
}
async function safeList(entity, fallback) {
  try {
    const [rows] = await db.query(`SELECT * FROM ${entity} ORDER BY id ASC`);
    return rows;
  } catch {
    return fallback;
  }
}

app.use(cors({ origin: true, credentials: true }));
app.use("/api", requireAdmin);
app.use("/uploads", express.static(uploadDirectory));
app.post("/api/uploads", express.raw({ type: "application/octet-stream", limit: "50mb" }), async (req, res) => {
  const mimeType = String(req.header("x-media-type") || "").toLowerCase();
  const extension = uploadTypes[mimeType];
  if (!extension) return res.status(415).json({ message: "Unsupported media type" });
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ message: "An upload file is required" });
  }
  const maxSize = mimeType.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (req.body.length > maxSize) {
    return res.status(413).json({ message: "The uploaded file exceeds the size limit" });
  }

  const filename = `${randomUUID()}.${extension}`;
  try {
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), req.body, { flag: "wx" });
  } catch (error) {
    console.error("Media upload failed:", error);
    return res.status(500).json({ message: "Could not save the uploaded file" });
  }

  return res.status(201).json({
    url: `/uploads/${filename}`,
    media_type: mimeType.startsWith("video/") ? "video" : "image",
  });
});
app.use(express.json({ limit: "10mb" }));

app.post("/api/admin-auth/request-code", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  if (username !== adminUsername || !passwordMatches(req.body?.password)) {
    return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }
  if (!adminEmail) return res.status(503).json({ message: "لم يتم ضبط بريد المدير في إعدادات الخادم" });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const challengeId = randomBytes(24).toString("hex");
  adminChallenges.set(challengeId, { username, code, expiresAt: Date.now() + otpLifetimeMs, attempts: 0 });
  try {
    await sendAdminOtp(code);
    return res.json({ challengeId, message: `تم إرسال رمز التحقق إلى ${adminEmail.replace(/(^.).*(@.*$)/, "$1***$2")}` });
  } catch (error) {
    adminChallenges.delete(challengeId);
    console.error("Admin OTP email failed:", error.message);
    return res.status(503).json({ message: "تعذر إرسال رمز التحقق. تحقق من إعدادات SMTP." });
  }
});

app.post("/api/admin-auth/verify-code", (req, res) => {
  const challengeId = String(req.body?.challengeId || "");
  const code = String(req.body?.code || "").trim();
  const challenge = adminChallenges.get(challengeId);
  if (!challenge || challenge.expiresAt <= Date.now() || challenge.attempts >= 5) {
    adminChallenges.delete(challengeId);
    return res.status(401).json({ message: "رمز التحقق منتهي أو غير صالح" });
  }
  challenge.attempts += 1;
  if (code !== challenge.code) return res.status(401).json({ message: "رمز التحقق غير صحيح" });
  adminChallenges.delete(challengeId);
  const token = randomBytes(32).toString("hex");
  adminSessions.set(token, { username: challenge.username, expiresAt: Date.now() + sessionLifetimeMs });
  setSessionCookie(res, token);
  return res.json({ admin: { username: challenge.username, email: adminEmail } });
});

app.get("/api/admin-auth/me", (req, res) => {
  const session = getAdminSession(req);
  if (!session) return res.status(401).json({ message: "تسجيل دخول المدير مطلوب" });
  return res.json({ admin: { username: session.username, email: adminEmail } });
});

app.post("/api/admin-auth/logout", (req, res) => {
  const token = readCookie(req, "admin_session");
  if (token) adminSessions.delete(token);
  res.setHeader("Set-Cookie", "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  return res.json({ message: "تم تسجيل الخروج" });
});

app.get("/api/health", async (req, res) => {
  const conn = await testConnection();
  res.json({
    ok: !!conn,
    api_version: "hero-gallery-frame-20261021-1",
    capabilities: {
      hero_gallery: true,
      per_item_duration: true,
      transition_type: true,
      gallery_width_percent: true,
      fixed_frame_dimensions: true,
    },
    database: process.env.DB_NAME || "salon_om_ali",
    message: conn ? "Database connection successful" : "Database connection failed, using demo data fallback",
  });
});

app.get("/api/store-settings", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT store_name, logo_url, homepage_image_url, primary_color, secondary_color, homepage_content FROM store_settings WHERE id = 1");
    if (!rows[0]) return res.json({ ...defaultStoreSettings, homepage_content: defaultHomepageContent });
    let homepageContent = defaultHomepageContent;
    if (rows[0].homepage_content) {
      const parsedContent = typeof rows[0].homepage_content === "string"
        ? JSON.parse(rows[0].homepage_content)
        : rows[0].homepage_content;
      const normalizedContent = normalizeHomepageContent(parsedContent);
      if (normalizedContent.error) throw new Error(normalizedContent.error);
      homepageContent = normalizedContent.content;
    }
    if (!homepageContent.hero.image_url && rows[0].homepage_image_url) {
      homepageContent = {
        ...homepageContent,
        hero: { ...homepageContent.hero, image_url: rows[0].homepage_image_url },
      };
    }
    return res.json({ ...defaultStoreSettings, ...rows[0], homepage_content: homepageContent });
  } catch (error) {
    console.error("Failed to load store settings:", error);
    return res.status(503).json({ message: "Store settings are temporarily unavailable" });
  }
});

app.put("/api/store-settings", async (req, res) => {
  const result = normalizeStoreSettings(req.body || {});
  if (result.error) return res.status(400).json({ message: result.error });
  const settings = result.settings;

  try {
    await db.query(
      `INSERT INTO store_settings (id, store_name, logo_url, homepage_image_url, primary_color, secondary_color, homepage_content)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE store_name=VALUES(store_name), logo_url=VALUES(logo_url),
         homepage_image_url=VALUES(homepage_image_url), primary_color=VALUES(primary_color),
         secondary_color=VALUES(secondary_color), homepage_content=VALUES(homepage_content)`,
      [settings.store_name, settings.logo_url, settings.homepage_content.hero.image_url || settings.homepage_image_url, settings.primary_color, settings.secondary_color, JSON.stringify(settings.homepage_content)],
    );
    return res.json(settings);
  } catch (error) {
    console.error("Failed to save store settings:", error);
    return res.status(503).json({ message: "Store settings could not be saved" });
  }
});

app.get("/api/categories", async (req, res) => {
  const rows = await safeList("categories", memory.categories);
  res.json(rows);
});

app.get("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM categories WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Category not found" });
    return res.json(rows[0]);
  } catch {
    const item = memory.categories.find((category) => category.id === Number(id));
    if (!item) return res.status(404).json({ message: "Category not found" });
    return res.json(item);
  }
});

app.post("/api/categories", async (req, res) => {
  const payload = normalizeCategoryPayload(req.body);
  if (!payload.name) return res.status(400).json({ message: "Category name is required" });

  try {
    const [result] = await db.query(
      "INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)",
      [payload.name, payload.slug, payload.description, payload.image_url],
    );
    return res.status(201).json({ id: result.insertId, ...payload });
  } catch {
    const nextId = memory.categories.length ? Math.max(...memory.categories.map((category) => category.id)) + 1 : 1;
    const item = { id: nextId, ...payload };
    memory.categories.push(item);
    return res.status(201).json(item);
  }
});

app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  const payload = normalizeCategoryPayload({ ...req.body, id });
  if (!payload.name) return res.status(400).json({ message: "Category name is required" });

  try {
    await db.query("UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ? WHERE id = ?", [payload.name, payload.slug, payload.description, payload.image_url, id]);
    return res.json({ message: "Category updated" });
  } catch {
    const itemIndex = memory.categories.findIndex((category) => category.id === Number(id));
    if (itemIndex >= 0) {
      memory.categories[itemIndex] = { ...memory.categories[itemIndex], ...payload };
    }
    return res.json({ message: "Category updated in demo mode" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM categories WHERE id = ?", [id]);
    return res.json({ message: "Category deleted" });
  } catch {
    memory.categories = memory.categories.filter((category) => category.id !== Number(id));
    return res.json({ message: "Category deleted in demo mode" });
  }
});

app.get("/api/subcategories", async (req, res) => {
  const rows = await safeList("subcategories", memory.subcategories);
  res.json(rows);
});

app.get("/api/subcategories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM subcategories WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Subcategory not found" });
    return res.json(rows[0]);
  } catch {
    const item = memory.subcategories.find((subcategory) => subcategory.id === Number(id));
    if (!item) return res.status(404).json({ message: "Subcategory not found" });
    return res.json(item);
  }
});

app.post("/api/subcategories", async (req, res) => {
  const payload = normalizeSubcategoryPayload(req.body);
  if (!payload.name) return res.status(400).json({ message: "Subcategory name is required" });

  try {
    const [result] = await db.query(
      "INSERT INTO subcategories (category_id, name, slug, image_url) VALUES (?, ?, ?, ?)",
      [payload.category_id, payload.name, payload.slug, payload.image_url],
    );
    return res.status(201).json({ id: result.insertId, ...payload });
  } catch {
    const nextId = memory.subcategories.length ? Math.max(...memory.subcategories.map((subcategory) => subcategory.id)) + 1 : 1;
    const item = { id: nextId, ...payload };
    memory.subcategories.push(item);
    return res.status(201).json(item);
  }
});

app.put("/api/subcategories/:id", async (req, res) => {
  const { id } = req.params;
  const payload = normalizeSubcategoryPayload({ ...req.body, id });
  if (!payload.name) return res.status(400).json({ message: "Subcategory name is required" });

  try {
    await db.query("UPDATE subcategories SET category_id = ?, name = ?, slug = ?, image_url = ? WHERE id = ?", [payload.category_id, payload.name, payload.slug, payload.image_url, id]);
    return res.json({ message: "Subcategory updated" });
  } catch {
    const itemIndex = memory.subcategories.findIndex((subcategory) => subcategory.id === Number(id));
    if (itemIndex >= 0) {
      memory.subcategories[itemIndex] = { ...memory.subcategories[itemIndex], ...payload };
    }
    return res.json({ message: "Subcategory updated in demo mode" });
  }
});

app.delete("/api/subcategories/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM subcategories WHERE id = ?", [id]);
    return res.json({ message: "Subcategory deleted" });
  } catch {
    memory.subcategories = memory.subcategories.filter((subcategory) => subcategory.id !== Number(id));
    return res.json({ message: "Subcategory deleted in demo mode" });
  }
});

app.get("/api/products", async (req, res) => {
  if (req.query.published === "true") {
    try {
      const [products] = await db.query(
        `SELECT products.*, categories.name AS category_name, subcategories.name AS subcategory_name
         FROM products
         LEFT JOIN categories ON categories.id = products.category_id
         LEFT JOIN subcategories ON subcategories.id = products.subcategory_id
         WHERE products.is_active = 1
         ORDER BY products.is_featured DESC, products.id DESC`,
      );
      if (!products.length) return res.json([]);
      const productIds = products.map((product) => product.id);
      const [media] = await db.query(
        `SELECT product_id, url, media_type, is_primary FROM product_media WHERE product_id IN (${productIds.map(() => "?").join(",")}) ORDER BY is_primary DESC, id ASC`,
        productIds,
      );
      const mediaByProduct = new Map();
      for (const item of media) {
        const productMedia = mediaByProduct.get(item.product_id) || [];
        productMedia.push(item);
        mediaByProduct.set(item.product_id, productMedia);
      }
      return res.json(products.map((product) => ({
        ...product,
        media: mediaByProduct.get(product.id) || [],
      })));
    } catch (error) {
      console.error("Failed to load published products:", error);
      return res.status(503).json({ message: "Published products are temporarily unavailable" });
    }
  }
  const rows = await safeList("products", memory.products);
  const categoryById = new Map(memory.categories.map((category) => [category.id, category.name]));
  const subcategoryById = new Map(memory.subcategories.map((subcategory) => [subcategory.id, subcategory.name]));
  res.json(rows.map((product) => ({
    ...product,
    category_name: product.category_name || categoryById.get(product.category_id) || "",
    subcategory_name: product.subcategory_name || subcategoryById.get(product.subcategory_id) || "",
  })).sort((left, right) => Number(right.is_featured) - Number(left.is_featured) || Number(right.id) - Number(left.id)));
});

app.get("/api/products/next-code", async (req, res) => {
  res.json({ code: await getNextProductCode() });
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Product not found" });
    return res.json(rows[0]);
  } catch {
    const item = memory.products.find((product) => product.id === Number(id));
    if (!item) return res.status(404).json({ message: "Product not found" });
    return res.json(item);
  }
});

app.get("/api/products/:id/media", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT id, product_id, url, media_type, is_primary FROM product_media WHERE product_id = ? ORDER BY is_primary DESC, id ASC",
      [id],
    );
    return res.json(rows);
  } catch {
    const product = memory.products.find((item) => item.id === Number(id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product.media || []);
  }
});

app.get("/api/orders", async (req, res) => {
  const rows = await safeList("orders", memory.orders);
  res.json(rows);
});

app.get("/api/customers", async (req, res) => {
  const rows = await safeList("customers", memory.customers);
  res.json(rows.map(({ password_hash, ...customer }) => customer));
});

app.post("/api/customers", async (req, res) => {
  const payload = normalizeCustomerPayload(req.body);
  if (!payload.full_name || !payload.phone || !payload.password) return res.status(400).json({ message: "اسم العميل والهاتف وكلمة المرور مطلوبة" });
  try {
    const [duplicates] = await db.query("SELECT id FROM customers WHERE full_name=? OR phone=? LIMIT 1", [payload.full_name, payload.phone]);
    if (duplicates.length) return res.status(409).json({ message: "اسم العميل أو رقم الهاتف مستخدم مسبقاً" });
    const [result] = await db.query(
      "INSERT INTO customers (full_name, phone, password, password_hash, preferred_style) VALUES (?, ?, ?, ?, ?)",
      [payload.full_name, payload.phone, payload.password, hashCustomerPassword(payload.password), payload.preferred_style],
    );
    return res.status(201).json({ id: result.insertId, full_name: payload.full_name, phone: payload.phone });
  } catch {
    const duplicate = memory.customers.find((item) => item.full_name === payload.full_name || item.phone === payload.phone);
    if (duplicate) return res.status(409).json({ message: "اسم العميل أو رقم الهاتف مستخدم مسبقاً" });
    const nextId = memory.customers.length ? Math.max(...memory.customers.map((item) => Number(item.id) || 0)) + 1 : 1;
    memory.customers.push({ id: nextId, full_name: payload.full_name, phone: payload.phone, password: payload.password, password_hash: hashCustomerPassword(payload.password), preferred_style: payload.preferred_style });
    return res.status(201).json({ id: nextId, full_name: payload.full_name, phone: payload.phone });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  const payload = normalizeCustomerPayload(req.body);
  try {
    const passwordPart = payload.password ? ", password=?, password_hash=?" : "";
    const values = payload.password
      ? [payload.full_name, payload.phone, payload.preferred_style, payload.password, hashCustomerPassword(payload.password), req.params.id]
      : [payload.full_name, payload.phone, payload.preferred_style, req.params.id];
    await db.query(`UPDATE customers SET full_name=?, phone=?, preferred_style=?${passwordPart} WHERE id=?`, values);
    return res.json({ message: "Customer updated" });
  } catch {
    const index = memory.customers.findIndex((item) => Number(item.id) === Number(req.params.id));
    if (index >= 0) memory.customers[index] = { ...memory.customers[index], full_name: payload.full_name, phone: payload.phone, preferred_style: payload.preferred_style, ...(payload.password ? { password: payload.password, password_hash: hashCustomerPassword(payload.password) } : {}) };
    return res.json({ message: "Customer updated in demo mode" });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try { await db.query("DELETE FROM customers WHERE id=?", [req.params.id]); return res.json({ message: "Customer deleted" }); }
  catch { memory.customers = memory.customers.filter((item) => Number(item.id) !== Number(req.params.id)); return res.json({ message: "Customer deleted in demo mode" }); }
});

app.post("/api/auth/login", async (req, res) => {
  const fullName = String(req.body.full_name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const passwordHash = hashCustomerPassword(req.body.password || "");
  try {
    const password = String(req.body.password || "");
    const [rows] = await db.query("SELECT id, full_name, phone, preferred_style FROM customers WHERE full_name=? AND phone=? AND (password=? OR password_hash=?) LIMIT 1", [fullName, phone, password, passwordHash]);
    if (!rows.length) return res.status(401).json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    return res.json({ customer: rows[0] });
  } catch {
    const customer = memory.customers.find((item) => item.full_name === fullName && item.phone === phone && item.password_hash === passwordHash);
    if (!customer) return res.status(401).json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    const { password_hash, ...safeCustomer } = customer;
    return res.json({ customer: safeCustomer });
  }
});

app.get("/api/admins", async (req, res) => {
  const rows = await safeList("admins", memory.admins);
  res.json(rows);
});

app.post("/api/products", async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  if (!payload.code) payload.code = await getNextProductCode();
  const media = Array.isArray(req.body.media) ? req.body.media : [];

  try {
    const connection = await db.getConnection();
    let result;
    try {
      await connection.beginTransaction();
      [result] = await connection.query(
        `INSERT INTO products (category_id, subcategory_id, code, name, description, price, rental_price, stock_status, is_featured, is_active, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [payload.category_id, payload.subcategory_id, payload.code, payload.name, payload.description, payload.price, payload.rental_price, payload.stock_status, payload.is_featured, payload.is_active, payload.image_url],
      );
      for (const [index, item] of media.entries()) {
        if (typeof item?.url !== "string" || !/^(https?:\/\/|\/uploads\/)/i.test(item.url)) continue;
        const mediaType = item.media_type === "video" ? "video" : "image";
        await connection.query(
          "INSERT INTO product_media (product_id, url, media_type, is_primary) VALUES (?, ?, ?, ?)",
          [result.insertId, item.url, mediaType, mediaType === "image" && !media.slice(0, index).some((previous) => previous?.media_type === "image") ? 1 : 0],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return res.status(201).json({ id: result.insertId, message: "Product created", image_url: payload.image_url });
  } catch {
    const nextId = memory.products.length ? Math.max(...memory.products.map((p) => p.id)) + 1 : 1;
    const newProduct = { id: nextId, ...payload, media };
    memory.products.push(newProduct);
    return res.status(201).json({ id: nextId, message: "Product created in demo mode", image_url: payload.image_url });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const payload = normalizeProductPayload({ ...req.body, id });
  const media = Array.isArray(req.body.media) ? req.body.media : null;

  try {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        `UPDATE products SET category_id=?, subcategory_id=?, code=?, name=?, description=?, price=?, rental_price=?, stock_status=?, is_featured=?, is_active=?, image_url=? WHERE id=?`,
        [payload.category_id, payload.subcategory_id, payload.code, payload.name, payload.description, payload.price, payload.rental_price, payload.stock_status, payload.is_featured, payload.is_active, payload.image_url, id],
      );
      if (media) {
        await connection.query("DELETE FROM product_media WHERE product_id = ?", [id]);
        for (const [index, item] of media.entries()) {
          if (typeof item?.url !== "string" || !/^(https?:\/\/|\/uploads\/)/i.test(item.url)) continue;
          const mediaType = item.media_type === "video" ? "video" : "image";
          await connection.query(
            "INSERT INTO product_media (product_id, url, media_type, is_primary) VALUES (?, ?, ?, ?)",
            [id, item.url, mediaType, mediaType === "image" && !media.slice(0, index).some((previous) => previous?.media_type === "image") ? 1 : 0],
          );
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return res.json({ message: "Product updated", image_url: payload.image_url });
  } catch {
    const productIndex = memory.products.findIndex((p) => p.id === Number(id));
    if (productIndex >= 0) {
      memory.products[productIndex] = { ...memory.products[productIndex], ...payload, ...(media ? { media } : {}) };
    }
    return res.json({ message: "Product updated in demo mode", image_url: payload.image_url });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM products WHERE id = ?", [id]);
    return res.json({ message: "Product deleted" });
  } catch {
    memory.products = memory.products.filter((p) => p.id !== Number(id));
    return res.json({ message: "Product deleted in demo mode" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { customer_id, product_id, order_type, status, quantity, total_price, booking_date, deposit } = req.body;
  const total = Number(total_price) || 0;
  const paid = Number(deposit) || 0;
  const remaining = Math.max(0, total - paid);

  try {
    const [result] = await db.query(
      `INSERT INTO orders (customer_id, product_id, order_type, status, quantity, total_price, deposit, remaining, booking_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [toNumber(customer_id), toNumber(product_id), order_type || "rent", status || "pending", toNumber(quantity, 1), total, paid, remaining, booking_date || null],
    );
    return res.status(201).json({ id: result.insertId, message: "Order created" });
  } catch {
    const nextId = memory.orders.length ? Math.max(...memory.orders.map((o) => o.id)) + 1 : 1;
    memory.orders.push({ id: nextId, customer_id: toNumber(customer_id), product_id: toNumber(product_id), order_type: order_type || "rent", status: status || "pending", quantity: toNumber(quantity, 1), total_price: total, deposit: paid, remaining, booking_date: booking_date || null, created_at: new Date().toISOString() });
    return res.status(201).json({ id: nextId, message: "Order created in demo mode" });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status, total_price, deposit, booking_date } = req.body;
  const total = Number(total_price) || 0;
  const paid = Number(deposit) || 0;

  try {
    await db.query("UPDATE orders SET status=?, total_price=?, deposit=?, remaining=?, booking_date=? WHERE id=?", [status, total, paid, Math.max(0, total - paid), booking_date || null, id]);
    return res.json({ message: "Order updated" });
  } catch {
    const orderIndex = memory.orders.findIndex((order) => order.id === Number(id));
    if (orderIndex >= 0) {
      memory.orders[orderIndex] = { ...memory.orders[orderIndex], status: status || memory.orders[orderIndex].status, total_price: total, deposit: paid, remaining: Math.max(0, total - paid), booking_date: booking_date || memory.orders[orderIndex].booking_date };
    }
    return res.json({ message: "Order updated in demo mode" });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM orders WHERE id = ?", [id]);
    return res.json({ message: "Order deleted" });
  } catch {
    memory.orders = memory.orders.filter((order) => order.id !== Number(id));
    return res.json({ message: "Order deleted in demo mode" });
  }
});

async function startServer() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM products LIKE 'description'");
    if (!columns.length) {
      await db.query("ALTER TABLE products ADD COLUMN description TEXT NULL AFTER name");
    }
    const [imageColumns] = await db.query("SHOW COLUMNS FROM products LIKE 'image_url'");
    if (!imageColumns.length) {
      await db.query("ALTER TABLE products ADD COLUMN image_url TEXT NULL AFTER is_active");
    }
    const [customerPasswordColumns] = await db.query("SHOW COLUMNS FROM customers LIKE 'password_hash'");
    if (!customerPasswordColumns.length) await db.query("ALTER TABLE customers ADD COLUMN password_hash CHAR(64) NULL AFTER phone");
    const [customerPlainPasswordColumns] = await db.query("SHOW COLUMNS FROM customers LIKE 'password'");
    if (!customerPlainPasswordColumns.length) await db.query("ALTER TABLE customers ADD COLUMN password VARCHAR(255) NULL AFTER phone");
    const [customerEmailColumns] = await db.query("SHOW COLUMNS FROM customers LIKE 'email'");
    if (customerEmailColumns.length) await db.query("ALTER TABLE customers DROP COLUMN email");
    const orderColumns = [
      ["deposit", "DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total_price"],
      ["remaining", "DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER deposit"],
      ["booking_date", "DATE NULL AFTER remaining"],
    ];
    for (const [name, definition] of orderColumns) {
      const [columnsForOrder] = await db.query(`SHOW COLUMNS FROM orders LIKE '${name}'`);
      if (!columnsForOrder.length) await db.query(`ALTER TABLE orders ADD COLUMN ${name} ${definition}`);
    }
    await db.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id TINYINT NOT NULL PRIMARY KEY,
        store_name VARCHAR(120) NOT NULL,
        logo_url TEXT NOT NULL,
        homepage_image_url TEXT NOT NULL,
        primary_color CHAR(7) NOT NULL,
        secondary_color CHAR(7) NOT NULL,
        homepage_content LONGTEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [homepageColumns] = await db.query("SHOW COLUMNS FROM store_settings LIKE 'homepage_content'");
    if (!homepageColumns.length) {
      await db.query("ALTER TABLE store_settings ADD COLUMN homepage_content LONGTEXT NULL AFTER secondary_color");
    }
  } catch (error) {
    console.error("Could not ensure the application schema:", error);
  }

  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });
}

startServer();
