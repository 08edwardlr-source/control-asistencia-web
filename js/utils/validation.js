// Validaciones reutilizables.
window.Validation = {
  email(valor) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim()); },
  requerido(valor) { return String(valor || '').trim().length > 0; }
};
