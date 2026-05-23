document.addEventListener('DOMContentLoaded', () => {
  if (window.AOS) {
    AOS.init({ duration: 700, once: true, offset: 50 });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const form = document.querySelector('.contact-form');
  const formStatus = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (formStatus) {
        formStatus.textContent = 'Thanks! This static form is configured for UI demo only. Please email me directly.';
      }
      form.reset();
    });
  }
});
