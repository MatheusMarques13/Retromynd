import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/auth";

export default function AuthCallbackPage() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        await exchangeCodeForSessionToken();
        navigate("/");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Failed to complete login. Please try again.");
      }
    }
    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="panel-raised p-6 max-w-md">
          <div className="title-bar mb-4">
            <span className="font-pixel">⚠️ ERROR</span>
          </div>
          <div className="panel-inset p-4">
            <p className="text-retro-dark font-mono">{error}</p>
            <button 
              onClick={() => navigate("/")}
              className="btn-gold w-full mt-4 py-2 font-bold"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="panel-raised p-6">
        <div className="title-bar mb-4">
          <span className="font-pixel">AUTHENTICATING...</span>
        </div>
        <div className="panel-inset p-6 flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-retro-gold border-t-transparent rounded-full" />
          <p className="text-retro-dark font-mono">Completing login...</p>
        </div>
      </div>
    </div>
  );
}
