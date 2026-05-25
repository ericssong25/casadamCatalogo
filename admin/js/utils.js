/**
 * Casa Dam Admin — Utilidades compartidas
 */

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatPrice(amount, currency) {
  var n = parseFloat(amount) || 0;
  if (currency === 'COP') {
    return '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  if (currency === 'VES') {
    return 'Bs. ' + n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$ ' + n.toFixed(2);
}

function convertPrice(usd, tasa) {
  return (parseFloat(usd) || 0) * (parseFloat(tasa) || 0);
}

function debounce(fn, delay) {
  var timer;
  return function () {
    var ctx = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatMeasuresStr(ancho, largo, espesor, unidad) {
  var parts = [];
  if (ancho) parts.push(parseFloat(ancho).toString());
  if (largo) parts.push(parseFloat(largo).toString());
  if (espesor) parts.push(parseFloat(espesor).toString());
  if (parts.length === 0) return '';
  return parts.join(' \u00D7 ') + (unidad ? ' ' + unidad : '');
}

function validateImageFile(file) {
  var validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Formato no válido. Usa JPG, PNG o WebP.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'La imagen no debe superar 5 MB.';
  }
  return null;
}

function resizeImage(file, maxWidth) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth) { resolve(file); return; }
      var canvas = document.createElement('canvas');
      var ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * ratio);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) {
        var resized = new File([blob], file.name, { type: file.type });
        resolve(resized);
      }, file.type, 0.85);
    };
    img.onerror = function () { reject(new Error('Error al cargar imagen')); };
    img.src = url;
  });
}

function showToastGlobal(text, type) {
  var container = document.querySelector('.toast-container');
  if (!container) return;
  var id = Date.now();
  var el = document.createElement('div');
  el.className = 'toast toast--' + (type || 'success');
  el.textContent = text;
  container.appendChild(el);
  setTimeout(function () { el.remove(); }, 3000);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  var diff = Date.now() - new Date(dateStr).getTime();
  var seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'hace un momento';
  var minutes = Math.floor(seconds / 60);
  if (minutes < 60) return 'hace ' + minutes + ' min';
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return 'hace ' + hours + (hours === 1 ? ' hora' : ' horas');
  var days = Math.floor(hours / 24);
  if (days < 7) return 'hace ' + days + (days === 1 ? ' día' : ' días');
  var weeks = Math.floor(days / 7);
  if (weeks < 4) return 'hace ' + weeks + (weeks === 1 ? ' semana' : ' semanas');
  var months = Math.floor(days / 30);
  return 'hace ' + months + (months === 1 ? ' mes' : ' meses');
}

function convertToWebP(file) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      var canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(file); return; }
        var webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
        resolve(webpFile);
      }, 'image/webp', 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
