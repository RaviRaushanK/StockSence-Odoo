(() => {
  const wireWarehouseSelect = (select) => {
    const url = select.getAttribute('data-locations-url');
    const targetId = select.getAttribute('data-location-target');
    if (!url || !targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    select.addEventListener('change', async () => {
      const wid = select.value;
      target.innerHTML = '<option value="">Loading...</option>';
      if (!wid) {
        target.innerHTML = '<option value="">Select warehouse first</option>';
        return;
      }
      try {
        const res = await fetch(`${url}/${wid}`, { headers: { Accept: 'application/json' } });
        const payload = await res.json();
        const rows = (payload && payload.data) || [];
        if (rows.length === 0) {
          target.innerHTML = '<option value="">No active locations</option>';
          return;
        }
        target.innerHTML = '<option value="">Select location</option>'
          + rows.map((l) => `<option value="${l.id}">${l.name} (${l.code})</option>`).join('');
      } catch {
        target.innerHTML = '<option value="">Could not load locations</option>';
      }
    });
  };

  document.querySelectorAll('[data-warehouse-select]').forEach(wireWarehouseSelect);

  document.querySelectorAll('[data-items-table]').forEach((table) => {
    const body = table.querySelector('[data-items-body]');
    const addBtn = table.parentElement && table.parentElement.nextElementSibling
      ? table.parentElement.nextElementSibling.querySelector('[data-add-row]')
      : document.querySelector('[data-add-row]');
    const optionsTpl = document.getElementById('productOptions');
    const addRow = () => {
      const first = body.querySelector('[data-item-row]');
      if (!first) return;
      const clone = first.cloneNode(true);
      clone.querySelectorAll('input').forEach((i) => { i.value = ''; });
      clone.querySelectorAll('select').forEach((s) => { s.selectedIndex = 0; });
      body.appendChild(clone);
    };
    if (addBtn) addBtn.addEventListener('click', addRow);
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-row]');
      if (!btn) return;
      const rows = body.querySelectorAll('[data-item-row]');
      if (rows.length <= 1) {
        rows[0].querySelectorAll('input').forEach((i) => { i.value = ''; });
        rows[0].querySelectorAll('select').forEach((s) => { s.selectedIndex = 0; });
        return;
      }
      btn.closest('[data-item-row]').remove();
    });
    if (optionsTpl) table.dataset.hasOptions = '1';
  });

  const transferForm = document.querySelector('[data-transfer-form]');
  if (transferForm) {
    const src = transferForm.querySelector('#sourceLocationId');
    const dst = transferForm.querySelector('#destinationLocationId');
    const warn = transferForm.querySelector('[data-same-location-warning]');
    const check = () => {
      const same = src && dst && src.value && dst.value && src.value === dst.value;
      if (warn) warn.hidden = !same;
    };
    if (src) src.addEventListener('change', check);
    if (dst) dst.addEventListener('change', check);
    transferForm.addEventListener('submit', (e) => {
      if (src && dst && src.value && dst.value && src.value === dst.value) {
        e.preventDefault();
        if (warn) warn.hidden = false;
        window.alert('Source and destination locations must be different.');
      }
    });
  }

  document.querySelectorAll('[data-confirm]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const message = button.getAttribute('data-confirm') || 'Are you sure?';
      if (!window.confirm(message)) event.preventDefault();
    });
  });
})();
