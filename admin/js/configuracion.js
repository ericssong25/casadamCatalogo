/**
 * Casa Dam Admin — Configuración (tasas, datos empresa)
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('configuracionModule', function () {
    return {
      config: null,
      loading: true,
      savingTasas: false,
      savingDatos: false,
      savingOcultarPrecios: false,

      // Forms
      tasaCOP: 4200,
      tasaVES: 36.50,
      nombre: 'Casa Dam',
      slogan: 'Vivimos contigo',
      email: '',
      telefono: '',
      whatsapp: '',
      direccion: '',
      monedaDefault: 'USD',
      ocultarPrecios: false,

      // === INIT ===
      async init() {
        await this.loadConfig();
      },

      async loadConfig() {
        this.loading = true;
        try {
          var r = await window.supabaseClient.from('configuracion').select('*').single();
          if (r.error) throw r.error;
          this.config = r.data;
          this.tasaCOP = parseFloat(r.data.tasa_cop_usd) || 4200;
          this.tasaVES = parseFloat(r.data.tasa_ves_usd) || 36.50;
          this.nombre = r.data.nombre_empresa || 'Casa Dam';
          this.slogan = r.data.slogan || 'Vivimos contigo';
          this.email = r.data.email_contacto || '';
          this.telefono = r.data.telefono_contacto || '';
          this.whatsapp = r.data.whatsapp || '';
          this.direccion = r.data.direccion || '';
          this.monedaDefault = r.data.moneda_default || 'USD';
          this.ocultarPrecios = r.data.ocultar_precios === true;
        } catch (e) { this.showToast('Error al cargar configuración', 'error'); }
        this.loading = false;
      },

      get updatedAtText() {
        if (!this.config || !this.config.ultima_actualizacion_tasas) return '';
        var diff = Date.now() - new Date(this.config.ultima_actualizacion_tasas).getTime();
        var hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'actualizado hace menos de 1 hora';
        if (hours < 24) return 'actualizado hace ' + hours + ' horas';
        var days = Math.floor(hours / 24);
        return 'actualizado hace ' + days + ' día(s)';
      },

      async saveTasas() {
        if (!this.config) return;
        var ok = await window.showConfirm({
          title: '¿Actualizar las tasas de cambio?',
          message: 'Los precios del catálogo se recalcularán con las nuevas tasas.',
          confirmText: 'Actualizar',
          cancelText: 'Cancelar',
          variant: 'warning',
        });
        if (!ok) return;
        this.savingTasas = true;
        try {
          var r = await window.supabaseClient.from('configuracion').update({
            tasa_cop_usd: parseFloat(this.tasaCOP) || 4200,
            tasa_ves_usd: parseFloat(this.tasaVES) || 36.50,
            ultima_actualizacion_tasas: new Date().toISOString()
          }).eq('id', this.config.id);
          if (r.error) throw r.error;
          this.config.tasa_cop_usd = this.tasaCOP;
          this.config.tasa_ves_usd = this.tasaVES;
          this.config.ultima_actualizacion_tasas = new Date().toISOString();
          window.TASAS_CAMBIO = { usd: 1, cop: parseFloat(this.tasaCOP), ves: parseFloat(this.tasaVES) };
          this.showToast('Tasas actualizadas', 'success');
        } catch (e) { this.showToast('Error al guardar: ' + (e.message || ''), 'error'); }
        this.savingTasas = false;
      },

      async saveDatos() {
        if (!this.config) return;
        this.savingDatos = true;
        try {
          var r = await window.supabaseClient.from('configuracion').update({
            nombre_empresa: this.nombre,
            slogan: this.slogan,
            email_contacto: this.email || null,
            telefono_contacto: this.telefono || null,
            whatsapp: this.whatsapp || null,
            direccion: this.direccion || null
          }).eq('id', this.config.id);
          if (r.error) throw r.error;
          this.showToast('Datos guardados', 'success');
        } catch (e) { this.showToast('Error al guardar: ' + (e.message || ''), 'error'); }
        this.savingDatos = false;
      },

      async saveMoneda() {
        if (!this.config) return;
        try {
          var r = await window.supabaseClient.from('configuracion').update({
            moneda_default: this.monedaDefault
          }).eq('id', this.config.id);
          if (r.error) throw r.error;
          this.showToast('Moneda por defecto actualizada', 'success');
        } catch (e) { this.showToast('Error al guardar', 'error'); }
      },

      async saveOcultarPrecios() {
        if (!this.config) return;
        if (this.savingOcultarPrecios) return;
        this.savingOcultarPrecios = true;
        try {
          var r = await window.supabaseClient.from('configuracion').update({
            ocultar_precios: this.ocultarPrecios
          }).eq('id', this.config.id);
          if (r.error) throw r.error;
          this.config.ocultar_precios = this.ocultarPrecios;
          this.showToast(this.ocultarPrecios ? 'Precios ocultos en el catálogo público' : 'Precios visibles en el catálogo público', 'success');
        } catch (e) {
          this.ocultarPrecios = !this.ocultarPrecios;
          this.showToast('Error al guardar: ' + (e.message || ''), 'error');
        }
        this.savingOcultarPrecios = false;
      },

      showToast(text, type) { window.dispatchEvent(new CustomEvent('admin-toast', { detail: { text: text, type: type || 'success' } })); }
    };
  });
});
