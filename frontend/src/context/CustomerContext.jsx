import { createContext, useCallback, useContext, useState } from "react";

// Sesiones de cliente final. Son por tienda (un cliente tiene una cuenta distinta en cada tienda)
// y están separadas de la sesión del personal (AuthContext).
// Se guardan en el navegador con la clave customer:<slug> = { token, customer }.
const CustomerContext = createContext();

const storageKey = (slug) => `customer:${slug}`;

function readStoredSession(slug) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(slug)) || "null");
  } catch {
    return null;
  }
}

export function CustomerProvider({ children }) {
  // Sesiones ya leídas o cambiadas en esta visita, para que la interfaz se actualice al instante.
  const [sessions, setSessions] = useState({});

  const getSession = useCallback(
    (slug) => (slug in sessions ? sessions[slug] : readStoredSession(slug)),
    [sessions]
  );

  const saveSession = useCallback((slug, session) => {
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(session));
    } catch {
      // Sin almacenamiento disponible: la sesión dura mientras la página esté abierta.
    }
    setSessions((prev) => ({ ...prev, [slug]: session }));
  }, []);

  const clearSession = useCallback((slug) => {
    try {
      localStorage.removeItem(storageKey(slug));
    } catch {
      // Nada que borrar.
    }
    setSessions((prev) => ({ ...prev, [slug]: null }));
  }, []);

  return (
    <CustomerContext.Provider value={{ getSession, saveSession, clearSession }}>
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomer = () => useContext(CustomerContext);
