// Simple event bus for admin UI cross-component signals
export const adminBus = new EventTarget();

export const emitAdminEvent = (name, detail) => {
  try { adminBus.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
};

export const onAdminEvent = (name, handler) => {
  try { adminBus.addEventListener(name, handler); return () => adminBus.removeEventListener(name, handler); } catch { return () => {}; }
};
