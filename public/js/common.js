(() => {
  const sidebar = document.querySelector('[data-sidebar]');
  const toggle = document.querySelector('[data-sidebar-toggle]');
  const backdrop = document.querySelector('[data-sidebar-backdrop]');

  const setSidebarOpen = (isOpen) => {
    sidebar?.classList.toggle('ss-sidebar--open', isOpen);
    if (backdrop) backdrop.hidden = !isOpen;
    toggle?.setAttribute('aria-expanded', String(isOpen));
  };

  toggle?.addEventListener('click', () => {
    setSidebarOpen(!sidebar.classList.contains('ss-sidebar--open'));
  });

  backdrop?.addEventListener('click', () => setSidebarOpen(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setSidebarOpen(false);
  });

  document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
    const button = dropdown.querySelector('[data-dropdown-toggle]');
    const menu = dropdown.querySelector('[data-dropdown-menu]');
    const icon = dropdown.querySelector('[data-dropdown-icon]');

    const close = () => {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      icon?.classList.replace('bi-chevron-up', 'bi-chevron-down');
    };

    const open = () => {
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      icon?.classList.replace('bi-chevron-down', 'bi-chevron-up');
    };

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.hidden ? open() : close();
    });

    dropdown.querySelectorAll('[data-dropdown-item]').forEach((item) => {
      item.addEventListener('click', close);
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target)) close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
  });
})();