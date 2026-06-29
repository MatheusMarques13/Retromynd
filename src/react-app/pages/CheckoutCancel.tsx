import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

export default function CheckoutCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const orderId = searchParams.get("order_id");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Cancel the pending order
    if (orderId) {
      setCancelling(true);
      fetch(`/api/orders/${orderId}/cancel`, { method: "POST" })
        .finally(() => setCancelling(false));
    }
  }, [orderId]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(210 100% 55%)" }}
    >
      <div className="panel-raised p-8 max-w-md w-full text-center">
        {/* Title Bar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 -mx-4 -mt-4 mb-6"
          style={{ background: "linear-gradient(90deg, hsl(0 70% 40%), hsl(0 70% 50%))" }}
        >
          <XCircle className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm tracking-wide">
            {t("checkout.cancelTitle")}
          </span>
        </div>

        {/* Cancel Icon */}
        <div className="mb-6">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
            style={{ background: "hsl(0 70% 50%)" }}
          >
            <XCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-retro-dark mb-2 font-display">
          {t("checkout.paymentCancelled")}
        </h1>
        <p className="text-retro-dark/70 mb-6">
          {t("checkout.noCharge")}
        </p>

        {cancelling && (
          <p className="text-sm text-retro-dark/60 mb-4">
            {t("checkout.cancellingOrder")}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-gold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("checkout.tryAgain")}
          </button>

          <button
            onClick={() => navigate("/")}
            className="btn-retro flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {t("checkout.continueShopping")}
          </button>
        </div>
      </div>
    </div>
  );
}
