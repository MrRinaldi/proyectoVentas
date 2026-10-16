// Modo claro / oscuro. La elección se guarda en el navegador; sin elección, se sigue al sistema.
// index.html aplica el tema guardado antes de cargar React para que no haya un parpadeo claro.

const STORAGE_KEY = "theme";

export function getTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento: el tema dura mientras la página esté abierta.
  }
}
