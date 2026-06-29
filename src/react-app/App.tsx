import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/auth";
import { LanguageProvider } from "@/react-app/contexts/LanguageContext";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import LoginPage from "@/react-app/pages/Login";
import MarketplacePage from "@/react-app/pages/Marketplace";
import CreateListingPage from "@/react-app/pages/CreateListing";
import BrowseListingsPage from "@/react-app/pages/BrowseListings";
import ListingDetailPage from "@/react-app/pages/ListingDetail";
import SellerProfilePage from "@/react-app/pages/SellerProfile";
import MessagesPage from "@/react-app/pages/Messages";
import ConversationPage from "@/react-app/pages/Conversation";
import AdminDashboardPage from "@/react-app/pages/AdminDashboard";
import AdminProductsPage from "@/react-app/pages/AdminProducts";
import AdminProductFormPage from "@/react-app/pages/AdminProductForm";
import AdminSuppliersPage from "@/react-app/pages/AdminSuppliers";
import AdminProductImportPage from "@/react-app/pages/AdminProductImport";
import AdminOrdersPage from "@/react-app/pages/AdminOrders";
import AdminProfitDashboardPage from "@/react-app/pages/AdminProfitDashboard";
import AdminDisputesPage from "@/react-app/pages/AdminDisputes";
import MyOrdersPage from "@/react-app/pages/MyOrders";
import CheckoutSuccessPage from "@/react-app/pages/CheckoutSuccess";
import CheckoutCancelPage from "@/react-app/pages/CheckoutCancel";
import ShopPage from "@/react-app/pages/Shop";
import ArcadePage from "@/react-app/pages/Arcade";
import CustomProductsPage from "@/react-app/pages/CustomProducts";
import TransactionRoomPage from "@/react-app/pages/TransactionRoom";
import MyTransactionsPage from "@/react-app/pages/MyTransactions";
import UserProfilePage from "@/react-app/pages/UserProfile";
import RetroLabPage from "@/react-app/pages/RetroLab";
import ShadowHunterPage from "@/react-app/pages/ShadowHunter";
import RetroPassPage from "@/react-app/pages/RetroPass";
import OnlineLobbyPage from "@/react-app/pages/OnlineLobby";
import OnlineGamePage from "@/react-app/pages/OnlineGame";
import GiftCardGuidePage from "@/react-app/pages/GiftCardGuide";
import { RetroIntelligence } from "@/react-app/components/RetroIntelligence";
import { RetroRadio } from "@/react-app/components/RetroRadio";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <RetroIntelligence />
            <RetroRadio />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/arcade" element={<ArcadePage />} />
              <Route path="/custom-products" element={<CustomProductsPage />} />
              <Route path="/retrolab" element={<RetroLabPage />} />
              <Route path="/retrolab/demo" element={<RetroLabPage />} />
              <Route path="/shadow-hunter" element={<ShadowHunterPage />} />
              <Route path="/retropass" element={<RetroPassPage />} />
              <Route path="/retropass/demo" element={<RetroPassPage />} />
              <Route path="/guia-gift-cards" element={<GiftCardGuidePage />} />
              <Route path="/online" element={<OnlineLobbyPage />} />
              <Route path="/online/demo" element={<OnlineLobbyPage />} />
              <Route path="/online/game/:roomCode" element={<OnlineGamePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/marketplace/sell" element={<CreateListingPage />} />
              <Route path="/marketplace/browse" element={<BrowseListingsPage />} />
              <Route path="/marketplace/listing/:id" element={<ListingDetailPage />} />
              <Route path="/marketplace/seller/:userId" element={<SellerProfilePage />} />
              <Route path="/marketplace/transactions" element={<MyTransactionsPage />} />
              <Route path="/marketplace/transactions/demo" element={<MyTransactionsPage />} />
              <Route path="/marketplace/transaction/:id" element={<TransactionRoomPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:id" element={<ConversationPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/my-orders/demo" element={<MyOrdersPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/profile/demo" element={<UserProfilePage />} />
              <Route path="/profile/:username" element={<UserProfilePage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/products/new" element={<AdminProductFormPage />} />
              <Route path="/admin/products/:id" element={<AdminProductFormPage />} />
              <Route path="/admin/suppliers" element={<AdminSuppliersPage />} />
              <Route path="/admin/suppliers/import" element={<AdminProductImportPage />} />
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/profit" element={<AdminProfitDashboardPage />} />
              <Route path="/admin/disputes" element={<AdminDisputesPage />} />
              {/* Demo admin routes for preview testing */}
              <Route path="/admin/demo" element={<AdminDashboardPage />} />
              <Route path="/admin/demo/products" element={<AdminProductsPage />} />
              <Route path="/admin/demo/products/new" element={<AdminProductFormPage />} />
              <Route path="/admin/demo/products/:id" element={<AdminProductFormPage />} />
              <Route path="/admin/demo/suppliers" element={<AdminSuppliersPage />} />
              <Route path="/admin/demo/suppliers/import" element={<AdminProductImportPage />} />
              <Route path="/admin/demo/profit" element={<AdminProfitDashboardPage />} />
              <Route path="/admin/demo/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/demo/disputes" element={<AdminDisputesPage />} />
            </Routes>
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
