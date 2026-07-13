/**
 * Casa Dam — Página de producto
 * Componente Alpine.js para la vista de detalle
 */

// Orden estable para imágenes: por `orden` ASC, con tiebreak
// por `created_at` ASC y luego por `id` ASC. Defensivo: se aplica
// siempre del lado cliente aunque la consulta ya traiga ORDER BY.
function sortImagesByOrdenPublic(imgs) {
  return (imgs || [])
    .slice()
    .sort(function (a, b) {
      var oa = a.orden, ob = b.orden;
      oa = (oa == null || isNaN(oa)) ? Number.MAX_SAFE_INTEGER : Number(oa);
      ob = (ob == null || isNaN(ob)) ? Number.MAX_SAFE_INTEGER : Number(ob);
      if (oa !== ob) return oa - ob;
      var ca = a.created_at || '', cb = b.created_at || '';
      if (ca !== cb) return ca < cb ? -1 : ca > cb ? 1 : 0;
      return (a.id || '').localeCompare(b.id || '');
    });
}

document.addEventListener('alpine:init', () => {
  Alpine.data('productDetail', () => ({
    // === Estado ===
    product: null,
    loading: true,
    notFound: false,
    moneda: 'USD',
    ocultarPrecios: false,
    allProducts: [],
    selectedImageIndex: 0,
    relatedProducts: [],
    searchQuery: '',
    searchResults: [],
    searchOpen: false,
    touchStartX: 0,

    // === Inicialización ===
    async init() {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        let saved;
        try { saved = localStorage.getItem('casaDamCurrency'); } catch (e) {}
        if (saved && ['USD', 'COP', 'VES'].includes(saved)) {
          this.moneda = saved;
        }

        await this._loadFromSupabase(id);

        this.loading = false;
        this.$watch('searchQuery', () => this._doSearch());
      } catch (e) {
        console.error('Error al cargar producto:', e);
        this.notFound = true;
        this.loading = false;
      }
    },

    async _loadFromSupabase(id) {
      try {
        var supabase = window.supabaseClient;
        if (!supabase) throw new Error('Supabase not available');

        var _a = await Promise.all([
          supabase.from('productos').select('*, producto_imagenes(*)')
            .eq('id', id)
            .order('orden', { referencedTable: 'producto_imagenes', ascending: true })
            .order('created_at', { referencedTable: 'producto_imagenes', ascending: true })
            .order('id', { referencedTable: 'producto_imagenes', ascending: true })
            .single(),
          supabase.from('productos').select('*, producto_imagenes(*)')
            .order('nombre')
            .order('orden', { referencedTable: 'producto_imagenes', ascending: true })
            .order('created_at', { referencedTable: 'producto_imagenes', ascending: true })
            .order('id', { referencedTable: 'producto_imagenes', ascending: true }),
          supabase.from('categorias').select('id, nombre').eq('activa', true),
          supabase.from('configuracion').select('*').single()
        ]);
        var prodRes = _a[0], allRes = _a[1], catRes = _a[2], confRes = _a[3];

        if (prodRes.error || !prodRes.data) throw new Error('Producto no encontrado');

        var catMap = {};
        (catRes.data || []).forEach(function (c) { catMap[c.id] = c.nombre; });

        function mapProduct(p) {
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
            tipo_borde: p.tipo_borde || '',
            formato_instalacion: p.formato_instalacion || '',
            color: p.color || '',
            acabado: p.acabado || '',
            material: p.material || '',
            uso: Array.isArray(p.uso) ? p.uso : (p.uso ? [p.uso] : []),
            marca: p.marca || '',
            superficie: p.superficie || '',
            grupo_absorcion: p.grupo_absorcion || '',
            coeficiente_friccion: p.coeficiente_friccion || '',
            pei: p.pei || '',
            cantidad_caras: p.cantidad_caras || '',
            variacion_rate: p.variacion_rate || '',
            m2_por_caja: parseFloat(p.m2_por_caja) || 0,
            piezas_por_caja: p.piezas_por_caja || 0,
            peso: parseFloat(p.peso) || 0,
            calidad: p.calidad || '',
            coleccion: p.coleccion || '',
            atributos: p.atributos || '',
            precio_usd: parseFloat(p.precio_usd) || 0,
            mostrar_precio: p.mostrar_precio !== false,
            disponible: p.disponible !== false,
            destacado: p.destacado === true,
            trafico: p.trafico || '',
            terrazas: p.terrazas === true,
            alto_trafico: p.alto_trafico === true,
            garantia_anios: p.garantia_anios || '',
            garantia_unidad: p.garantia_unidad || 'años',
            garantia_condiciones: p.garantia_condiciones || '',
            pais_origen: p.pais_origen || '',
            resistencia_manchas: p.resistencia_manchas === true,
            detalle_instalacion: p.detalle_instalacion || '',
            observaciones: p.observaciones || '',
            politica_imagen: p.politica_imagen || '',
            imagenes: sortImagesByOrdenPublic(p.producto_imagenes || [])
              .map(function (img, idx) {
                return {
                  url: img.url,
                  es_principal: idx === 0,
                  orden: img.orden || (idx + 1)
                };
              })
          };
        }

        this.allProducts = (allRes.data || []).map(mapProduct);
        this.product = this.allProducts.find(function (p) { return p.id === id; });
        if (!this.product) { this.notFound = true; return; }

        document.title = this.product.nombre + ' — Casa Dam';
        this._selectMainImage();
        this._findRelated();

        if (confRes.data) {
          window.TASAS_CAMBIO = {
            usd: 1,
            cop: parseFloat(confRes.data.tasa_cop_usd) || 4200,
            ves: parseFloat(confRes.data.tasa_ves_usd) || 36.50
          };
          this.ocultarPrecios = confRes.data.ocultar_precios === true;
          try {
            sessionStorage.setItem('cdam_config_v2', JSON.stringify({ rates: window.TASAS_CAMBIO, ts: Date.now() }));
          } catch (e) {}
        }
      } catch (e) {
        console.error('Supabase fallback:', e.message);
        this.product = (window.PRODUCTOS || []).find(function (p) { return p.id === id; });
        this.allProducts = window.PRODUCTOS || [];
        if (!this.product) { this.notFound = true; return; }
        document.title = this.product.nombre + ' — Casa Dam';
        this._selectMainImage();
        this._findRelated();
      }
    },

    // === Galería ===
    get imagenes() {
      return this.product ? this.product.imagenes : [];
    },

    get imagenActual() {
      if (this.imagenes.length === 0) return null;
      return this.imagenes[this.selectedImageIndex] || this.imagenes[0];
    },

    _selectMainImage() {
      if (!this.product || !this.product.imagenes.length) return;
      const idx = this.product.imagenes.findIndex(img => img.es_principal);
      this.selectedImageIndex = idx >= 0 ? idx : 0;
    },

    selectImage(i) {
      this.selectedImageIndex = i;
    },

    prevImage() {
      if (this.selectedImageIndex > 0) this.selectedImageIndex--;
    },

    nextImage() {
      if (this.selectedImageIndex < this.imagenes.length - 1) this.selectedImageIndex++;
    },

    // === Zoom ===
    onMouseEnter(el) {
      el.classList.add('product-gallery__main--zoom');
    },

    onMouseMove(e, el) {
      if (!el.classList.contains('product-gallery__main--zoom')) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--zoom-x', x + '%');
      el.style.setProperty('--zoom-y', y + '%');
    },

    onMouseLeave() {
      const el = document.querySelector('.product-gallery__main--zoom');
      if (el) {
        el.classList.remove('product-gallery__main--zoom');
        el.style.removeProperty('--zoom-x');
        el.style.removeProperty('--zoom-y');
      }
    },

    // === Swipe en móvil ===
    onTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
    },

    onTouchEnd(e) {
      const diff = this.touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.nextImage();
        else this.prevImage();
      }
    },

    // === Buscador con dropdown ===
    _doSearch() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) {
        this.searchResults = [];
        this.searchOpen = false;
        return;
      }
      this.searchResults = (this.allProducts || [])
        .filter(p => p.nombre.toLowerCase().includes(q))
        .slice(0, 8);
      this.searchOpen = true;
    },

    closeSearch() {
      this.searchOpen = false;
    },

    onSearchKeydown(e) {
      if (e.key === 'Enter' && this.searchResults.length > 0) {
        this.goToProduct(this.searchResults[0].id);
      }
      if (e.key === 'Escape') {
        this.closeSearch();
        this.$refs.searchInput.blur();
      }
    },

    // === Relacionados ===
    _findRelated() {
      if (!this.product) return;
      const all = this.allProducts || [];
      let related = all
        .filter(p => p.id !== this.product.id && p.subcategoria === this.product.subcategoria);

      if (related.length < 6) {
        const catExtra = all
          .filter(p => p.id !== this.product.id
            && p.categoria === this.product.categoria
            && p.subcategoria !== this.product.subcategoria);
        related = [...related, ...catExtra];
      }

      related.sort((a, b) => {
        if (a.disponible && !b.disponible) return -1;
        if (!a.disponible && b.disponible) return 1;
        if (a.destacado && !b.destacado) return -1;
        if (!a.destacado && b.destacado) return 1;
        return a.nombre.localeCompare(b.nombre, 'es');
      });

      this.relatedProducts = related.slice(0, 6);
    },

    // === Moneda ===
    setCurrency(mon) {
      this.moneda = mon;
      try { localStorage.setItem('casaDamCurrency', mon); } catch (e) {}
    },

    formatPrice(usd, mostrar) {
      if (!mostrar) return null;
      if (this.ocultarPrecios) return null;
      const tasas = window.TASAS_CAMBIO || { usd: 1, cop: 4200, ves: 36.50 };
      let converted;
      switch (this.moneda) {
        case 'COP':
          converted = Math.round(usd * tasas.cop);
          return '$ ' + converted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        case 'VES':
          converted = usd * tasas.ves;
          return 'Bs. ' + converted.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        default:
          return '$ ' + usd.toFixed(2);
      }
    },

    get mostrarPrecios() {
      return this.ocultarPrecios !== true;
    },

    mostrarPrecioProducto(p) {
      if (!p) return false;
      if (this.ocultarPrecios) return false;
      return p.mostrar_precio !== false;
    },

    formatAltPrice(usd, mon) {
      const tasas = window.TASAS_CAMBIO || { usd: 1, cop: 4200, ves: 36.50 };
      let converted;
      switch (mon) {
        case 'COP':
          converted = Math.round(usd * tasas.cop);
          return '$ ' + converted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' COP';
        case 'VES':
          converted = usd * tasas.ves;
          return 'Bs. ' + converted.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' VES';
        default:
          return '$ ' + usd.toFixed(2) + ' USD';
      }
    },

    get otrasMonedas() {
      return ['USD', 'COP', 'VES'].filter(m => m !== this.moneda);
    },

    // === Medidas ===
    formatMeasures(product) {
      if (!product) return '';
      if (product.categoria === 'Pego' || product.categoria === 'Boquilla') {
        return 'Saco ' + product.peso + ' kg';
      }
      if (product.ancho === 0 && product.largo === 0) {
        return product.peso ? product.peso + ' kg / ' + product.piezas_por_caja + ' unid.' : '';
      }
      const u = product.unidad_medida;
      return [product.ancho, product.largo, product.espesor]
        .map(v => v % 1 === 0 ? v.toString() : v.toFixed(2))
        .join(' \u00D7 ') + ' ' + u;
    },

    formatMedidas(product) {
      if (!product) return '';
      const a = parseFloat(product.ancho) || 0;
      const l = parseFloat(product.largo) || 0;
      const e = parseFloat(product.espesor) || 0;
      const u = product.unidad_medida || 'cm';
      const fmt = v => v % 1 === 0 ? v.toString() : v.toFixed(2);
      const parts = [fmt(a), fmt(l)];
      if (e) parts.push(fmt(e));
      return parts.join(' \u00D7 ') + ' ' + u;
    },

    sanitize(text) {
      if (!text) return '';
      return String(text)
        .replace(/\uFFFD/g, function() {
          return ' \u00D7 ';
        })
        .replace(/\s+/g, ' ')
        .trim();
    },

    // === Badges de card (reutilizados en relacionados) ===
    showDestacadoBadge(p) { return p.destacado; },
    showNoDisponibleBadge(p) { return !p.disponible; },

    // === Badge de disponibilidad ===
    get disponibilidadBadge() {
      if (!this.product) return null;
      return this.product.disponible
        ? { text: 'Disponible', cls: 'badge--disponible' }
        : { text: 'No disponible', cls: 'badge--no-disponible' };
    },

    // === Navegación ===
    goToProduct(id) {
      window.location.href = 'producto.html?id=' + id;
    },

    goToCatalog() {
      window.location.href = 'index.html';
    },

    goToCatalogWithCategory(cat) {
      window.location.href = 'index.html?categoria=' + encodeURIComponent(cat);
    },

    // === URL de card de relacionado ===
    relatedProductUrl(p) {
      return 'producto.html?id=' + p.id;
    }
  }));
});
