document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  const docSections = document.querySelectorAll('.doc-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const provider = item.dataset.provider;

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      docSections.forEach(section => {
        if (section.dataset.provider === provider) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    });
  });
});
