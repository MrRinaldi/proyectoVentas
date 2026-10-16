import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Store from "./pages/Store";
import StoreBurger from "./pages/StoreBurger";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import StoreList from "./pages/StoreList";
import ProductManagement from "./pages/ProductManagement";
import AdminPanel from "./pages/AdminPanel";
import StoreSettings from "./pages/StoreSettings";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<StoreList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/:slug" element={<Store />} />
        <Route path="/:slug/burger" element={<StoreBurger />} />
        <Route path="/:slug/orders" element={<Orders />} />
        <Route path="/:slug/products" element={<ProductManagement />} />
        <Route path="/:slug/settings" element={<StoreSettings />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;