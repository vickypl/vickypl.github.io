document.addEventListener('DOMContentLoaded', () => {
  if (window.AOS) {
    AOS.init({ duration: 700, once: true, offset: 50 });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
