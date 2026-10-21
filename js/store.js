/**
 * Porto Organic Food Store Engine
 * Version 1.0.0
 */

let organicStoreData = null;
let organicCart = {};
let organicWishlist = [];

// 1. DATA INITIALIZATION
function loadOrganicStoreData() {
    try {
        const local = localStorage.getItem('organic_store_data');
        if (local) organicStoreData = JSON.parse(local);
    } catch(e) {
        console.error('Error loading organic_store_data:', e);
    }

    try {
        const savedCart = localStorage.getItem('organic_cart');
        if (savedCart) organicCart = JSON.parse(savedCart);
    } catch(e) {}

    try {
        const savedWish = localStorage.getItem('organic_wishlist');
        if (savedWish) organicWishlist = JSON.parse(savedWish);
    } catch(e) {}
}

function saveOrganicCart() {
    try {
        localStorage.setItem('organic_cart', JSON.stringify(organicCart));
    } catch(e) {}
}

function saveOrganicWishlist() {
    try {
        localStorage.setItem('organic_wishlist', JSON.stringify(organicWishlist));
    } catch(e) {}
}

// 2. CART DRAWER OPERATIONS
function toggleCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer && overlay) {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
        if (drawer.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

function closeCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer && overlay) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function addToOrganicCart(id, name, price, img, qty = 1, weight = 'الافتراضي') {
    const key = 'item_' + id;
    if (organicCart[key]) {
        organicCart[key].qty += qty;
    } else {
        organicCart[key] = {
            id: id,
            name: name,
            price: parseFloat(price),
            img: img,
            weight: weight,
            qty: qty
        };
    }
    saveOrganicCart();
    updateOrganicCartUI();
    showToast(`تمت إضافة "${name}" إلى سلة المشتريات`);
    
    // Open drawer
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer && overlay) {
        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function removeOrganicCartItem(key) {
    if (organicCart[key]) {
        delete organicCart[key];
        saveOrganicCart();
        updateOrganicCartUI();
        showToast('تم حذف المنتج من السلة');
    }
}

function changeOrganicCartQty(key, delta) {
    if (organicCart[key]) {
        organicCart[key].qty += delta;
        if (organicCart[key].qty <= 0) {
            delete organicCart[key];
        }
        saveOrganicCart();
        updateOrganicCartUI();
    }
}

function updateOrganicCartUI() {
    let total = 0;
    let count = 0;
    const list = document.getElementById('drawerItemsList');

    if (list) {
        list.innerHTML = '';
        const keys = Object.keys(organicCart);

        if (keys.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; padding:50px 15px; color:#777;">
                    <i class="fa-solid fa-basket-shopping" style="font-size:46px; margin-bottom:14px; color:#C8E6C9;"></i>
                    <p style="font-size:16px; font-weight:700; color:#222529;">سلة المشتريات العضوية فارغة</p>
                    <p style="font-size:13px; color:#888; margin-top:6px;">تصفح منتجاتنا الطازجة وأضف ما تحتاجه لمائدتك</p>
                    <a href="shop.html" class="btn" style="display:inline-block; margin-top:16px; background:#3FA163; color:#fff; padding:9px 24px; border-radius:4px; font-weight:700; font-size:13px; text-decoration:none;">تسوق المنتجات الآن</a>
                </div>
            `;
        } else {
            keys.forEach(k => {
                const item = organicCart[k];
                const itemTotal = item.price * item.qty;
                total += itemTotal;
                count += item.qty;

                const row = document.createElement('div');
                row.className = 'drawer-item-row';
                row.innerHTML = `
                    <img src="${item.img}" class="drawer-item-img" alt="${item.name}">
                    <div class="drawer-item-info">
                        <div class="drawer-item-title">${item.name}</div>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:4px;">
                            <span class="drawer-item-price">${item.price.toFixed(2)} ر.س</span>
                            <div style="display:flex; align-items:center; gap:6px; background:#F1F8E9; border:1px solid #C8E6C9; border-radius:4px; padding:2px 8px;">
                                <button onclick="changeOrganicCartQty('${k}', -1)" style="border:none; background:none; cursor:pointer; font-size:12px; font-weight:800; color:#2E7D32;">-</button>
                                <span style="font-size:12px; font-weight:700; min-width:16px; text-align:center;">${item.qty}</span>
                                <button onclick="changeOrganicCartQty('${k}', 1)" style="border:none; background:none; cursor:pointer; font-size:12px; font-weight:800; color:#2E7D32;">+</button>
                            </div>
                        </div>
                    </div>
                    <button class="drawer-remove-btn" onclick="removeOrganicCartItem('${k}')" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
                `;
                list.appendChild(row);
            });
        }
    } else {
        Object.keys(organicCart).forEach(k => {
            const item = organicCart[k];
            total += (item.price * item.qty);
            count += item.qty;
        });
    }

    // Update counters
    const headerCount = document.getElementById('headerCartCount');
    const mobCount = document.getElementById('mobBottomCartCount');
    const mobCartCount = document.getElementById('mobCartCount');
    const mobCartCount = document.getElementById('mobCartCount');
    const drawerCount = document.getElementById('drawerItemsCount');
    const headerTotal = document.getElementById('headerCartTotal');
    const drawerSubtotal = document.getElementById('drawerSubtotal');

    if (headerCount) headerCount.textContent = count;
    if (mobCount) mobCount.textContent = count;
    if (mobCartCount) mobCartCount.textContent = count;
    if (mobCartCount) mobCartCount.textContent = count;
    if (drawerCount) drawerCount.textContent = count;
    if (headerTotal) headerTotal.textContent = total.toFixed(2) + ' ر.س';
    if (drawerSubtotal) drawerSubtotal.textContent = total.toFixed(2) + ' ر.س';
}

// 3. WHATSAPP CHECKOUT
function proceedOrganicWhatsAppCheckout() {
    const keys = Object.keys(organicCart);
    if (keys.length === 0) {
        showToast('سلة المشتريات العضوية فارغة حالياً!');
        return;
    }

    let phone = '201027093535';
    if (organicStoreData && organicStoreData.storeInfo && organicStoreData.storeInfo.whatsappFormatted) {
        phone = organicStoreData.storeInfo.whatsappFormatted;
    }

    let msg = `*طلب شراء جديد من متجر بورتو أورجانيك* 🌿🍎%0a%0a`;
    let total = 0;
    let idx = 1;

    keys.forEach(k => {
        const item = organicCart[k];
        const lineTotal = item.price * item.qty;
        total += lineTotal;
        msg += `${idx}. *${item.name}*%0a`;
        msg += `   - الكمية: ${item.qty}%0a`;
        if (item.weight && item.weight !== 'الافتراضي') msg += `   - العبوة/الوزن: ${item.weight}%0a`;
        msg += `   - السعر: ${item.price.toFixed(2)} ر.س (الإجمالي: ${lineTotal.toFixed(2)} ر.س)%0a%0a`;
        idx++;
    });

    msg += `-----------------------------------%0a`;
    msg += `💰 *إجمالي الطلب:* ${total.toFixed(2)} ر.س%0a`;
    msg += `🚚 *الشحن المبرد:* توصيل سريع مبرد لضمان الطزاجة%0a%0a`;
    msg += `أرجو تأكيد الطلب وتحديد موعد التوصيل المفضل. شكراً لكم!`;

    const waUrl = `https://wa.me/${phone}?text=${msg}`;
    window.open(waUrl, '_blank');
}

// 4. WISHLIST
function toggleOrganicWishlist(id, name) {
    const idx = organicWishlist.indexOf(id);
    if (idx > -1) {
        organicWishlist.splice(idx, 1);
        showToast(`تمت إزالة "${name || 'المنتج'}" من قائمة المفضلة`);
    } else {
        organicWishlist.push(id);
        showToast(`تمت إضافة "${name || 'المنتج'}" إلى قائمة المفضلة ❤️`);
    }
    saveOrganicWishlist();
}

// 5. TOAST NOTIFICATION
function showToast(msg) {
    let toast = document.getElementById('toastNotify');
    let toastMsg = document.getElementById('toastMsg');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotify';
        toast.className = 'toast-notify';
        toast.style.cssText = 'position:fixed; bottom:25px; left:25px; background:#222529; color:#fff; padding:14px 24px; border-radius:8px; font-weight:700; font-size:14px; box-shadow:0 10px 30px rgba(0,0,0,0.3); z-index:999999; display:flex; align-items:center; gap:10px; opacity:0; transform:translateY(20px); transition:all 0.3s ease; pointer-events:none; border-right:4px solid #3FA163;';
        toast.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#3FA163; font-size:18px;"></i> <span id="toastMsg"></span>';
        document.body.appendChild(toast);
        toastMsg = document.getElementById('toastMsg');
    }

    if (toastMsg) toastMsg.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    toast.style.pointerEvents = 'auto';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.pointerEvents = 'none';
    }, 3200);
}

// 6. NEWSLETTER
function subscribeNewsletter() {
    const input = document.getElementById('newsletterEmail');
    if (input && input.value.trim()) {
        showToast('شكراً لاشتراكك! تم إرسال كود الخصم ORGANIC15 إلى بريدك بنجاح.');
        input.value = '';
    } else {
        showToast('يرجى كتابة البريد الإلكتروني بشكل صحيح.');
    }
}

// 7. LIVE CMS FROM LOCALSTORAGE
function applyOrganicLiveCMS() {
    if (!organicStoreData) return;
    try {
        const info = organicStoreData.storeInfo;
        if (info) {
            const topMsg = document.querySelector('.topbar-msg span');
            if (topMsg && info.topbarAnnouncement) topMsg.textContent = info.topbarAnnouncement;
        }

        const pages = organicStoreData.pages;
        if (pages && pages.home) {
            const h = pages.home;
            const heroTitle = document.querySelector('.organic-hero-text h2');
            if (heroTitle && h.heroTitle) heroTitle.innerHTML = `${h.heroTitle} <br><span style="color:var(--porto-primary);">${h.heroSubtitle || ''}</span>`;
        }
    } catch(e) {
        console.error('Error applying live CMS:', e);
    }
}

// BOOTSTRAP
document.addEventListener('DOMContentLoaded', () => {
    loadOrganicStoreData();
    updateOrganicCartUI();
    applyOrganicLiveCMS();
});


// 8. CATEGORY & TAB FILTERING
function filterCategory(cat) {
    window.location.href = 'category.html?cat=' + encodeURIComponent(cat);
}

function filterTab(cat, btn) {
    const tabBtns = document.querySelectorAll('.filter-tab-btn');
    tabBtns.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const cards = document.querySelectorAll('#productsGrid .product-card');
    cards.forEach(card => {
        const cardCat = card.getAttribute('data-cat') || '';
        let match = false;
        if (cat === 'all') {
            match = true;
        } else if (cat === cardCat) {
            match = true;
        } else if (cat === 'bakery' && (cardCat === 'bakery' || cardCat === 'breakfast')) {
            match = true;
        } else if (cat === 'breakfast' && (cardCat === 'bakery' || cardCat === 'breakfast')) {
            match = true;
        } else if (cat === 'meat' && (cardCat === 'meat' || cardCat === 'frozen')) {
            match = true;
        } else if (cat === 'frozen' && (cardCat === 'meat' || cardCat === 'frozen')) {
            match = true;
        }

        if (match) {
            card.classList.remove('card-hidden');
            card.style.removeProperty('display');
        } else {
            card.classList.add('card-hidden');
            card.style.setProperty('display', 'none', 'important');
        }
    });
}

// Global addToCart compatibility wrapper
function addToCart(arg1, arg2, arg3, arg4, arg5, arg6) {
    if (typeof arg1 === 'string' && (typeof arg2 === 'number' || !isNaN(parseFloat(arg2)))) {
        const id = Math.abs(arg1.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)) % 10000 || 1;
        addToOrganicCart(id, arg1, parseFloat(arg2), arg3 || '', 1, 'الافتراضي');
    } else {
        addToOrganicCart(arg1, arg2, arg3, arg4, arg5 || 1, arg6 || 'الافتراضي');
    }
}


// 9. MOBILE MENU DRAWER
function toggleMobileMenu() {
    const drawer = document.getElementById('mobileMenuDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer && overlay) {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
        if (drawer.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

function closeMobileMenu() {
    const drawer = document.getElementById('mobileMenuDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer && overlay) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function triggerMobileSearch() {
    const input = document.getElementById('mobSearchInput');
    const q = input ? input.value.trim() : '';
    if (q) {
        window.location.href = 'shop.html?q=' + encodeURIComponent(q);
    }
}

function triggerSearch(form) {
    let q = '';
    let cat = 'all';
    if (form) {
        const qInput = form.querySelector('input[type="text"]');
        const catSelect = form.querySelector('select');
        if (qInput) q = qInput.value.trim();
        if (catSelect) cat = catSelect.value;
    } else {
        const qInput = document.getElementById('searchInput');
        const catSelect = document.getElementById('headerSearchCat');
        if (qInput) q = qInput.value.trim();
        if (catSelect) cat = catSelect.value;
    }
    let url = 'shop.html?';
    if (q) url += 'q=' + encodeURIComponent(q) + '&';
    if (cat && cat !== 'all') url += 'cat=' + encodeURIComponent(cat);
    window.location.href = url;
}
