import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { useLanguage } from "@/react-app/contexts/LanguageContext";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const orderId = searchParams.get("order_id");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/my-orders");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(210 100% 55%)" }}
    >
      <div className="panel-raised p-8 max-w-md w-full text-center">
        {/* Title Bar */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 -mx-4 -mt-4 mb-6"
          style={{ background: "linear-gradient(90deg, hsl(330 80% 45%), hsl(330 80% 65%))" }}
        >
          <CheckCircle className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm tracking-wide">
            {t("checkout.successTitle")}
          </span>
        </div>

        {/* Success Icon */}
        <div className="mb-6">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
            style={{ background: "hsl(120 60% 45%)" }}
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-retro-dark mb-2 font-display">
          {t("checkout.thankYou")}
        </h1>
        <p className="text-retro-dark/70 mb-4">
          {t("checkout.orderConfirmed")}
        </p>

        {orderId && (
          <div className="panel-inset p-3 mb-6">
            <p className="text-sm text-retro-dark/60">{t("checkout.orderNumber")}</p>
            <p className="text-lg font-bold text-retro-dark font-mono">#{orderId}</p>
          </div>
        )}

        {/* Auto-redirect notice */}
        <p className="text-sm text-retro-dark/60 mb-4">
          {t("checkout.redirecting")} {countdown}s...
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/my-orders")}
            className="btn-gold flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            {t("checkout.viewOrders")}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate("/")}
            className="btn-retro"
          >
            {t("checkout.continueShopping")}
          </button>
        </div>
      </div>
    </div>
  );
}
