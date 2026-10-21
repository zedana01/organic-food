/**
 * Porto Organic Food Store Admin Engine
 * Version 1.0.0
 */

let storeData = null;

// FILE UPLOAD TO BASE64 HELPER
function handleFileUpload(fileInput, targetInputId, previewImgId) {
  if (!fileInput.files || !fileInput.files[0]) return;
  const file = fileInput.files[0];

  if (file.size > 2.5 * 1024 * 1024) {
    alert('تنبيه: حجم الصورة كبير نسبياً (أكثر من 2.5 ميجابايت). يُفضل اختيار صورة مضغوطة وسريعة.');
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    document.getElementById(targetInputId).value = base64;
    if (previewImgId) {
      document.getElementById(previewImgId).src = base64;
    }
  };
  reader.readAsDataURL(file);
}

// 1. DATA INITIALIZATION
async function loadStoreData() {
  const local = localStorage.getItem('organic_store_data');
  if (local) {
    try {
      storeData = JSON.parse(local);
    } catch(e) {
      console.error('Error parsing local storage:', e);
    }
  }

  if (!storeData) {
    try {
      const res = await fetch('../data/products.json?v=' + Date.now());
      storeData = await res.json();
    } catch(e) {
      console.error('Error loading products.json:', e);
    }
  }

  if (!storeData) {
    storeData = { storeInfo: {}, categories: [], products: [], pages: {} };
  }
}

// 2. AUTH CONTROLLER
function checkAuth() {
  const authed = sessionStorage.getItem('organic_admin_authed');
  const authScreen = document.getElementById('authScreen');
  if (authed === 'true') {
    authScreen.style.display = 'none';
    initAdminUI();
  } else {
    authScreen.style.display = 'flex';
  }
}

function handleAuth(e) {
  e.preventDefault();
  const pin = document.getElementById('pinInput').value.trim();
  const validPin = (storeData && storeData.storeInfo && storeData.storeInfo.adminPin) ? storeData.storeInfo.adminPin : '1234';

  if (pin === validPin) {
    sessionStorage.setItem('organic_admin_authed', 'true');
    document.getElementById('authScreen').style.display = 'none';
    initAdminUI();
  } else {
    const err = document.getElementById('authError');
    err.style.display = 'block';
    document.getElementById('pinInput').value = '';
    setTimeout(() => { err.style.display = 'none'; }, 4000);
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('organic_admin_authed');
  window.location.reload();
}

// 3. UI INITIALIZATION
function initAdminUI() {
  renderProductsTable();
  renderCategoriesList();
  populateCMSForms();
  populateSettingsForm();
  renderOrdersTable();
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display = 'none');
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.admin-sidebar .menu-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const titles = {
    productsTab: 'إدارة قطع الأزياء والمنتجات',
    categoriesTab: 'الأقسام والبانرات العريضة',
    cmsTab: 'إدارة محتوى الصفحات (CMS)',
    ordersTab: 'سجل طلبات الواتساب',
    settingsTab: 'إعدادات المتجر العامة',
    backupTab: 'النسخ الاحتياطي والبيانات'
  };
  document.getElementById('currentSectionTitle').textContent = titles[tabId] || 'لوحة التحكم';
}

// 4. PRODUCTS MANAGEMENT
function renderProductsTable(filterCat = 'all') {
  const tbody = document.getElementById('productsTableBody');
  let products = storeData.products || [];

  if (filterCat !== 'all') {
    products = products.filter(p => p.category === filterCat);
  }

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94A3B8;">لا توجد قطع مضافة في هذا القسم.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => {
    const imgSrc = (p.image && (p.image.startsWith('data:') || p.image.startsWith('http'))) ? p.image : ('../' + (p.image || 'images/prod_pasta.jpg'));
    return `
      <tr>
        <td>
          <img src="${imgSrc}" alt="${p.name}" style="width:48px; height:58px; object-fit:cover; border-radius:4px; border:1px solid #E2E8F0;">
        </td>
        <td>
          <div style="font-weight:800; color:#1D2124;">${p.name}</div>
          <span style="font-size:11.5px; color:#64748B;">ID: #${p.id}</span>
        </td>
        <td><span style="background:#F1F5F9; border:1px solid #E2E8F0; padding:3px 8px; border-radius:20px; font-size:12px; font-weight:700;">${p.categoryName || p.category}</span></td>
        <td style="font-weight:900; color:#0088CC;">${p.price.toLocaleString()} ر.س</td>
        <td style="color:#94A3B8; text-decoration:line-through;">${p.oldPrice ? (p.oldPrice.toLocaleString() + ' ر.س') : '-'}</td>
        <td><span style="background:#FEE2E2; color:#991B1B; padding:3px 8px; border-radius:4px; font-size:11.5px; font-weight:800;">${p.badge || 'متوفر'}</span></td>
        <td style="font-size:12.5px; color:#64748B;">${p.weight || 'خامات ملكية'}</td>
        <td>
          <div style="display:flex; gap:6px; justify-content:center;">
            <button onclick="openEditProductModal(${p.id})" class="btn btn-secondary" style="padding:6px 10px; font-size:12px;" title="تعديل">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button onclick="deleteProduct(${p.id})" class="btn btn-danger" style="padding:6px 10px; font-size:12px;" title="حذف">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterProductsTable() {
  const cat = document.getElementById('prodCatFilter').value;
  renderProductsTable(cat);
}

function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'إضافة قطعة أزياء جديدة';
  document.getElementById('modalProdId').value = '';
  document.getElementById('modalProdName').value = '';
  document.getElementById('modalProdCat').value = 'abayas';
  document.getElementById('modalProdBadge').value = 'جديد';
  document.getElementById('modalProdPrice').value = '';
  document.getElementById('modalProdOldPrice').value = '';
  document.getElementById('modalProdWeight').value = '';
  document.getElementById('modalProdSpecs').value = '52, 54, 56, 58';
  document.getElementById('modalProdImgUrl').value = 'images/prod_pasta.jpg';
  document.getElementById('modalProdImgPreview').src = '../images/prod_pasta.jpg';
  document.getElementById('modalProdDesc').value = '';
  document.getElementById('productModal').classList.add('active');
}

function openEditProductModal(id) {
  const p = storeData.products.find(item => item.id === id);
  if (!p) return;

  document.getElementById('productModalTitle').textContent = 'تعديل قطعة: ' + p.name;
  document.getElementById('modalProdId').value = p.id;
  document.getElementById('modalProdName').value = p.name;
  document.getElementById('modalProdCat').value = p.category;
  document.getElementById('modalProdBadge').value = p.badge || '';
  document.getElementById('modalProdPrice').value = p.price;
  document.getElementById('modalProdOldPrice').value = p.oldPrice || '';
  document.getElementById('modalProdWeight').value = p.weight || '';
  document.getElementById('modalProdSpecs').value = (p.specs && Array.isArray(p.specs)) ? p.specs.join(', ') : (p.specs || '');
  document.getElementById('modalProdImgUrl').value = p.image || '';
  
  const imgSrc = (p.image && (p.image.startsWith('data:') || p.image.startsWith('http'))) ? p.image : ('../' + (p.image || 'images/prod_pasta.jpg'));
  document.getElementById('modalProdImgPreview').src = imgSrc;
  document.getElementById('modalProdDesc').value = p.desc || '';
  document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

function saveProductModal(e) {
  e.preventDefault();
  const idStr = document.getElementById('modalProdId').value;
  const name = document.getElementById('modalProdName').value.trim();
  const cat = document.getElementById('modalProdCat').value;
  const badge = document.getElementById('modalProdBadge').value.trim();
  const price = parseFloat(document.getElementById('modalProdPrice').value);
  const oldPrice = parseFloat(document.getElementById('modalProdOldPrice').value) || null;
  const weight = document.getElementById('modalProdWeight').value.trim();
  const specsRaw = document.getElementById('modalProdSpecs').value.trim();
  const specs = specsRaw ? specsRaw.split(',').map(s => s.trim()) : ['52', '54', '56', '58'];
  const image = document.getElementById('modalProdImgUrl').value.trim() || 'images/prod_pasta.jpg';
  const desc = document.getElementById('modalProdDesc').value.trim();

  const catNames = {
    veg: 'خضروات عضوية • VEG',
    fruits: 'فواكه طازجة • FRUITS',
    bakery: 'مخبوزات وإفطار • BREAKFAST',
    cooking: 'مؤونة وتوابل • PANTRY',
    meat: 'لحوم المراعي • MEATS'
  };

  if (idStr) {
    // Edit
    const id = parseInt(idStr);
    const idx = storeData.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      storeData.products[idx] = {
        ...storeData.products[idx],
        name, category: cat, categoryName: catNames[cat] || cat,
        badge, price, oldPrice, weight, specs, image, desc
      };
      showAdminToast('تم تعديل بيانات القطعة بنجاح!');
    }
  } else {
    // New
    const newId = storeData.products.length > 0 ? Math.max(...storeData.products.map(p => p.id)) + 1 : 1;
    storeData.products.unshift({
      id: newId,
      name, category: cat, categoryName: catNames[cat] || cat,
      badge, price, oldPrice, weight, specs, image, desc,
      rating: 5, reviews: 1
    });
    showAdminToast('تمت إضافة القطعة بنجاح إلى المتجر!');
  }

  saveAllChangesToLocal(false);
  closeProductModal();
  renderProductsTable();
}

function deleteProduct(id) {
  if (confirm('هل أنتِ متأكدة من حذف هذه القطعة من المتجر؟')) {
    storeData.products = storeData.products.filter(p => p.id !== id);
    saveAllChangesToLocal(false);
    renderProductsTable();
    showAdminToast('تم حذف القطعة بنجاح');
  }
}

// 5. CATEGORIES & WIDE BANNERS MANAGEMENT
function renderCategoriesList() {
  const container = document.getElementById('categoriesListContainer');
  const cats = storeData.categories || [];

  container.innerHTML = cats.map(c => {
    const bannerSrc = (c.banner && (c.banner.startsWith('data:') || c.banner.startsWith('http'))) ? c.banner : ('../' + (c.banner || 'images/banner_fresh.jpg'));
    return `
      <div style="border:1px solid #E2E8F0; border-radius:10px; padding:20px; background:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #F1F5F9; padding-bottom:10px;">
          <h4 style="font-size:16px; font-weight:900; color:#1D2124;">
            <i class="${c.icon || 'fa-solid fa-shirt'}" style="color:#0088CC; margin-left:8px;"></i>
            قسم: ${c.name} (${c.enName || ''})
          </h4>
          <span style="font-size:12px; background:#EFF6FF; color:#1D4ED8; padding:3px 10px; border-radius:20px; font-weight:800;">ID: ${c.id}</span>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">اسم القسم بالعربية</label>
            <input type="text" class="form-control" id="catName_${c.id}" value="${c.name}">
          </div>
          <div class="form-group">
            <label class="form-label">الاسم بالإنجليزية</label>
            <input type="text" class="form-control" id="catEnName_${c.id}" value="${c.enName || ''}">
          </div>
          <div class="form-group full">
            <label class="form-label">وصف القسم (يظهر في الهيدر العريض)</label>
            <textarea class="form-control" id="catDesc_${c.id}" style="min-height:60px;">${c.desc || ''}</textarea>
          </div>
          <div class="form-group full">
            <label class="form-label">صورة البانر العريضة لهذا القسم</label>
            <div class="img-upload-wrap">
              <div class="preview-box" style="width:120px; height:65px;">
                <img id="catBannerPreview_${c.id}" src="${bannerSrc}" alt="Banner">
              </div>
              <div style="flex:1;">
                <input type="text" class="form-control" id="catBanner_${c.id}" value="${c.banner || ''}" style="margin-bottom:8px;">
                <input type="file" accept="image/*" onchange="handleFileUpload(this, 'catBanner_${c.id}', 'catBannerPreview_${c.id}')" style="font-size:12px;">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function saveCategoriesFromForm() {
  const cats = storeData.categories || [];
  cats.forEach(c => {
    const nameEl = document.getElementById(`catName_${c.id}`);
    const enNameEl = document.getElementById(`catEnName_${c.id}`);
    const descEl = document.getElementById(`catDesc_${c.id}`);
    const bannerEl = document.getElementById(`catBanner_${c.id}`);

    if (nameEl) c.name = nameEl.value.trim();
    if (enNameEl) c.enName = enNameEl.value.trim();
    if (descEl) c.desc = descEl.value.trim();
    if (bannerEl) c.banner = bannerEl.value.trim();
  });
}

// 6. CMS FORMS
function populateCMSForms() {
  const pages = storeData.pages || {};
  const home = pages.home || {};
  const info = storeData.storeInfo || {};

  if (document.getElementById('cmsHeroTitle')) document.getElementById('cmsHeroTitle').value = home.heroTitle || 'العبايات الفاخرة';
  if (document.getElementById('cmsHeroSubtitle')) document.getElementById('cmsHeroSubtitle').value = home.heroSubtitle || 'PORTO MODEST - Summer Sale';
  if (document.getElementById('cmsHeroPrice')) document.getElementById('cmsHeroPrice').value = home.heroPrice || '199 ر.س';
  if (document.getElementById('cmsHeroDiscount')) document.getElementById('cmsHeroDiscount').value = home.heroDiscount || '70% OFF';
  if (document.getElementById('cmsHeroImgUrl')) document.getElementById('cmsHeroImgUrl').value = home.heroImage || 'images/hero_transparent.png';
  if (document.getElementById('cmsSaleTitle')) document.getElementById('cmsSaleTitle').value = home.saleBannerTitle || 'أقوى عروض البراندات والأزياء المحتشمة بخصومات تصل حتى 70%';
  if (document.getElementById('cmsSaleSubtitle')) document.getElementById('cmsSaleSubtitle').value = home.saleBannerSubtitle || '';
  if (document.getElementById('cmsTopbarText')) document.getElementById('cmsTopbarText').value = info.topbarAnnouncement || 'توصيل قياسي مجاني للطلبات فوق 299 ر.س لجميع مدن المملكة والخليج';
}

function saveCMSFromForm() {
  if (!storeData.pages) storeData.pages = {};
  if (!storeData.pages.home) storeData.pages.home = {};

  storeData.pages.home.heroTitle = document.getElementById('cmsHeroTitle').value.trim();
  storeData.pages.home.heroSubtitle = document.getElementById('cmsHeroSubtitle').value.trim();
  storeData.pages.home.heroPrice = document.getElementById('cmsHeroPrice').value.trim();
  storeData.pages.home.heroDiscount = document.getElementById('cmsHeroDiscount').value.trim();
  storeData.pages.home.heroImage = document.getElementById('cmsHeroImgUrl').value.trim();
  storeData.pages.home.saleBannerTitle = document.getElementById('cmsSaleTitle').value.trim();
  storeData.pages.home.saleBannerSubtitle = document.getElementById('cmsSaleSubtitle').value.trim();

  if (!storeData.storeInfo) storeData.storeInfo = {};
  storeData.storeInfo.topbarAnnouncement = document.getElementById('cmsTopbarText').value.trim();
}

// 7. SETTINGS FORM
function populateSettingsForm() {
  const info = storeData.storeInfo || {};
  if (document.getElementById('setStoreName')) document.getElementById('setStoreName').value = info.name || 'روزانا فاشن';
  if (document.getElementById('setWhatsapp')) document.getElementById('setWhatsapp').value = info.whatsapp || '01027093535';
  if (document.getElementById('setHotline')) document.getElementById('setHotline').value = info.hotline || '800-440-9000';
  if (document.getElementById('setEmail')) document.getElementById('setEmail').value = info.email || 'care@rozana-fashion.com';
  if (document.getElementById('setCurrency')) document.getElementById('setCurrency').value = info.currency || 'ر.س';
  if (document.getElementById('setAdminPin')) document.getElementById('setAdminPin').value = info.adminPin || '1234';
}

function saveSettingsFromForm() {
  if (!storeData.storeInfo) storeData.storeInfo = {};
  const wa = document.getElementById('setWhatsapp').value.trim();
  let waFormatted = wa.replace(/[^0-9]/g, '');
  if (waFormatted.startsWith('0')) waFormatted = '2' + waFormatted;

  storeData.storeInfo.name = document.getElementById('setStoreName').value.trim();
  storeData.storeInfo.whatsapp = wa;
  storeData.storeInfo.whatsappFormatted = waFormatted;
  storeData.storeInfo.hotline = document.getElementById('setHotline').value.trim();
  storeData.storeInfo.email = document.getElementById('setEmail').value.trim();
  storeData.storeInfo.currency = document.getElementById('setCurrency').value.trim();
  storeData.storeInfo.adminPin = document.getElementById('setAdminPin').value.trim() || '1234';
}

// 8. ORDERS TABLE
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  const sampleOrders = [
    { id: 'ORG-5021', customer: 'عبد الله السالم (الرياض)', items: 'ستيك تندرلوين 450 جم + جزر عضوي 1 كجم', total: '97.50 ر.س', payment: 'توصيل مبرد / مدى', status: 'مؤكد وجاري التوصيل' },
    { id: 'ORG-5020', customer: 'د. ريم الغامدي (الدمام)', items: 'عسل سدر جبلي دوعني 500 جم + جرانولا عضوية', total: '179.00 ر.س', payment: 'دفع إلكتروني Apple Pay', status: 'مكتمل بنجاح' },
    { id: 'ORG-5019', customer: 'فهد المطيري (جدة)', items: 'تشكيلة حمضيات 2 كجم + موز إكوادوري 1 كجم', total: '56.00 ر.س', payment: 'الدفع عند الاستلام', status: 'تم التسليم' }
  ];

  tbody.innerHTML = sampleOrders.map(o => `
    <tr>
      <td style="font-weight:900; color:#0088CC;">${o.id}</td>
      <td style="font-weight:700;">${o.customer}</td>
      <td style="font-size:13px; color:#475569;">${o.items}</td>
      <td style="font-weight:900; color:#0088CC;">${o.total}</td>
      <td><span style="background:#F1F5F9; padding:3px 8px; border-radius:4px; font-size:12px;">${o.payment}</span></td>
      <td><span style="background:#DCFCE7; color:#166534; font-weight:800; padding:4px 10px; border-radius:20px; font-size:12px;">${o.status}</span></td>
    </tr>
  `).join('');
}

// 9. SAVE ALL CHANGES
function saveAllChangesToLocal(showNotify = true) {
  saveCategoriesFromForm();
  saveCMSFromForm();
  saveSettingsFromForm();

  try {
    localStorage.setItem('organic_store_data', JSON.stringify(storeData));
    if (showNotify) showAdminToast('تم حفظ كافة التعديلات بنجاح وربطها بالمتجر!');
  } catch(e) {
    alert('حدث خطأ أثناء الحفظ في التخزين المحلي: ' + e);
  }
}

// 10. BACKUP EXPORT & IMPORT
function exportDataJSON() {
  saveCategoriesFromForm();
  saveCMSFromForm();
  saveSettingsFromForm();

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storeData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `porto_organic_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showAdminToast('تم تصدير النسخة الاحتياطية بنجاح!');
}

function importDataJSON(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.products && imported.categories) {
        storeData = imported;
        localStorage.setItem('organic_store_data', JSON.stringify(storeData));
        initAdminUI();
        showAdminToast('تم استيراد النسخة الاحتياطية وتحديث بيانات المتجر!');
      } else {
        alert('ملف النسخة الاحتياطية غير صالح.');
      }
    } catch(err) {
      alert('فشل قراءة الملف: ' + err);
    }
  };
  reader.readAsText(file);
}

async function resetFactoryDefaults() {
  if (confirm('هل أنتِ متأكدة من استعادة ضبط المصنع الافتراضي؟ سيتم حذف التعديلات غير المحفوظة.')) {
    localStorage.removeItem('organic_store_data');
    storeData = null;
    await loadStoreData();
    initAdminUI();
    showAdminToast('تمت استعادة الضبط الافتراضي للمتجر بنجاح!');
  }
}

// TOAST HELPER
function showAdminToast(msg) {
  const toast = document.getElementById('adminToast');
  const toastMsg = document.getElementById('adminToastMsg');
  if (toast && toastMsg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
  }
}

// BOOTSTRAP
document.addEventListener('DOMContentLoaded', async () => {
  await loadStoreData();
  checkAuth();
});
