export type Admin = {
  id: string;
  fullName: string;
  email: string;
  role: "super_admin" | "manager" | "content";
};

export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredStyle?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type SubCategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  categoryId: string;
  subCategoryId: string;
  code: string;
  name: string;
  price: number;
  rentalPrice: number;
  stockStatus: "available" | "reserved" | "out_of_stock";
  isFeatured: boolean;
  isActive: boolean;
};

export type ProductMedia = {
  id: string;
  productId: string;
  url: string;
  type: "image" | "video";
  isPrimary: boolean;
};

export type Offer = {
  id: string;
  productId: string;
  title: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
};

export type Order = {
  id: string;
  customerId: string;
  productId: string;
  orderType: "buy" | "rent";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  quantity: number;
  totalPrice: number;
  createdAt: string;
};

export type Reservation = {
  id: string;
  orderId: string;
  appointmentDate: string;
  pickupMethod: "salon" | "delivery";
  note?: string;
};

export type Review = {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment: string;
};

export const adminUsers: Admin[] = [
  { id: "adm_1", fullName: "أم علي", email: "admin@amalaljannah.com", role: "super_admin" },
  { id: "adm_2", fullName: "سارة", email: "manager@amalaljannah.com", role: "manager" },
];

export const categories: Category[] = [
  { id: "cat_1", name: "تجهيز عرائسي", slug: "bridal-setup", description: "فساتين الزفاف والتجهيزات المتكاملة" },
  { id: "cat_2", name: "تأجير فساتين", slug: "dress-rental", description: "فساتين العرس والخطوبة والسهرات للإيجار" },
  { id: "cat_3", name: "إكسسوارات", slug: "accessories", description: "حقائب، أزياء، وأكسسوارات العروس" },
];

export const subCategories: SubCategory[] = [
  { id: "sub_1", categoryId: "cat_1", name: "فساتين زفاف", slug: "wedding-dresses" },
  { id: "sub_2", categoryId: "cat_1", name: "تسريحة ومكياج", slug: "hair-makeup" },
  { id: "sub_3", categoryId: "cat_2", name: "فساتين خطوبة", slug: "engagement-dresses" },
  { id: "sub_4", categoryId: "cat_2", name: "فساتين سهرة", slug: "evening-dresses" },
  { id: "sub_5", categoryId: "cat_3", name: "حقائب عروس", slug: "bridal-bags" },
];

export const products: Product[] = [
  {
    id: "prod_1",
    categoryId: "cat_1",
    subCategoryId: "sub_1",
    code: "OM-2001",
    name: "فستان زفاف ملكي كلاسيكي",
    price: 850,
    rentalPrice: 250,
    stockStatus: "available",
    isFeatured: true,
    isActive: true,
  },
  {
    id: "prod_2",
    categoryId: "cat_2",
    subCategoryId: "sub_3",
    code: "OM-1450",
    name: "فستان خطوبة فخيم",
    price: 640,
    rentalPrice: 200,
    stockStatus: "reserved",
    isFeatured: true,
    isActive: true,
  },
  {
    id: "prod_3",
    categoryId: "cat_3",
    subCategoryId: "sub_5",
    code: "ACC-08",
    name: "حقيبة عروس فاخره",
    price: 220,
    rentalPrice: 75,
    stockStatus: "available",
    isFeatured: false,
    isActive: true,
  },
];

export const productMedia: ProductMedia[] = [
  { id: "media_1", productId: "prod_1", url: "/images/product-om-2001.jpg", type: "image", isPrimary: true },
  { id: "media_2", productId: "prod_2", url: "/images/product-om-1450.jpg", type: "image", isPrimary: true },
  { id: "media_3", productId: "prod_3", url: "/images/product-acc-08.jpg", type: "image", isPrimary: true },
];

export const offers: Offer[] = [
  { id: "offer_1", productId: "prod_1", title: "عرض الموسم الحصري", discountPercent: 15, startsAt: "2026-01-01", endsAt: "2026-03-31" },
  { id: "offer_2", productId: "prod_2", title: "خصم شهر العروس", discountPercent: 10, startsAt: "2026-02-01", endsAt: "2026-04-15" },
];

export const customers: Customer[] = [
  { id: "cust_1", fullName: "ليلى محمد", phone: "966500000001", email: "layla@example.com", preferredStyle: "كلاسيكي" },
  { id: "cust_2", fullName: "سارة علي", phone: "966500000002", email: "sara@example.com", preferredStyle: "فخيم" },
];

export const orders: Order[] = [
  { id: "ord_1", customerId: "cust_1", productId: "prod_1", orderType: "rent", status: "confirmed", quantity: 1, totalPrice: 250, createdAt: "2026-10-10" },
  { id: "ord_2", customerId: "cust_2", productId: "prod_2", orderType: "buy", status: "pending", quantity: 1, totalPrice: 640, createdAt: "2026-10-12" },
];

export const reservations: Reservation[] = [
  { id: "res_1", orderId: "ord_1", appointmentDate: "2026-10-20", pickupMethod: "salon", note: "تجهيزات عرس في قاعة النخبة" },
];

export const reviews: Review[] = [
  { id: "rev_1", productId: "prod_1", customerId: "cust_1", rating: 5, comment: "الفستان كان مثاليًا ومميزًا جدًا" },
  { id: "rev_2", productId: "prod_2", customerId: "cust_2", rating: 4, comment: "التفاصيل ممتازة والخدمة مميزة" },
];

export const storeDataModel = {
  adminUsers,
  categories,
  subCategories,
  products,
  productMedia,
  offers,
  customers,
  orders,
  reservations,
  reviews,
};
