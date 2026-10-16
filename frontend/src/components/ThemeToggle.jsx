import { useState } from "react";
import { getTheme, setTheme } from "../utils/theme";

// Botón para cambiar entre modo claro y oscuro.
function ThemeToggle({ className = "" }) {
  const [theme, setThemeState] = useState(getTheme);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      className={`px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-100 transition ${className}`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

export default ThemeToggle;
