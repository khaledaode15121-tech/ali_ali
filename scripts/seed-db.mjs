import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const dbName = DB_NAME || "salon_om_ali";

const connection = await mysql.createConnection({
  host: DB_HOST || "localhost",
  port: Number(DB_PORT || 3306),
  user: DB_USER || "root",
  password: DB_PASSWORD || "",
  database: dbName,
});

async function seed() {
  await connection.query(`
    INSERT INTO admins (full_name, email, role) VALUES
    ('أم علي', 'admin@amalaljannah.com', 'super_admin'),
    ('سارة', 'manager@amalaljannah.com', 'manager'),
    ('نور', 'content@amalaljannah.com', 'content')
    ON DUPLICATE KEY UPDATE email = VALUES(email);
  `);

  await connection.query(`
    INSERT INTO categories (name, slug, description, image_url) VALUES
    ('تجهيز عرائسي متكامل', 'bridal-setup', 'فساتين الزفاف والتجهيزات المتكاملة للعرسان والعرائس', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'),
    ('تأجير فساتين السهرة', 'dress-rental', 'فساتين الحفلات والخطوبة والسهرات للإيجار وفق المقاسات', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'),
    ('إكسسوارات العروس', 'bridal-accessories', 'حقائب وأكسسوارات العروس واللمسات النهائية', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80'),
    ('ميكب وعطور كوتور', 'beauty-luxury', 'ميك أب فني وعود وعطور مصممة للظهور الفاخر', 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `);

  await connection.query(`
    INSERT INTO subcategories (category_id, name, slug, image_url) VALUES
    (1, 'فساتين زفاف ملكية', 'royal-wedding-dresses', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'),
    (1, 'حلة حنة وتراث', 'henna-traditional-gowns', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80'),
    (1, 'تسريحة ومكياج', 'hair-and-makeup', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'),
    (2, 'فساتين خطوبة فاخرة', 'luxury-engagement-dresses', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'),
    (2, 'فساتين سهرة هادئة', 'evening-dresses', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'),
    (3, 'حقائب عروس مخملية', 'bridal-bag-sets', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80'),
    (3, 'إكسسوارات كريستالية', 'crystal-accessories', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80'),
    (4, 'عطور ملكية', 'royal-fragrances', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `);

  await connection.query(`
    INSERT INTO products (category_id, subcategory_id, code, name, price, rental_price, stock_status, is_featured, is_active, image_url) VALUES
    (1, 1, 'OM-2001', 'فستان زفاف ملكي كلاسيكي', 850.00, 250.00, 'available', 1, 1, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'),
    (1, 2, 'OM-2003', 'ثوب حنة ملكي تراثي مطرز', 420.00, 95.00, 'available', 1, 1, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80'),
    (2, 4, 'OM-1450', 'فستان خطوبة فخيم', 640.00, 200.00, 'reserved', 1, 1, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'),
    (2, 5, 'OM-2101', 'فستان سهرة شيفون ناعم', 470.00, 180.00, 'available', 1, 1, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'),
    (2, 5, 'OM-2102', 'فستان سهرة كريستالي', 510.00, 190.00, 'out_of_stock', 0, 1, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80'),
    (3, 6, 'ACC-08', 'حقيبة عروس فاخره', 220.00, 75.00, 'available', 0, 1, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80'),
    (3, 7, 'ACC-15', 'طقم إكسسوارات كريستالية', 180.00, 60.00, 'available', 0, 1, 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80'),
    (4, 8, 'BE-120', 'مجموعة عطور ملكية', 330.00, 110.00, 'available', 1, 1, 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80')
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `);

  await connection.query(`
    INSERT INTO product_media (product_id, url, media_type, is_primary) VALUES
    (1, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 'image', 1),
    (2, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 'image', 1),
    (3, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'image', 1),
    (4, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'image', 1),
    (5, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'image', 1),
    (6, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80', 'image', 1),
    (7, 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80', 'image', 1),
    (8, 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=900&q=80', 'image', 1)
    ON DUPLICATE KEY UPDATE url = VALUES(url);
  `);

  await connection.query(`
    INSERT INTO offers (product_id, title, discount_percent, starts_at, ends_at) VALUES
    (1, 'عرض الموسم الحصري', 15, '2026-01-01', '2026-03-31'),
    (2, 'خصم مهرجان الحنة', 12, '2026-02-01', '2026-04-15'),
    (3, 'عرض خطوبة الصيف', 10, '2026-03-01', '2026-05-01'),
    (8, 'عرض العطر الملكي', 20, '2026-10-01', '2026-12-31')
    ON DUPLICATE KEY UPDATE title = VALUES(title);
  `);

  await connection.query(`
    INSERT INTO customers (full_name, phone, email, preferred_style) VALUES
    ('ليلى محمد', '966500000001', 'layla@example.com', 'كلاسيكي'),
    ('سارة علي', '966500000002', 'sara@example.com', 'فخيم'),
    ('ريم عبدالله', '966500000003', 'reem@example.com', 'عصري'),
    ('أمينة فواز', '966500000004', 'amena@example.com', 'تراثي')
    ON DUPLICATE KEY UPDATE phone = VALUES(phone);
  `);

  await connection.query(`
    INSERT INTO orders (customer_id, product_id, order_type, status, quantity, total_price) VALUES
    (1, 1, 'rent', 'confirmed', 1, 250.00),
    (2, 3, 'buy', 'pending', 1, 640.00),
    (3, 4, 'rent', 'confirmed', 1, 180.00),
    (4, 6, 'buy', 'completed', 1, 220.00)
    ON DUPLICATE KEY UPDATE status = VALUES(status);
  `);

  await connection.query(`
    INSERT INTO reservations (order_id, appointment_date, pickup_method, note) VALUES
    (1, '2026-10-20', 'salon', 'تجهيزات عرس في قاعة النخبة'),
    (2, '2026-11-05', 'delivery', 'اختيار فستان بحسب لون الأزهار'),
    (3, '2026-11-12', 'salon', 'حجز لمناسبة حفل الخطوبة')
    ON DUPLICATE KEY UPDATE note = VALUES(note);
  `);

  await connection.query(`
    INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES
    (1, 1, 5, 'الفستان كان مثاليًا ومميزًا جدًا'),
    (3, 2, 4, 'التفاصيل ممتازة والخدمة مميزة'),
    (4, 3, 5, 'الفستان كان أنيق ومريح جداً في الحفل'),
    (6, 4, 5, 'الحقيبة فاخرة ومناسبة تماماً للعرس')
    ON DUPLICATE KEY UPDATE comment = VALUES(comment);
  `);

  console.log('Database seeded with expanded demo content and rich visual catalog data.');
  await connection.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
