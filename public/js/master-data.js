(() => {
  document.querySelectorAll('[data-confirm]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const message = button.getAttribute('data-confirm') || 'Are you sure?';
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });

  const filterForm = document.querySelector('[data-filter-form]');
  if (filterForm) {
    const autoSubmits = filterForm.querySelectorAll('[data-auto-submit]');
    autoSubmits.forEach((select) => {
      select.addEventListener('change', () => {
        filterForm.submit();
      });
    });
  }
})();
