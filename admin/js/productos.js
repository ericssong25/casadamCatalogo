/**
 * Casa Dam Admin — CRUD de Productos
 */
document.addEventListener('alpine:init', function () {

  // ==========================================
  // Reusable Alert / Confirm Dialog
  // ==========================================
  Alpine.data('alertDialog', function () {
    return {
      open: false,
      title: '',
      message: '',
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      variant: 'warning',
      _resolve: null,

      show: function (opts) {
        opts = opts || {};
        this.title = opts.title || '¿Estás seguro?';
        this.message = opts.message || '';
        this.confirmText = opts.confirmText || 'Confirmar';
        this.cancelText = opts.cancelText || 'Cancelar';
        this.variant = opts.variant || 'warning';
        this.open = true;
        this._resolve = null;
        var self = this;
        this.$nextTick(function () {
          if (self.$refs.cancelBtn) {
            self.$refs.cancelBtn.focus();
          }
        });
        return new Promise(function (resolve) {
          self._resolve = resolve;
        });
      },

      confirm: function () {
        this.open = false;
        if (this._resolve) {
          this._resolve(true);
          this._resolve = null;
        }
      },

      cancel: function () {
        this.open = false;
        if (this._resolve) {
          this._resolve(false);
          this._resolve = null;
        }
      },
    };
  });

  // Global helper — call this from anywhere
  window.showConfirm = function (opts) {
    return new Promise(function (resolve) {
      var el = document.querySelector('[x-data="alertDialog"]');
      if (!el || !el._x_dataStack || !el._x_dataStack[0]) {
        // Fallback if dialog not mounted
        resolve(window.confirm(opts.message || opts.title));
        return;
      }
      var dialog = el._x_dataStack[0];
      dialog.show(opts).then(resolve);
    });
  };

  // ==========================================
  // Productos Module
  // ==========================================
  Alpine.data('productosModule', function () {
    return {
      productos: [],
      categorias: [],
      subcategorias: [],
      configuracion: null,
      loading: true,
      toasts: [],

      // Filters
      search: '',
      filterCategoria: '',
      filterSubcategoria: '',
      filterDisponible: false,
      filterDestacado: false,

      // Pagination
      page: 1,
      perPage: 20,

      // Modal
      prodModalOpen: false,
      prodModalMode: 'create',
      prodForm: {},
      prodStep: 0,
      prodSteps: [
        { label: 'Básico', key: 'basic' },
        { label: 'Medidas', key: 'measures' },
        { label: 'Características', key: 'attrs' },
        { label: 'Empaque', key: 'pack' },
        { label: 'Precio y estado', key: 'price' },
        { label: 'Imágenes', key: 'images' },
        { label: 'Técnicas', key: 'tech' }
      ],
      prodSaving: false,
      prodFormDirty: false,
      prodErrors: {},

      // Images
      prodImages: [],

      // Delete
      deleteTarget: null,
      deleteOpen: false,
      deleting: false,

      // === INIT ===
      async init() {
        await Promise.all([this.loadProductos(), this.loadCategorias(), this.loadConfig()]);
      },

      // === LOAD ===
      async loadProductos() {
        this.loading = true;
        try {
          var r = await window.supabaseClient.from('productos').select('*, producto_imagenes(*)').order('created_at', { ascending: false });
          if (r.error) throw r.error;
          this.productos = (r.data || []).map(function (p) {
            p.imagen_principal = (p.producto_imagenes || []).find(function (i) { return i.es_principal; });
            if (!p.imagen_principal && p.producto_imagenes && p.producto_imagenes.length) {
              p.imagen_principal = p.producto_imagenes[0];
            }
            return p;
          });
        } catch (e) {
          console.error('Productos load error:', e);
          this.showToast('Error al cargar productos: ' + (e.message || ''), 'error');
        }
        this.loading = false;
      },

      async loadCategorias() {
        try {
          // Admin sees ALL categories (no activa filter)
          var r = await window.supabaseClient.from('categorias').select('*').order('orden');
          if (r.error) throw r.error;
          this.categorias = r.data || [];
        } catch (e) {
          console.error('Categorías load error (productos):', e);
          this.showToast('Error al cargar categorías', 'error');
        }
      },

      async onChangeCategoria() {
        if (!this.filterCategoria) { this.subcategorias = []; this.filterSubcategoria = ''; return; }
        try {
          var r = await window.supabaseClient.from('subcategorias').select('*').eq('categoria_id', this.filterCategoria).order('orden');
          if (r.error) throw r.error;
          this.subcategorias = r.data || [];
          if (!this.subcategorias.find(function (s) { return s.id === this.filterSubcategoria; }.bind(this))) {
            this.filterSubcategoria = '';
          }
        } catch (e) {
          console.error('Subcategorías filter error:', e);
          this.showToast('Error al cargar subcategorías', 'error');
        }
      },

      async loadConfig() {
        try {
          var r = await window.supabaseClient.from('configuracion').select('*').single();
          if (!r.error && r.data) this.configuracion = r.data;
        } catch (e) {}
      },

      // === COMPUTED ===
      get filteredProductos() {
        var list = this.productos;
        var q = this.search.trim().toLowerCase();
        if (q) list = list.filter(function (p) { return p.nombre.toLowerCase().includes(q) || p.codigo_interno.toLowerCase().includes(q); });
        if (this.filterCategoria) list = list.filter(function (p) { return p.categoria_id === this.filterCategoria; }.bind(this));
        if (this.filterSubcategoria) list = list.filter(function (p) { return p.subcategoria_id === this.filterSubcategoria; }.bind(this));
        if (this.filterDisponible) list = list.filter(function (p) { return p.disponible; });
        if (this.filterDestacado) list = list.filter(function (p) { return p.destacado; });
        return list;
      },

      get paginatedProductos() {
        var start = (this.page - 1) * this.perPage;
        return this.filteredProductos.slice(start, start + this.perPage);
      },

      get totalPages() {
        return Math.ceil(this.filteredProductos.length / this.perPage) || 1;
      },

      get pages() {
        var t = this.totalPages, c = this.page, p = [];
        for (var i = 1; i <= t; i++) p.push(i);
        return p;
      },

      // === PRODUCT MODAL ===
      openProdModal(mode, prod) {
        this.prodModalMode = mode;
        this.prodFormDirty = false;

        if ((mode === 'edit' || mode === 'view') && prod) {
          this.prodForm = {
            id: prod.id,
            codigo_interno: sanitizeText(prod.codigo_interno),
            nombre: sanitizeText(prod.nombre),
            descripcion_larga: sanitizeText(prod.descripcion_larga || ''),
            descripcion_larga_hadBadEncoding: hadBadEncoding(prod.descripcion_larga || ''),
            categoria_id: prod.categoria_id || '',
            subcategoria_id: prod.subcategoria_id || '',
            ancho: prod.ancho != null && prod.ancho !== 0 ? prod.ancho : '',
            largo: prod.largo != null && prod.largo !== 0 ? prod.largo : '',
            espesor: prod.espesor != null && prod.espesor !== 0 ? prod.espesor : '',
            unidad_medida: prod.unidad_medida || 'cm',
            tipo_borde: sanitizeText(prod.tipo_borde || ''),
            formato_instalacion: sanitizeText(prod.formato_instalacion || ''),
            color: sanitizeText(prod.color || ''),
            acabado: sanitizeText(prod.acabado || ''),
            material: sanitizeText(prod.material || ''),
            uso: prod.uso || 'Ambos',
            marca: sanitizeText(prod.marca || ''),
            tecnologia: sanitizeText(prod.tecnologia || ''),
            superficie: sanitizeText(prod.superficie || ''),
            grupo_absorcion: sanitizeText(prod.grupo_absorcion || ''),
            clasificacion_ansi: sanitizeText(prod.clasificacion_ansi || ''),
            coeficiente_friccion: sanitizeText(prod.coeficiente_friccion || ''),
            pei: prod.pei != null && prod.pei !== 0 ? prod.pei : '',
            cantidad_caras: prod.cantidad_caras != null && prod.cantidad_caras !== 0 ? prod.cantidad_caras : '',
            variacion_rate: prod.variacion_rate != null && prod.variacion_rate !== 0 ? prod.variacion_rate : '',
            m2_por_caja: prod.m2_por_caja != null && prod.m2_por_caja !== 0 ? prod.m2_por_caja : '',
            piezas_por_caja: prod.piezas_por_caja != null && prod.piezas_por_caja !== 0 ? prod.piezas_por_caja : '',
            peso: prod.peso != null && prod.peso !== 0 ? prod.peso : '',
            calidad: sanitizeText(prod.calidad || ''),
            coleccion: sanitizeText(prod.coleccion || ''),
            precio_usd: prod.precio_usd != null ? prod.precio_usd : '',
            mostrar_precio: prod.mostrar_precio !== false,
            disponible: prod.disponible !== false,
            destacado: prod.destacado === true,
            trafico: sanitizeText(prod.trafico || ''),
            terrazas: prod.terrazas === true,
            alto_trafico: prod.alto_trafico === true,
            garantia_anios: prod.garantia_anios != null && prod.garantia_anios !== 0 ? prod.garantia_anios : '',
            garantia_unidad: prod.garantia_unidad || 'años',
            garantia_condiciones: sanitizeText(prod.garantia_condiciones || ''),
            pais_origen: sanitizeText(prod.pais_origen || ''),
            resistencia_manchas: prod.resistencia_manchas === true,
            detalle_instalacion: sanitizeText(prod.detalle_instalacion || ''),
            observaciones: sanitizeText(prod.observaciones || ''),
            politica_imagen: sanitizeText(prod.politica_imagen || '')
          };
          this.prodImages = (prod.producto_imagenes || []).map(function (i) { return { id: i.id, url: i.url, es_principal: i.es_principal, saved: true, file: null, preview: i.url, toDelete: false }; });
        } else {
          this.prodForm = {
            id: null, codigo_interno: '', nombre: '', descripcion_larga: '', descripcion_larga_hadBadEncoding: false,
            categoria_id: '', subcategoria_id: '',
            ancho: '', largo: '', espesor: '', unidad_medida: 'cm',
            tipo_borde: '', formato_instalacion: '',
            color: '', acabado: '', material: '', uso: 'Ambos', marca: '',
            tecnologia: '', superficie: '', grupo_absorcion: '',
            clasificacion_ansi: '', coeficiente_friccion: '', pei: '',
            cantidad_caras: '', variacion_rate: '',
            m2_por_caja: '', piezas_por_caja: '', peso: '',
            calidad: '', coleccion: '',
            precio_usd: '', mostrar_precio: true,
            disponible: true, destacado: false,
            trafico: '', terrazas: false, alto_trafico: false,
            garantia_anios: '', garantia_unidad: 'años', garantia_condiciones: '',
            pais_origen: '', resistencia_manchas: false,
            detalle_instalacion: '', observaciones: '', politica_imagen: ''
          };
          this.prodImages = [];
        }
        this.prodStep = 0;
        this.prodModalOpen = true;
        this.$nextTick(function () { if (window.lucide) lucide.createIcons(); });
      },

      openProdModalFromView() {
        var prod = this.prodForm;
        this.prodModalMode = 'edit';
        this.prodFormDirty = false;
        this.prodStep = 0;
        this.$nextTick(function () { if (window.lucide) lucide.createIcons(); });
      },

      get uniqueAcabados() {
        var set = {};
        this.productos.forEach(function (p) { if (p.acabado) set[p.acabado.trim()] = true; });
        return Object.keys(set).sort();
      },
      get uniqueMateriales() {
        var set = {};
        this.productos.forEach(function (p) { if (p.material) set[p.material.trim()] = true; });
        return Object.keys(set).sort();
      },
      get uniqueMarcas() {
        var set = {};
        this.productos.forEach(function (p) { if (p.marca) set[p.marca.trim()] = true; });
        return Object.keys(set).sort();
      },
      colorToHex(color) {
        if (!color) return null;
        var c = color.trim();
        if (/^#[0-9a-fA-F]{3,6}$/.test(c)) return c.length === 4 ? '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c;
        var map = {
          'blanco': '#ffffff', 'beige': '#d4c5a9', 'gris': '#6b7280',
          'negro': '#000000', 'marron': '#6f4e37', 'marrón': '#6f4e37',
          'crema': '#fffdd0', 'multicolor': null, 'natural': '#c4b59a',
          'rojo': '#cc0000', 'azul': '#0000cc', 'verde': '#008000',
          'amarillo': '#ffcc00', 'naranja': '#ff8800', 'rosa': '#ffc0cb',
          'miel': '#d4a574', 'cafe': '#6f4e37', 'café': '#6f4e37',
          'ivory': '#f8f4e3', 'avellana': '#8b6f47', 'wengue': '#3d2817',
          'almendra': '#efdfbb', 'terra': '#c87553', 'cenizo': '#8b8680',
          'plomo': '#5a5a5a', 'camel': '#c19a6b', 'claro': '#e5e5e5',
          'oscuro': '#2a2a2a', 'encina': '#a47551', 'tilo': '#d5c099',
          'bruno': '#4a2c2a', 'perlado': '#f0e8d8', 'roca': '#7a7a7a',
          'oslo': '#6e8087', 'alba': '#f5f5f0', 'sabino': '#8b4513',
          'tilo': '#d5c099', 'perl': '#f0e8d8'
        };
        return map[c.toLowerCase()] || null;
      },

      getCatNameById(id) {
        var c = this.categorias.find(function (c) { return c.id === id; });
        return c ? c.nombre : '—';
      },

      getSubcatNameById(id) {
        var s = this.subcategorias.find(function (s) { return s.id === id; });
        return s ? s.nombre : '—';
      },

      getSubcatNameById(id) {
        // Search in subcategorias array (may not have all loaded)
        var s = this.subcategorias.find(function (s) { return s.id === id; });
        return s ? s.nombre : '—';
      },

      async confirmCloseModal() {
        if (this.prodFormDirty && this.prodModalMode !== 'view') {
          var ok = await window.showConfirm({
            title: '¿Cerrar sin guardar?',
            message: 'Tienes cambios sin guardar. Si cierras, se perderán.',
            confirmText: 'Descartar',
            cancelText: 'Seguir editando',
            variant: 'warning',
          });
          if (!ok) return;
        }
        this.forceCloseProdModal();
      },

      forceCloseProdModal() {
        this.prodModalOpen = false;
        this.prodImages = [];
        this.prodFormDirty = false;
      },

      markDirty() { this.prodFormDirty = true; },

      validateStep(step) {
        this.prodErrors = {};
        if (step === 0) {
          if (!this.prodForm.codigo_interno.trim()) this.prodErrors.codigo_interno = 'El código interno es obligatorio';
          if (!this.prodForm.nombre.trim()) this.prodErrors.nombre = 'El nombre es obligatorio';
          if (!this.prodForm.categoria_id) this.prodErrors.categoria_id = 'La categoría es obligatoria';
        }
        if (step === 4) {
          if (this.prodForm.precio_usd === '' || this.prodForm.precio_usd == null) {
            this.prodErrors.precio_usd = 'El precio es obligatorio';
          }
        }
        return Object.keys(this.prodErrors).length === 0;
      },

      validateForm() {
        this.prodErrors = {};
        if (!this.prodForm.codigo_interno.trim()) this.prodErrors.codigo_interno = 'El código interno es obligatorio';
        if (!this.prodForm.nombre.trim()) this.prodErrors.nombre = 'El nombre es obligatorio';
        if (!this.prodForm.categoria_id) this.prodErrors.categoria_id = 'La categoría es obligatoria';
        if (this.prodForm.precio_usd === '' || this.prodForm.precio_usd == null) this.prodErrors.precio_usd = 'El precio es obligatorio';
        return Object.keys(this.prodErrors).length === 0;
      },

      nextStep() {
        if (!this.validateStep(this.prodStep)) {
          this.showToast('Completa los campos obligatorios marcados en rojo', 'error');
          return;
        }
        if (this.prodStep < 6) this.prodStep++;
      },

      async onProdCategoriaChange() {
        var catId = this.prodForm.categoria_id;
        this.prodForm.subcategoria_id = '';
        if (!catId) return;
        try {
          var r = await window.supabaseClient.from('subcategorias').select('*').eq('categoria_id', catId).order('orden');
          if (r.error) throw r.error;
          this.subcategorias = r.data || [];
        } catch (e) {
          console.error('Subcategorías load error:', e);
          this.showToast('Error al cargar subcategorías', 'error');
        }
      },

      get previewMeasures() {
        return formatMeasuresStr(
          this.prodForm.ancho, this.prodForm.largo, this.prodForm.espesor, this.prodForm.unidad_medida
        );
      },

      get previewPrice() {
        var usd = parseFloat(this.prodForm.precio_usd) || 0;
        if (!usd) return '';
        var conf = this.configuracion;
        var cop = conf ? usd * (parseFloat(conf.tasa_cop_usd) || 4200) : 0;
        var ves = conf ? usd * (parseFloat(conf.tasa_ves_usd) || 36.5) : 0;
        if (cop) cop = '$ ' + Math.round(cop).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        if (ves) ves = 'Bs. ' + ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        var parts = [];
        if (cop) parts.push(cop + ' COP');
        if (ves) parts.push(ves);
        return parts.join('  |  ');
      },

      // === IMAGES ===
      get activeImages() {
        return this.prodImages.filter(function (img) { return !img.toDelete; });
      },

      onImageFiles(e) {
        var self = this;
        var files = Array.from(e.target.files);
        files.forEach(function (file) {
          var err = validateImageFile(file);
          if (err) { self.showToast(err, 'error'); return; }
          convertToWebP(file).then(function (webpFile) {
            var reader = new FileReader();
            reader.onload = function (ev) {
              self.prodImages.push({
                id: null, url: '', es_principal: self.activeImages.length === 0,
                saved: false, file: webpFile, preview: ev.target.result, toDelete: false
              });
            };
            reader.readAsDataURL(webpFile);
          }).catch(function () {
            self.showToast('Error al procesar la imagen', 'error');
          });
        });
        e.target.value = '';
      },

      removeImage(index) {
        var img = this.prodImages[index];
        if (!img) return;
        if (img.saved) { img.toDelete = true; }
        else { this.prodImages.splice(index, 1); }
        var active = this.activeImages;
        if (active.length > 0 && !active.some(function (i) { return i.es_principal; })) {
          active[0].es_principal = true;
        }
        this.markDirty();
      },

      setPrincipalImage(index) {
        var img = this.prodImages[index];
        if (!img || img.toDelete) return;
        this.prodImages.forEach(function (i) { i.es_principal = false; });
        img.es_principal = true;
        this.markDirty();
      },

      moveImage(index, direction) {
        var newIdx = index + direction;
        if (newIdx < 0 || newIdx >= this.prodImages.length) return;
        var tmp = this.prodImages[index];
        this.prodImages[index] = this.prodImages[newIdx];
        this.prodImages[newIdx] = tmp;
        this.markDirty();
      },

      // === SAVE ===
      async saveProducto() {
        if (!this.validateForm()) {
          this.showToast('Hay campos por completar', 'error');
          return;
        }

        // Check duplicate código interno
        var existing = this.productos.find(function(p) {
          return p.codigo_interno.trim() === this.prodForm.codigo_interno.trim() && p.id !== this.prodForm.id;
        }.bind(this));
        if (existing) {
          this.prodErrors.codigo_interno = 'El código interno ya existe';
          this.showToast('El código interno ya existe', 'error');
          return;
        }

        this.prodSaving = true;
        try {
          var payload = {
            codigo_interno: this.prodForm.codigo_interno.trim(),
            nombre: this.prodForm.nombre.trim(),
            descripcion_larga: this.prodForm.descripcion_larga.trim() || null,
            categoria_id: this.prodForm.categoria_id,
            subcategoria_id: this.prodForm.subcategoria_id || null,
            ancho: parseFloat(this.prodForm.ancho) || 0,
            largo: parseFloat(this.prodForm.largo) || 0,
            espesor: parseFloat(this.prodForm.espesor) || 0,
            unidad_medida: this.prodForm.unidad_medida,
            tipo_borde: this.prodForm.tipo_borde.trim() || null,
            formato_instalacion: this.prodForm.formato_instalacion.trim() || null,
            color: this.prodForm.color.trim() || null,
            acabado: this.prodForm.acabado.trim() || null,
            material: this.prodForm.material.trim() || null,
            uso: this.prodForm.uso,
            marca: this.prodForm.marca.trim() || null,
            tecnologia: this.prodForm.tecnologia.trim() || null,
            superficie: this.prodForm.superficie.trim() || null,
            grupo_absorcion: this.prodForm.grupo_absorcion.trim() || null,
            clasificacion_ansi: this.prodForm.clasificacion_ansi.trim() || null,
            coeficiente_friccion: this.prodForm.coeficiente_friccion.trim() || null,
            pei: parseInt(this.prodForm.pei) || null,
            cantidad_caras: parseInt(this.prodForm.cantidad_caras) || null,
            variacion_rate: parseInt(this.prodForm.variacion_rate) || null,
            m2_por_caja: parseFloat(this.prodForm.m2_por_caja) || 0,
            piezas_por_caja: parseInt(this.prodForm.piezas_por_caja) || 0,
            peso: parseFloat(this.prodForm.peso) || 0,
            calidad: this.prodForm.calidad.trim() || null,
            coleccion: this.prodForm.coleccion.trim() || null,
            precio_usd: parseFloat(this.prodForm.precio_usd) || 0,
            mostrar_precio: this.prodForm.mostrar_precio,
            disponible: this.prodForm.disponible,
            destacado: this.prodForm.destacado,
            trafico: this.prodForm.trafico.trim() || null,
            terrazas: this.prodForm.terrazas,
            alto_trafico: this.prodForm.alto_trafico,
            garantia_anios: parseInt(this.prodForm.garantia_anios) || null,
            garantia_unidad: this.prodForm.garantia_unidad,
            garantia_condiciones: this.prodForm.garantia_condiciones.trim() || null,
            pais_origen: this.prodForm.pais_origen.trim() || null,
            resistencia_manchas: this.prodForm.resistencia_manchas,
            detalle_instalacion: this.prodForm.detalle_instalacion.trim() || null,
            observaciones: this.prodForm.observaciones.trim() || null,
            politica_imagen: this.prodForm.politica_imagen.trim() || null
          };

          var result;
          if (this.prodModalMode === 'create') {
            result = await window.supabaseClient.from('productos').insert(payload).select().single();
            if (result.error) throw new Error(result.error.message);
            var newId = result.data.id;

            if (this.prodImages.length > 0) {
              var saveResult = await saveProductImages(newId, this.prodImages);
              if (saveResult && saveResult.error) throw new Error(saveResult.error);
            }
          } else {
            result = await window.supabaseClient.from('productos').update(payload).eq('id', this.prodForm.id).select().single();
            if (result.error) throw new Error(result.error.message);

            if (this.prodImages.length > 0 || this.prodImages.some(function (i) { return i.toDelete; })) {
              var updResult = await updateProductImages(this.prodForm.id, this.prodImages);
              if (updResult && updResult.error) throw new Error(updResult.error);
            }
          }

          this.prodModalOpen = false;
          this.prodFormDirty = false;
          this.showToast(this.prodModalMode === 'create' ? 'Producto creado' : 'Producto actualizado', 'success');
          await this.loadProductos();
        } catch (e) {
          var msg = e.message || 'Error desconocido';
          if (msg.includes('duplicate key') || msg.includes('unique')) {
            this.showToast('El código interno ya existe', 'error');
          } else {
            this.showToast('Error: ' + msg, 'error');
          }
        }
        this.prodSaving = false;
      },

      // === DUPLICATE ===
      async duplicateProduct(prod) {
        var ok = await window.showConfirm({
          title: '¿Duplicar el producto?',
          message: '¿Duplicar "' + prod.nombre + '"? Se creará una copia con código -COPIA.',
          confirmText: 'Duplicar',
          cancelText: 'Cancelar',
          variant: 'info',
        });
        if (!ok) return;
        try {
          var payload = {
            codigo_interno: prod.codigo_interno + '-COPIA',
            nombre: prod.nombre + ' (copia)',
            descripcion_larga: prod.descripcion_larga,
            categoria_id: prod.categoria_id,
            subcategoria_id: prod.subcategoria_id,
            ancho: prod.ancho, largo: prod.largo, espesor: prod.espesor,
            unidad_medida: prod.unidad_medida,
            color: prod.color, acabado: prod.acabado, material: prod.material,
            uso: prod.uso, marca: prod.marca,
            m2_por_caja: prod.m2_por_caja, piezas_por_caja: prod.piezas_por_caja, peso: prod.peso,
            precio_usd: prod.precio_usd, mostrar_precio: prod.mostrar_precio,
            disponible: prod.disponible, destacado: false
          };
          var r = await window.supabaseClient.from('productos').insert(payload).select().single();
          if (r.error) { this.showToast('Error al duplicar: ' + r.error.message, 'error'); return; }
          this.showToast('Producto duplicado', 'success');
          await this.loadProductos();
        } catch (e) {
          this.showToast('Error al duplicar', 'error');
        }
      },

      // === TOGGLE DISPONIBLE ===
      async toggleDisponible(prod) {
        try {
          var r = await window.supabaseClient.from('productos').update({ disponible: !prod.disponible }).eq('id', prod.id);
          if (r.error) throw r.error;
          prod.disponible = !prod.disponible;
        } catch (e) { this.showToast('Error al cambiar estado', 'error'); }
      },

      // === DELETE ===
      confirmDelete(prod) {
        this.deleteTarget = prod;
        this.deleteOpen = true;
      },

      async executeDelete() {
        if (!this.deleteTarget) return;
        this.deleting = true;
        try {
          await deleteAllProductImages(this.deleteTarget.id);
          var r = await window.supabaseClient.from('productos').delete().eq('id', this.deleteTarget.id);
          if (r.error) throw r.error;
          this.showToast('Producto eliminado', 'success');
          this.deleteOpen = false;
          this.deleteTarget = null;
          await this.loadProductos();
        } catch (e) {
          this.showToast('Error al eliminar: ' + (e.message || ''), 'error');
        }
        this.deleting = false;
      },

      // === FORMAT ===
      formatMeasures(p) { return formatMeasuresStr(p.ancho, p.largo, p.espesor, p.unidad_medida); },
      formatPrice(p) { return formatPrice(p.precio_usd, 'USD'); },

      // === PAGINATION ===
      goPage(n) { if (n >= 1 && n <= this.totalPages) this.page = n; },
      clearFilters() {
        this.search = '';
        this.filterCategoria = '';
        this.filterSubcategoria = '';
        this.filterDisponible = false;
        this.filterDestacado = false;
        this.page = 1;
        this.subcategorias = [];
      },

      closeDeleteModal() { this.deleteOpen = false; this.deleteTarget = null; },

      // Debounced search handler (300ms)
      debounceSearch: debounce(function () { this.page = 1; }, 300),

      // === TOAST ===
      showToast(text, type) { window.dispatchEvent(new CustomEvent('admin-toast', { detail: { text: text, type: type || 'success' } })); },

      // === HELPERS ===
      catName(id) {
        var c = this.categorias.find(function (c) { return c.id === id; });
        return c ? c.nombre : '';
      }
    };
  });
});
