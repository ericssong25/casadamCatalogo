/**
 * Casa Dam — Catálogo Digital
 * Lógica del catálogo con Alpine.js v3
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('catalog', () => ({
    // === Estado principal ===
    products: [],
    loadingData: true,
    searchQuery: '',
    filters: {
      categories: [],
      usos: [],
      acabados: [],
      colores: []
    },
    priceRange: {
      min: 0,
      max: 50
    },
    advanced: {
      soloDisponibles: false,
      precioMin: 0,
      precioMax: 50,
      anchoMin: null,
      anchoMax: null,
      largoMin: null,
      largoMax: null
    },
    advancedPending: {
      soloDisponibles: false,
      precioMin: 0,
      precioMax: 50,
      anchoMin: null,
      anchoMax: null,
      largoMin: null,
      largoMax: null
    },
    accordion: {
      categoria: true,
      uso: false,
      acabado: false,
      color: false,
      disponibilidad: false,
      precio: false,
      medidas: false
    },
    sortBy: 'relevancia',
    currentPage: 1,
    perPage: 24,
    currency: 'USD',
    mobileFiltersOpen: false,
    _scrollY: 0,
    _gridHeight: 0,

    // === Inicialización ===
    async init() {
      this._loadCurrencyPref();
      var cached = this._loadFromCache();
      if (cached) {
        this.products = cached.products;
        this.loadingData = false;
        this._calcPriceRange();
        this._readURLParams();
      }
      await this._loadFromSupabase();
      if (!cached) {
        this._calcPriceRange();
        this._readURLParams();
        this.loadingData = false;
      }
    },

    _saveToCache() {
      try {
        var data = { products: this.products, ts: Date.now() };
        sessionStorage.setItem('cdam_products', JSON.stringify(data));
      } catch (e) {}
    },

    _loadFromCache() {
      try {
        var raw = sessionStorage.getItem('cdam_products');
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (Date.now() - data.ts > 5 * 60 * 1000) return null; // 5 min TTL
        return data;
      } catch (e) { return null; }
    },

    async _loadFromSupabase() {
      try {
        var supabase = window.supabaseClient;
        if (!supabase) throw new Error('Supabase not available');

        var prodQ = supabase.from('productos').select('*, producto_imagenes(url, es_principal, orden)').order('nombre');
        var catQ = supabase.from('categorias').select('id, nombre').eq('activa', true);
        var confQ = supabase.from('configuracion').select('*').single();

        try {
          var cachedRates = sessionStorage.getItem('cdam_rates');
          if (cachedRates) {
            var r = JSON.parse(cachedRates);
            if (Date.now() - r.ts < 5 * 60 * 1000) {
              window.TASAS_CAMBIO = r.rates;
            }
          }
        } catch (e) {}

        var _a = await Promise.all([prodQ, catQ, confQ]);
        var prodRes = _a[0], catRes = _a[1], confRes = _a[2];

        if (prodRes.error) throw prodRes.error;

        var catMap = {};
        (catRes.data || []).forEach(function (c) { catMap[c.id] = c.nombre; });

        this.products = (prodRes.data || []).map(function (p) {
          return {
            id: p.id,
            codigo_interno: p.codigo_interno,
            nombre: p.nombre,
            descripcion_larga: p.descripcion_larga || '',
            categoria: catMap[p.categoria_id] || p.categoria_id,
            subcategoria: p.subcategoria_id || '',
            ancho: parseFloat(p.ancho) || 0,
            largo: parseFloat(p.largo) || 0,
            espesor: parseFloat(p.espesor) || 0,
            unidad_medida: p.unidad_medida || 'cm',
            color: p.color || '',
            acabado: p.acabado || '',
            material: p.material || '',
            uso: p.uso || 'Ambos',
            marca: p.marca || '',
            m2_por_caja: parseFloat(p.m2_por_caja) || 0,
            piezas_por_caja: p.piezas_por_caja || 0,
            peso: parseFloat(p.peso) || 0,
            precio_usd: parseFloat(p.precio_usd) || 0,
            mostrar_precio: p.mostrar_precio !== false,
            disponible: p.disponible !== false,
            destacado: p.destacado === true,
            imagenes: (p.producto_imagenes || []).map(function (img) {
              return { url: img.url, es_principal: img.es_principal };
            })
          };
        });

        if (confRes.data) {
          window.TASAS_CAMBIO = {
            usd: 1,
            cop: parseFloat(confRes.data.tasa_cop_usd) || 4200,
            ves: parseFloat(confRes.data.tasa_ves_usd) || 36.50
          };
          try {
            sessionStorage.setItem('cdam_rates', JSON.stringify({ rates: window.TASAS_CAMBIO, ts: Date.now() }));
          } catch (e) {}
        }

        this.loadingData = false;
        this._saveToCache();
      } catch (e) {
        console.error('Supabase fallback:', e.message);
        if (!this.products.length) {
          this.products = window.PRODUCTOS || [];
        }
        this.loadingData = false;
      }
    },

    // === Cálculo de rango de precios ===
    _calcPriceRange() {
      const prices = this.products.filter(p => p.mostrar_precio).map(p => p.precio_usd);
      if (prices.length > 0) {
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));
        this.priceRange.min = min;
        this.priceRange.max = max;
        this.advanced.precioMin = min;
        this.advanced.precioMax = max;
        this.advancedPending.precioMin = min;
        this.advancedPending.precioMax = max;
      }
    },

    _loadCurrencyPref() {
      try {
        const saved = localStorage.getItem('casaDamCurrency');
        if (saved && ['USD', 'COP', 'VES'].includes(saved)) {
          this.currency = saved;
        }
      } catch (e) {}
    },

    _readURLParams() {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('categoria');
      if (cat && this.categorias.includes(cat)) {
        this.filters.categories = [cat];
      }
      const q = params.get('q');
      if (q) this.searchQuery = q;
    },

    // === Productos filtrados (computed) ===
    get filteredProducts() {
      let result = [...this.products];

      // Búsqueda por nombre
      const q = this.searchQuery.trim().toLowerCase();
      if (q) {
        result = result.filter(p =>
          p.nombre.toLowerCase().includes(q)
        );
      }

      // Filtro categoría
      if (this.filters.categories.length > 0) {
        result = result.filter(p =>
          this.filters.categories.includes(p.categoria)
        );
      }

      // Filtro uso
      if (this.filters.usos.length > 0) {
        result = result.filter(p =>
          this.filters.usos.includes(p.uso)
        );
      }

      // Filtro acabado
      if (this.filters.acabados.length > 0) {
        result = result.filter(p =>
          this.filters.acabados.includes(p.acabado)
        );
      }

      // Filtro colores
      if (this.filters.colores.length > 0) {
        result = result.filter(p =>
          this.filters.colores.includes(p.color)
        );
      }

      // Filtro disponibilidad
      if (this.advanced.soloDisponibles) {
        result = result.filter(p => p.disponible);
      }

      // Filtro rango de precio
      result = result.filter(p => {
        if (!p.mostrar_precio) return true;
        return p.precio_usd >= this.advanced.precioMin &&
               p.precio_usd <= this.advanced.precioMax;
      });

      // Filtro medidas
      if (this.advanced.anchoMin != null && this.advanced.anchoMin !== '') {
        result = result.filter(p => p.ancho >= parseFloat(this.advanced.anchoMin));
      }
      if (this.advanced.anchoMax != null && this.advanced.anchoMax !== '') {
        result = result.filter(p => p.ancho <= parseFloat(this.advanced.anchoMax));
      }
      if (this.advanced.largoMin != null && this.advanced.largoMin !== '') {
        result = result.filter(p => p.largo >= parseFloat(this.advanced.largoMin));
      }
      if (this.advanced.largoMax != null && this.advanced.largoMax !== '') {
        result = result.filter(p => p.largo <= parseFloat(this.advanced.largoMax));
      }

      // Ordenamiento
      result = this._sortProducts(result);

      return result;
    },

    // === Productos paginados (computed) ===
    get paginatedProducts() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredProducts.slice(start, start + this.perPage);
    },

    // === Total de páginas (computed) ===
    get totalPages() {
      return Math.ceil(this.filteredProducts.length / this.perPage) || 1;
    },

    // === Array de páginas para paginación ===
    get pages() {
      const total = this.totalPages;
      const current = this.currentPage;
      const pages = [];

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
      }

      pages.push(1);
      if (current > 3) pages.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) pages.push('...');
      pages.push(total);

      return pages;
    },

    // === Ordenamiento ===
    _sortProducts(products) {
      const sorted = [...products];
      switch (this.sortBy) {
        case 'precio-asc':
          sorted.sort((a, b) => a.precio_usd - b.precio_usd);
          break;
        case 'precio-desc':
          sorted.sort((a, b) => b.precio_usd - a.precio_usd);
          break;
        case 'alfabetico':
          sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
          break;
        case 'recientes':
          sorted.sort((a, b) => b.id.localeCompare(a.id));
          break;
        default:
          sorted.sort((a, b) => {
            if (a.destacado && !b.destacado) return -1;
            if (!a.destacado && b.destacado) return 1;
            return a.nombre.localeCompare(b.nombre, 'es');
          });
          break;
      }
      return sorted;
    },

    // === Preservación de scroll y altura de grilla ===
    _saveScroll() {
      this._scrollY = window.scrollY;
    },

    _restoreScroll() {
      if (this._scrollY > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: this._scrollY, behavior: 'instant' });
          });
        });
      }
    },

    _saveGridHeight() {
      const el = this.$refs.productGrid;
      if (el) {
        this._gridHeight = el.offsetHeight;
        el.style.minHeight = this._gridHeight + 'px';
      }
    },

    _restoreGridHeight() {
      const el = this.$refs.productGrid;
      if (el) {
        setTimeout(() => { el.style.minHeight = ''; }, 120);
      }
    },

    _preserveStateOnFilter(action) {
      this._saveScroll();
      this._saveGridHeight();
      action();
      this.currentPage = 1;
      this.$nextTick(() => {
        this._restoreScroll();
        this._restoreGridHeight();
      });
    },

    // === Métodos de filtro instantáneo ===
    toggleCategory(cat) {
      this._preserveStateOnFilter(() => {
        const idx = this.filters.categories.indexOf(cat);
        if (idx > -1) {
          this.filters.categories.splice(idx, 1);
        } else {
          this.filters.categories.push(cat);
        }
      });
    },

    toggleUso(u) {
      this._preserveStateOnFilter(() => {
        const idx = this.filters.usos.indexOf(u);
        if (idx > -1) {
          this.filters.usos.splice(idx, 1);
        } else {
          this.filters.usos.push(u);
        }
      });
    },

    toggleAcabado(a) {
      this._preserveStateOnFilter(() => {
        const idx = this.filters.acabados.indexOf(a);
        if (idx > -1) {
          this.filters.acabados.splice(idx, 1);
        } else {
          this.filters.acabados.push(a);
        }
      });
    },

    toggleColor(col) {
      this._preserveStateOnFilter(() => {
        const idx = this.filters.colores.indexOf(col);
        if (idx > -1) {
          this.filters.colores.splice(idx, 1);
        } else {
          this.filters.colores.push(col);
        }
      });
    },

    onSortChange() {
      this._preserveStateOnFilter(() => {});
    },

    // === Filtros avanzados (requieren "Aplicar") ===
    applyAdvancedFilters() {
      this._preserveStateOnFilter(() => {
        this.advanced.soloDisponibles = this.advancedPending.soloDisponibles;
        this.advanced.precioMin = this.advancedPending.precioMin;
        this.advanced.precioMax = this.advancedPending.precioMax;
        this.advanced.anchoMin = this.advancedPending.anchoMin;
        this.advanced.anchoMax = this.advancedPending.anchoMax;
        this.advanced.largoMin = this.advancedPending.largoMin;
        this.advanced.largoMax = this.advancedPending.largoMax;
      });
    },

    // === Acordeón de secciones ===
    toggleAccordion(section) {
      this.accordion[section] = !this.accordion[section];
    },

    // === Indica si hay cambios pendientes en filtros avanzados ===
    get hasPendingAdvanced() {
      const p = this.advancedPending;
      const a = this.advanced;
      return p.soloDisponibles !== a.soloDisponibles ||
             p.precioMin !== a.precioMin ||
             p.precioMax !== a.precioMax ||
             p.anchoMin !== a.anchoMin ||
             p.anchoMax !== a.anchoMax ||
             p.largoMin !== a.largoMin ||
             p.largoMax !== a.largoMax;
    },

    // === Limpiar todos los filtros ===
    clearFilters() {
      this._preserveStateOnFilter(() => {
        this.filters.categories = [];
        this.filters.usos = [];
        this.filters.acabados = [];
        this.filters.colores = [];

        this.advanced.soloDisponibles = false;
        this.advanced.precioMin = this.priceRange.min;
        this.advanced.precioMax = this.priceRange.max;
        this.advanced.anchoMin = null;
        this.advanced.anchoMax = null;
        this.advanced.largoMin = null;
        this.advanced.largoMax = null;

        this.advancedPending.soloDisponibles = false;
        this.advancedPending.precioMin = this.priceRange.min;
        this.advancedPending.precioMax = this.priceRange.max;
        this.advancedPending.anchoMin = null;
        this.advancedPending.anchoMax = null;
        this.advancedPending.largoMin = null;
        this.advancedPending.largoMax = null;

        this.searchQuery = '';
      });
    },

    // === Paginación ===
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    prevPage() {
      this.goToPage(this.currentPage - 1);
    },

    nextPage() {
      this.goToPage(this.currentPage + 1);
    },

    // === Conteos para filtros ===
    countByCategory(cat) {
      return this.products.filter(p => p.categoria === cat).length;
    },

    countByUso(u) {
      return this.products.filter(p => p.uso === u).length;
    },

    countByAcabado(a) {
      return this.products.filter(p => p.acabado === a).length;
    },

    countByColor(col) {
      return this.products.filter(p => p.color === col).length;
    },

    // === Badge de filtros activos por sección del acordeón ===
    countActiveCategorias() {
      return this.filters.categories.length;
    },

    countActiveUsos() {
      return this.filters.usos.length;
    },

    countActiveAcabados() {
      return this.filters.acabados.length;
    },

    countActiveColores() {
      return this.filters.colores.length;
    },

    hasActiveDisponibilidad() {
      return this.advanced.soloDisponibles;
    },

    hasActivePrecio() {
      return this.advanced.precioMin !== this.priceRange.min ||
             this.advanced.precioMax !== this.priceRange.max;
    },

    hasActiveMedidas() {
      return this.advanced.anchoMin != null ||
             this.advanced.anchoMax != null ||
             this.advanced.largoMin != null ||
             this.advanced.largoMax != null;
    },

    // === Mapeo de colores a hex para swatches ===
    colorSwatchStyle(nombre) {
      const map = {
        'Blanco': '#f5f5f5',
        'Beige': '#e8dcc8',
        'Crema': '#f5ecd7',
        'Hueso': '#eee8dc',
        'Gris': '#9e9e9e',
        'Gris Plata': '#c0c0c0',
        'Negro': '#333333',
        'Marrón': '#6d4c2e',
        'Madera Natural': '#c49a6c',
        'Azul': '#7b9ebf',
        'Terracota': '#c87a5a',
        'Grafito': '#555555'
      };
      return map[nombre] || '#e5e7eb';
    },

    // === Lista de opciones disponibles ===
    get categorias() {
      const cats = [...new Set(this.products.map(p => p.categoria))];
      return cats.sort((a, b) => a.localeCompare(b, 'es'));
    },

    get usos() {
      return ['Piso', 'Pared', 'Ambos', 'Exterior'];
    },

    get acabados() {
      const ac = this.products
        .map(p => p.acabado)
        .filter(a => a !== 'N/A');
      return [...new Set(ac)].sort();
    },

    get colores() {
      const cols = this.products.map(p => p.color);
      return [...new Set(cols)].sort((a, b) => a.localeCompare(b, 'es'));
    },

    // === Moneda ===
    setCurrency(mon) {
      this.currency = mon;
      try { localStorage.setItem('casaDamCurrency', mon); } catch (e) {}
    },

    formatPrice(priceUsd, mostrarPrecio) {
      if (!mostrarPrecio) return null;

      const tasas = window.TASAS_CAMBIO || { usd: 1, cop: 4200, ves: 36.50 };
      let converted;
      switch (this.currency) {
        case 'COP':
          converted = Math.round(priceUsd * tasas.cop);
          return '$ ' + converted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        case 'VES':
          converted = priceUsd * tasas.ves;
          return 'Bs. ' + converted.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        default:
          return '$ ' + priceUsd.toFixed(2);
      }
    },

    // === Formateo de medidas ===
    formatMeasures(product) {
      if (product.categoria === 'Pego' || product.categoria === 'Boquilla') {
        return 'Saco ' + product.peso + ' kg';
      }
      if (product.ancho === 0 && product.largo === 0) {
        return product.peso ? (product.peso + ' kg / ' + product.piezas_por_caja + ' unid.') : '';
      }
      const u = product.unidad_medida;
      return [product.ancho, product.largo, product.espesor]
        .map(v => v % 1 === 0 ? v.toString() : v.toFixed(2))
        .join(` ${u === 'mm' ? '×' : '\u00D7'} `) + ' ' + u;
    },

    // === Badges de la card ===
    showDestacadoBadge(p) {
      return p.destacado;
    },

    showNoDisponibleBadge(p) {
      return !p.disponible;
    },

    // === Panel de filtros móvil ===
    toggleMobileFilters() {
      this.mobileFiltersOpen = !this.mobileFiltersOpen;
    },

    closeMobileFilters() {
      this.mobileFiltersOpen = false;
    },

    // === Tiene filtros activos ===
    get hasActiveFilters() {
      return this.filters.categories.length > 0 ||
             this.filters.usos.length > 0 ||
             this.filters.acabados.length > 0 ||
             this.filters.colores.length > 0 ||
             this.advanced.soloDisponibles ||
             this.advanced.precioMin !== this.priceRange.min ||
             this.advanced.precioMax !== this.priceRange.max ||
             this.advanced.anchoMin != null ||
             this.advanced.anchoMax != null ||
             this.advanced.largoMin != null ||
             this.advanced.largoMax != null ||
             this.searchQuery.trim() !== '';
    },

    // === Link de producto ===
    productUrl(product) {
      return 'producto.html?id=' + product.id;
    }
  }));
});
