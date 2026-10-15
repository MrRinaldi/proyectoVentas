import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Store from "./pages/Store";
import StoreBurger from "./pages/StoreBurger";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import CreateBusiness from "./pages/CreateBusiness";
import Home from "./pages/Home";
import StoreList from "./pages/StoreList";
import ProductManagement from "./pages/ProductManagement";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<StoreList />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<CreateBusiness />} />
        <Route path="/create-business" element={<CreateBusiness />} />
        <Route path="/:slug" element={<Store />} />
        <Route path="/:slug/burger" element={<StoreBurger />} />
        <Route path="/:slug/orders" element={<Orders />} />
        <Route path="/:slug/products" element={<ProductManagement />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;