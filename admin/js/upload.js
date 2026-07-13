/**
 * Casa Dam Admin — Manejo de upload de imágenes a Supabase Storage
 */

// Orden estable para imágenes: por `orden` ASC, con tiebreak
// por `created_at` ASC y luego por `id` ASC. Defensivo: se aplica
// siempre del lado cliente aunque la consulta ya traiga ORDER BY.
window.sortImagesByOrden = function (imgs) {
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
};

async function uploadProductImage(productId, file, order) {
  var ext = file.name.split('.').pop().toLowerCase();
  var storagePath = productId + '/' + generateUUID() + '.' + ext;

  var _a = await window.supabaseClient.storage.from('productos').upload(storagePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false
  });

  if (_a.error) {
    return { error: _a.error.message };
  }

  var publicUrl = window.supabaseClient.storage.from('productos').getPublicUrl(storagePath).data.publicUrl;
  return { publicUrl: publicUrl, storagePath: storagePath };
}

async function deleteStorageImage(url) {
  if (!url || !url.includes('/productos/')) return;
  var path = url.split('/productos/')[1];
  if (!path) return;
  await window.supabaseClient.storage.from('productos').remove([path]);
}

async function saveProductImages(productId, images) {
  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    if (img.saved) continue;

    if (img.file) {
      var result = await uploadProductImage(productId, img.file, i);
      if (result.error) {
        return { error: 'Error al subir ' + img.file.name + ': ' + result.error };
      }
      img.url = result.publicUrl;
    }

    if (img.toDelete) {
      await deleteStorageImage(img.url);
      continue;
    }

    var _a = await window.supabaseClient.from('producto_imagenes').insert({
      producto_id: productId,
      url: img.url,
      es_principal: img.es_principal || i === 0,
      orden: i
    });
    if (_a.error) return { error: _a.error.message };

    img.saved = true;
  }
}

async function updateProductImages(productId, images) {
  var existing = await window.supabaseClient.from('producto_imagenes').select('*').eq('producto_id', productId);
  var existingIds = (existing.data || []).map(function (img) { return img.id; });

  // Delete images no longer in the list
  var keepIds = images.filter(function (i) { return i.id; }).map(function (i) { return i.id; });
  var toDeleteIds = existingIds.filter(function (id) { return keepIds.indexOf(id) === -1; });

  for (var i = 0; i < toDeleteIds.length; i++) {
    var delImg = (existing.data || []).find(function (e) { return e.id === toDeleteIds[i]; });
    if (delImg) { await deleteStorageImage(delImg.url); }
  }
  if (toDeleteIds.length > 0) {
    await window.supabaseClient.from('producto_imagenes').delete().in('id', toDeleteIds);
  }

  // Upload & insert new images
  for (var j = 0; j < images.length; j++) {
    var img = images[j];
    if (img.toDelete) continue;
    if (img.saved) continue;

    if (img.file && !img.url) {
      var result = await uploadProductImage(productId, img.file, j);
      if (result.error) return { error: result.error };
      img.url = result.publicUrl;
    }

    var _b = await window.supabaseClient.from('producto_imagenes').insert({
      producto_id: productId,
      url: img.url,
      es_principal: img.es_principal,
      orden: j
    });
    if (_b.error) return { error: _b.error.message };
    img.id = _b.data ? (_b.data[0] ? _b.data[0].id : null) : null;
    img.saved = true;
  }

  // Sincronizar orden y es_principal de las imágenes activas del producto.
  //
  // Reglas (Casa Dam):
  //   • posición 1 (index 0 de la lista visible) => es_principal = TRUE
  //   • todas las demás => es_principal = FALSE
  //   • orden va 1..N (1-based), sin huecos, sin duplicados
  //
  // Para evitar cualquier race entre per-row UPDATEs y el trigger
  // `enforce_single_principal` (que mantiene la unicidad de la principal),
  // hacemos tres fases en orden estricto:
  //
  //   1. Limpiar es_principal en cada fila activa (es_principal = false).
  //   2. Re-flipar la fila en posición 0 a es_principal = true.
  //   3. Escribir orden 1..N en cada fila activa (incluida la principal).
  //
  // Si una fase falla, devolvemos error y abortamos. La fase 1 deja la BD
  // en un estado consistente (todas false); la fase 2/3 nunca se ejecuta
  // en ese caso. Riesgo residual: si falla entre 2 y 3, queda sin principal;
  // el siguiente reintento corrige automáticamente.
  var active = [];
  for (var a = 0; a < images.length; a++) {
    if (!images[a].toDelete && images[a].id) {
      active.push({ id: images[a].id, index: a });
    }
  }
  if (active.length === 0) return;

  // Fase 1: limpiar principal en todas
  for (var n = 0; n < active.length; n++) {
    var r1 = await window.supabaseClient.from('producto_imagenes')
      .update({ es_principal: false })
      .eq('id', active[n].id);
    if (r1.error) return { error: 'Fallo limpiando principal: ' + r1.error.message };
  }

  // Fase 2: marcar la primera visible como principal
  var principalId = active[0].id;
  var r2 = await window.supabaseClient.from('producto_imagenes')
    .update({ es_principal: true })
    .eq('id', principalId);
  if (r2.error) return { error: 'Fallo marcando principal: ' + r2.error.message };

  // Fase 3: escribir orden 1..N (1-based)
  for (var k = 0; k < active.length; k++) {
    var r3 = await window.supabaseClient.from('producto_imagenes')
      .update({ orden: active[k].index + 1 })
      .eq('id', active[k].id);
    if (r3.error) return { error: 'Fallo escribiendo orden: ' + r3.error.message };
  }
}

async function deleteAllProductImages(productId) {
  var existing = await window.supabaseClient.from('producto_imagenes').select('*').eq('producto_id', productId);
  var imgs = existing.data || [];
  for (var i = 0; i < imgs.length; i++) {
    await deleteStorageImage(imgs[i].url);
  }
  await window.supabaseClient.from('producto_imagenes').delete().eq('producto_id', productId);
}
