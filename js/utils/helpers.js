// Helpers reutilizables de la interfaz.
window.Helpers = {
  qs(selector, root=document) { return root.querySelector(selector); },
  qsa(selector, root=document) { return [...root.querySelectorAll(selector)]; }
};
