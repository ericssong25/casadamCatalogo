/**
 * Casa Dam Admin — CRUD de Categorías y Subcategorías
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('categoriasModule', function () {
    return {
      categorias: [],
      loadError: null,
      loading: true,
      expandedId: null,
      subcategorias: {},
      subLoading: {},

      catModalOpen: false, catModalMode: 'create',
      catForm: { id: null, nombre: '', slug: '', descripcion: '', orden: 0, activa: true },
      catErrors: {}, catSaving: false,

      subModalOpen: false, subModalMode: 'create',
      subForm: { id: null, categoria_id: null, nombre: '', slug: '', orden: 0, activa: true },
      subSaving: false,

      deleteTarget: null, deleteType: '', confirmOpen: false, deleting: false,

      async init() {
        var self = this;
        window.addEventListener('open-cat-modal', function () { self.openCatModal('create'); });
        await this.loadCategorias();
      },

      async loadCategorias() {
        this.loading = true;
        this.loadError = null;
        try {
          // Admin sees ALL categories (no activa filter)
          var r1 = await window.supabaseClient.from('categorias').select('*').order('orden');
          if (r1.error) throw r1.error;
          var cats = r1.data || [];

          // Load subcategory counts
          var r2 = await window.supabaseClient.from('subcategorias').select('categoria_id');
          if (r2.error) throw r2.error;
          var subCounts = {};
          (r2.data || []).forEach(function (s) {
            subCounts[s.categoria_id] = (subCounts[s.categoria_id] || 0) + 1;
          });

          // Load product counts
          var r3 = await window.supabaseClient.from('productos').select('categoria_id');
          if (r3.error) throw r3.error;
          var prodCounts = {};
          (r3.data || []).forEach(function (p) {
            prodCounts[p.categoria_id] = (prodCounts[p.categoria_id] || 0) + 1;
          });

          this.categorias = cats.map(function (c) {
            c.productos_count = prodCounts[c.id] || 0;
            c.subcategorias_count = subCounts[c.id] || 0;
            return c;
          });
        } catch (e) {
          this.loadError = e.message || e.error_description || 'Error desconocido';
          console.error('Categorías load error:', e);
          this.showToast('Error al cargar categorías: ' + this.loadError, 'error');
          this.categorias = [];
        }
        this.loading = false;
        this.$nextTick(function () { if (window.lucide) lucide.createIcons(); });
      },

      async loadSubcategorias(catId) {
        this.subLoading[catId] = true;
        try {
          var r = await window.supabaseClient.from('subcategorias').select('*').eq('categoria_id', catId).order('orden');
          if (r.error) throw r.error;
          this.subcategorias[catId] = r.data || [];
          var cat = this.categorias.find(function (c) { return c.id === catId; });
          if (cat) cat.subcategorias_count = this.subcategorias[catId].length;
        } catch (e) {
          console.error('Subcategorías load error:', e);
          this.showToast('Error al cargar subcategorías: ' + (e.message || ''), 'error');
        }
        this.subLoading[catId] = false;
        this.$nextTick(function () { if (window.lucide) lucide.createIcons(); });
      },

      async toggleExpand(catId) {
        if (this.expandedId === catId) { this.expandedId = null; return; }
        this.expandedId = catId;
        await this.loadSubcategorias(catId);
      },

      openCatModal(mode, cat) {
        this.catModalMode = mode; this.catErrors = {};
        if (mode === 'edit' && cat) {
          this.catForm = { id: cat.id, nombre: cat.nombre, slug: cat.slug, descripcion: cat.descripcion || '', orden: cat.orden, activa: cat.activa };
        } else {
          this.catForm = { id: null, nombre: '', slug: '', descripcion: '', orden: 0, activa: true };
        }
        this.catModalOpen = true;
        this.$nextTick(function () {
          var f = document.querySelector('.modal-card input');
          if (f) f.focus();
          if (window.lucide) lucide.createIcons();
        });
      },
      closeCatModal() { this.catModalOpen = false; this.catErrors = {}; },

      onCatNombreChange() {
        if (this.catModalMode === 'create') {
          this.catForm.slug = slugify(this.catForm.nombre);
        }
      },

      async saveCategoria() {
        this.catErrors = {};
        if (!this.catForm.nombre.trim()) { this.catErrors.nombre = 'El nombre es obligatorio'; return; }
        if (!this.catForm.slug.trim()) { this.catErrors.slug = 'El slug es obligatorio'; return; }
        this.catSaving = true;
        try {
          var payload = { nombre: this.catForm.nombre.trim(), slug: this.catForm.slug.trim(), descripcion: this.catForm.descripcion.trim() || null, orden: parseInt(this.catForm.orden) || 0, activa: this.catForm.activa };
          var r = this.catModalMode === 'create'
            ? await window.supabaseClient.from('categorias').insert(payload).select().single()
            : await window.supabaseClient.from('categorias').update(payload).eq('id', this.catForm.id).select().single();
          if (r.error) {
            var msg = r.error.message || '';
            this.catErrors.nombre = msg.includes('unique') ? 'Ya existe una categoría con ese nombre o slug' : ('Error: ' + msg);
            this.catSaving = false;
            return;
          }
          this.closeCatModal();
          this.showToast(this.catModalMode === 'create' ? 'Categoría creada' : 'Categoría actualizada', 'success');
          await this.loadCategorias();
        } catch (e) {
          console.error('Save categoría error:', e);
          this.showToast('Error de conexión: ' + (e.message || ''), 'error');
        }
        this.catSaving = false;
      },

      async toggleCatActiva(cat) {
        // Optimistic UI: toggle immediately
        var newVal = !cat.activa;
        cat.activa = newVal;
        try {
          var r = await window.supabaseClient.from('categorias').update({ activa: newVal }).eq('id', cat.id);
          if (r.error) throw r.error;
          this.showToast(newVal ? 'Categoría activada' : 'Categoría desactivada', 'success');
        } catch (e) {
          // Revert on failure
          cat.activa = !newVal;
          console.error('Toggle activa error:', e);
          this.showToast('Error al cambiar estado', 'error');
        }
      },

      confirmDeleteCat(cat) { this.deleteTarget = cat; this.deleteType = 'categoria'; this.confirmOpen = true; },

      openSubModal(mode, catId, sub) {
        this.subModalMode = mode;
        if (mode === 'edit' && sub) this.subForm = { id: sub.id, categoria_id: sub.categoria_id, nombre: sub.nombre, slug: sub.slug, orden: sub.orden, activa: sub.activa };
        else this.subForm = { id: null, categoria_id: catId, nombre: '', slug: '', orden: 0, activa: true };
        this.subModalOpen = true;
        this.$nextTick(function () {
          var f = document.querySelectorAll('.modal-card input')[0];
          if (f) f.focus();
          if (window.lucide) lucide.createIcons();
        });
      },
      closeSubModal() { this.subModalOpen = false; },

      onSubNombreChange() { if (this.subModalMode === 'create') this.subForm.slug = slugify(this.subForm.nombre); },

      async saveSubcategoria() {
        if (!this.subForm.nombre.trim()) { this.showToast('El nombre es obligatorio', 'error'); return; }
        if (!this.subForm.slug.trim()) { this.showToast('El slug es obligatorio', 'error'); return; }
        this.subSaving = true;
        try {
          var payload = { categoria_id: this.subForm.categoria_id, nombre: this.subForm.nombre.trim(), slug: this.subForm.slug.trim(), orden: parseInt(this.subForm.orden) || 0, activa: this.subForm.activa };
          var r = this.subModalMode === 'create'
            ? await window.supabaseClient.from('subcategorias').insert(payload).select().single()
            : await window.supabaseClient.from('subcategorias').update(payload).eq('id', this.subForm.id).select().single();
          if (r.error) { this.showToast('Error: ' + (r.error.message || 'desconocido'), 'error'); this.subSaving = false; return; }
          this.closeSubModal();
          this.showToast(this.subModalMode === 'create' ? 'Subcategoría creada' : 'Subcategoría actualizada', 'success');
          await this.loadSubcategorias(this.subForm.categoria_id);
          await this.loadCategorias();
        } catch (e) {
          console.error('Save subcategoría error:', e);
          this.showToast('Error de conexión: ' + (e.message || ''), 'error');
        }
        this.subSaving = false;
      },

      async toggleSubActiva(catId, sub) {
        var newVal = !sub.activa;
        sub.activa = newVal;
        try {
          var r = await window.supabaseClient.from('subcategorias').update({ activa: newVal }).eq('id', sub.id);
          if (r.error) throw r.error;
          this.showToast(newVal ? 'Subcategoría activada' : 'Subcategoría desactivada', 'success');
        } catch (e) {
          sub.activa = !newVal;
          console.error('Toggle sub activa error:', e);
          this.showToast('Error al cambiar estado', 'error');
        }
      },

      confirmDeleteSub(sub) { this.deleteTarget = sub; this.deleteType = 'subcategoria'; this.confirmOpen = true; },

      async executeDelete() {
        if (!this.deleteTarget) return; this.deleting = true;
        try {
          var r = this.deleteType === 'categoria'
            ? await window.supabaseClient.from('categorias').delete().eq('id', this.deleteTarget.id)
            : await window.supabaseClient.from('subcategorias').delete().eq('id', this.deleteTarget.id);
          if (r.error) {
            var msg = r.error.message || '';
            this.showToast((msg.includes('violates foreign key') || msg.includes('restrict')) ? 'No se puede eliminar: tiene productos asociados' : 'Error al eliminar: ' + msg, 'error');
          } else {
            this.showToast(this.deleteType === 'categoria' ? 'Categoría eliminada' : 'Subcategoría eliminada', 'success');
            if (this.deleteType === 'categoria') { this.expandedId = null; await this.loadCategorias(); }
            else { await this.loadSubcategorias(this.deleteTarget.categoria_id); await this.loadCategorias(); }
          }
        } catch (e) {
          console.error('Delete error:', e);
          this.showToast('Error de conexión: ' + (e.message || ''), 'error');
        }
        this.confirmOpen = false; this.deleteTarget = null; this.deleting = false;
      },
      closeConfirm() { this.confirmOpen = false; this.deleteTarget = null; },

      showToast(text, type) { window.dispatchEvent(new CustomEvent('admin-toast', { detail: { text: text, type: type || 'success' } })); }
    };
  });
});
