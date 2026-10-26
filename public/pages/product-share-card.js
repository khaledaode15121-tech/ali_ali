(() => {
  const imageToDataUrl = async (imageUrl, apiBase) => {
    if (!imageUrl) return '';
    try {
      const sourceUrl = new URL(imageUrl, apiBase || window.location.origin).href;
      const response = await fetch(sourceUrl, { mode: 'cors', cache: 'force-cache' });
      if (!response.ok) throw new Error(`Image request failed (${response.status})`);
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Product media is not an image');
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Could not read product image'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Could not load the product photo for its share card:', error);
      return '';
    }
  };

  window.renderProductShareCardBlob = async (product, store = {}, imageUrl = '', apiBase = window.location.origin) => {
    if (!window.htmlToImage?.toBlob) throw new Error('مكتبة إنشاء الصور غير متاحة');

    const primary = /^#[0-9a-f]{6}$/i.test(store.primary_color || '') ? store.primary_color : '#d81b60';
    const secondary = /^#[0-9a-f]{6}$/i.test(store.secondary_color || '') ? store.secondary_color : '#c59b27';
    const storeName = String(store.store_name || 'صالون أم علي للأناقة').trim();
    const storeAddress = String(store.address || '').trim();
    const storePhone = String(store.phone || '').trim();
    const imageDataUrl = await imageToDataUrl(imageUrl || product.image_url || '', apiBase);
    const stockStatus = String(product.stock_status || 'available').toLowerCase();
    const statusText = { available: 'متوفر', reserved: 'محجوز حالياً', out_of_stock: 'غير متوفر' }[stockStatus] || 'غير محدد';
    const formatPrice = (value) => Number(value) > 0 ? `${Number(value).toLocaleString('ar-SY')} ل.س` : 'غير متاح';
    const addText = (parent, tagName, text, cssText) => {
      const element = document.createElement(tagName);
      element.textContent = text;
      element.style.cssText = cssText;
      parent.append(element);
      return element;
    };

    const card = document.createElement('section');
    card.dir = 'rtl';
    card.style.cssText = 'box-sizing:border-box;width:640px;padding:28px;background:#fff8fa;color:#34232a;font-family:Arial,Tahoma,sans-serif;display:flex;flex-direction:column;gap:18px;border:1px solid #f1dce4;border-radius:28px;';
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:16px';
    const brand = document.createElement('div');
    brand.style.cssText = 'display:flex;align-items:center;gap:12px;min-width:0';
    const mark = addText(brand, 'span', 'أ', `flex:0 0 48px;width:48px;height:48px;border-radius:50%;background:${primary};color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700`);
    mark.setAttribute('aria-hidden', 'true');
    const brandCopy = document.createElement('div');
    brandCopy.style.cssText = 'min-width:0;max-width:450px';
    addText(brandCopy, 'strong', storeName, `display:block;color:${primary};font-size:23px;font-weight:800;line-height:1.4`);
    if (storeAddress) addText(brandCopy, 'span', `العنوان: ${storeAddress}`, 'display:block;margin-top:3px;color:#705760;font-size:13px;line-height:1.5;overflow-wrap:anywhere');
    if (storePhone) addText(brandCopy, 'span', `الهاتف: ${storePhone}`, 'display:block;margin-top:2px;color:#705760;font-size:13px;line-height:1.5;direction:ltr;text-align:right');
    addText(brandCopy, 'span', 'تفاصيل المنتج', 'display:block;margin-top:4px;color:#806a73;font-size:14px');
    brand.append(brandCopy);
    addText(header, 'span', 'منتج مميز', `padding:8px 14px;border:1px solid ${secondary};border-radius:999px;color:${secondary};font-size:14px;font-weight:700;white-space:nowrap`);
    header.prepend(brand);
    card.append(header);

    const imageFrame = document.createElement('div');
    imageFrame.style.cssText = 'height:590px;overflow:hidden;border-radius:20px;background:#f5e9ee;display:flex;align-items:center;justify-content:center';
    let productImage = null;
    if (imageDataUrl) {
      const image = document.createElement('img');
      image.src = imageDataUrl;
      image.alt = product.name || 'صورة المنتج';
      image.style.cssText = 'width:100%;height:100%;object-fit:contain';
      imageFrame.append(image);
      productImage = image;
    } else {
      addText(imageFrame, 'span', 'صورة المنتج غير متاحة', 'color:#806a73;font-size:22px;font-weight:700');
    }
    card.append(imageFrame);

    addText(card, 'h1', product.name || 'منتج', `margin:0;color:${primary};font-size:30px;line-height:1.4;font-weight:800`);
    const codeAndCategory = document.createElement('div');
    codeAndCategory.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
    [
      `كود المنتج: ${product.code || product.id || '—'}`,
      [product.category_name, product.subcategory_name].filter(Boolean).join(' / '),
    ].filter(Boolean).forEach((value) => addText(codeAndCategory, 'span', value, 'padding:7px 12px;border-radius:999px;background:#f8eaf0;color:#705760;font-size:14px;font-weight:600'));
    addText(codeAndCategory, 'span', statusText, `padding:7px 12px;border-radius:999px;background:${stockStatus === 'available' ? '#e6f6ec' : '#fff1dd'};color:${stockStatus === 'available' ? '#217243' : '#8b5a00'};font-size:14px;font-weight:700`);
    card.append(codeAndCategory);

    const prices = document.createElement('div');
    prices.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px';
    [
      ['سعر البيع', formatPrice(product.price)],
      ['سعر الإيجار', formatPrice(product.rental_price)],
    ].forEach(([label, value]) => {
      const priceCard = document.createElement('div');
      priceCard.style.cssText = 'padding:15px 18px;border:1px solid #f1dce4;border-radius:16px;background:#fff;text-align:center';
      addText(priceCard, 'span', label, 'display:block;color:#806a73;font-size:14px');
      addText(priceCard, 'strong', value, `display:block;margin-top:6px;color:${primary};font-size:21px`);
      prices.append(priceCard);
    });
    card.append(prices);

    if (product.description?.trim()) {
      const description = document.createElement('p');
      description.textContent = product.description.trim();
      description.style.cssText = 'margin:0;padding:14px 16px;border-radius:14px;background:#fff;color:#59464e;font-size:15px;line-height:1.8;white-space:pre-wrap';
      card.append(description);
    }
    addText(card, 'div', 'للطلب أو الاستفسار عبر واتساب', `padding-top:12px;border-top:1px solid #ead6df;text-align:center;color:${primary};font-size:16px;font-weight:700`);
    document.body.append(card);

    try {
      if (productImage && !productImage.complete) {
        await Promise.race([
          new Promise((resolve) => {
            productImage.addEventListener('load', resolve, { once: true });
            productImage.addEventListener('error', resolve, { once: true });
          }),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      }
      if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))]);
      const imageBlob = await window.htmlToImage.toBlob(card, {
        backgroundColor: '#fff8fa',
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true,
      });
      if (!imageBlob) throw new Error('تعذر تحويل بطاقة المنتج إلى صورة');
      return imageBlob;
    } finally {
      card.remove();
    }
  };
})();
