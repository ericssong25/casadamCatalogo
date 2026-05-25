/**
 * Casa Dam Admin — Manejo de upload de imágenes a Supabase Storage
 */

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

  // Update orden and es_principal for all active saved images
  for (var k = 0; k < images.length; k++) {
    var saved = images[k];
    if (saved.saved && saved.id && !saved.toDelete) {
      await window.supabaseClient.from('producto_imagenes').update({
        es_principal: saved.es_principal,
        orden: k
      }).eq('id', saved.id);
    }
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
