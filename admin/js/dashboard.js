/**
 * Casa Dam Admin — Dashboard
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('dashboardModule', function () {
    return {
      loading: true,
      stats: { total: 0, disponibles: 0, noDisponibles: 0, destacados: 0, categorias: 0, sinImagen: 0, precioCero: 0 },
      recientes: [],
      animatedStats: { total: 0, disponibles: 0, noDisponibles: 0, destacados: 0, categorias: 0, sinImagen: 0, precioCero: 0 },

      async init() {
        await this.loadStats();
        this.animateCounts();
      },

      async loadStats() {
        this.loading = true;
        try {
          var all = await window.supabaseClient.from('productos').select('id, nombre, codigo_interno, categoria_id, precio_usd, mostrar_precio, disponible, destacado, ancho, largo, espesor, unidad_medida, created_at').order('created_at', { ascending: false });
          if (all.error) throw all.error;

          var cats = await window.supabaseClient.from('categorias').select('id, nombre');
          if (cats.error) throw cats.error;

          var imgs = await window.supabaseClient.from('producto_imagenes').select('producto_id, url, es_principal');
          if (imgs.error) throw imgs.error;

          var prods = all.data || [];
          var imgMap = {};
          (imgs.data || []).forEach(function (i) {
            if (!imgMap[i.producto_id] || i.es_principal) imgMap[i.producto_id] = i;
          });

          var sinImg = prods.filter(function (p) { return !imgMap[p.id]; });
          var precioCero = prods.filter(function (p) { return p.precio_usd === 0; });

          this.stats = {
            total: prods.length,
            disponibles: prods.filter(function (p) { return p.disponible; }).length,
            noDisponibles: prods.filter(function (p) { return !p.disponible; }).length,
            destacados: prods.filter(function (p) { return p.destacado; }).length,
            categorias: (cats.data || []).length,
            sinImagen: sinImg.length,
            precioCero: precioCero.length
          };

          // Build recent products with images and category names
          var catMap = {};
          (cats.data || []).forEach(function (c) { catMap[c.id] = c.nombre; });

          this.recientes = prods.slice(0, 10).map(function (p) {
            p._catName = catMap[p.categoria_id] || '';
            p._img = imgMap[p.id] || null;
            p._measures = formatMeasuresStr(p.ancho, p.largo, p.espesor, p.unidad_medida);
            p._timeAgo = timeAgo(p.created_at);
            return p;
          });
        } catch (e) {
          console.error('Dashboard load error:', e);
          this.showToast('Error al cargar estadísticas: ' + (e.message || ''), 'error');
        }
        this.loading = false;
      },

      animateCounts() {
        var self = this;
        var duration = 600;
        var start = performance.now();
        var targets = {};
        var keys = ['total', 'disponibles', 'noDisponibles', 'destacados', 'categorias', 'sinImagen', 'precioCero'];
        keys.forEach(function (k) { targets[k] = self.stats[k] || 0; });

        function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

        function step(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var eased = easeOutQuart(progress);
          keys.forEach(function (k) {
            self.animatedStats[k] = Math.round(eased * targets[k]);
          });
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      },

      openProductView(prod) {
        window.dispatchEvent(new CustomEvent('open-product-view', { detail: prod }));
      },

      showToast(text, type) { window.dispatchEvent(new CustomEvent('admin-toast', { detail: { text: text, type: type || 'success' } })); },
      changeSection(key) { window.dispatchEvent(new CustomEvent('change-section', { detail: key })); }
    };
  });
});
