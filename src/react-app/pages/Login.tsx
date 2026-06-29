import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/auth";

import { Mail, X, AlertCircle, Gamepad2 } from "lucide-react";
import { GameboyMascot } from "@/react-app/components/GameboyMascot";

export default function Login() {
  const navigate = useNavigate();
  const { redirectToLogin, user } = useAuth();

  const [email, setEmail] = useState("");
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await redirectToLogin();
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  const handleAppleClick = () => {
    setShowComingSoon("Apple");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowComingSoon("Email");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "hsl(330 80% 65%)" }}
    >
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines" />
      
      {/* Main login window */}
      <div className="w-full max-w-md panel-raised">
        {/* Title bar */}
        <div className="title-bar">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            <span className="font-pixel text-base">retromynd - Login</span>
          </div>
          <button 
            onClick={() => navigate("/")}
            className="btn-retro px-2 py-0.5 text-black text-xs"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Window content */}
        <div className="p-6 space-y-6">
          {/* Welcome message */}
          <div className="text-center space-y-2">
            <div className="flex justify-center py-4">
              <GameboyMascot size="xl" />
            </div>
            <h1 className="font-pixel text-3xl text-gray-900">
              Welcome to retromynd!
            </h1>
            <p className="text-sm text-gray-700">
              Sign in to access your wishlist and exclusive deals
            </p>
          </div>

          {/* Login options */}
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full btn-gold py-3 px-4 flex items-center justify-center gap-3 font-pixel text-lg disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Connecting..." : "Sign in with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-0.5 bg-gray-400" />
              <span className="text-xs text-gray-600 font-bold">OR</span>
              <div className="flex-1 h-0.5 bg-gray-400" />
            </div>

            {/* Apple Sign In */}
            <button
              onClick={handleAppleClick}
              className="w-full btn-retro py-3 px-4 flex items-center justify-center gap-3 font-pixel text-lg bg-black text-white hover:bg-gray-900"
              style={{ 
                background: "#000",
                borderColor: "#333 #000 #000 #333"
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Sign in with Apple
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-0.5 bg-gray-400" />
              <span className="text-xs text-gray-600 font-bold">OR</span>
              <div className="flex-1 h-0.5 bg-gray-400" />
            </div>

            {/* Email Sign In */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="panel-inset p-1">
                <div className="flex items-center gap-2 px-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 bg-transparent py-2 outline-none text-sm font-mono"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full btn-retro py-3 px-4 font-pixel text-lg"
              >
                Continue with Email
              </button>
            </form>
          </div>

          {/* Footer text */}
          <div className="text-center">
            <p className="text-xs text-gray-600">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Back to shopping */}
          <div className="pt-2 border-t-2 border-gray-400">
            <button
              onClick={() => navigate("/")}
              className="w-full text-center text-sm text-blue-800 hover:underline font-bold"
            >
              ← Continue shopping as guest
            </button>
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="panel-raised max-w-sm w-full">
            <div className="title-bar">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-pixel text-sm">Notice</span>
              </div>
              <button 
                onClick={() => setShowComingSoon(null)}
                className="btn-retro px-2 py-0.5 text-black text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <GameboyMascot size="lg" animate={false} />
              </div>
              <h2 className="font-pixel text-xl text-gray-900">
                {showComingSoon} Login Coming Soon!
              </h2>
              <p className="text-sm text-gray-700">
                We're working hard to bring you {showComingSoon.toLowerCase()} authentication. 
                In the meantime, please sign in with Google.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setShowComingSoon(null)}
                  className="btn-retro px-6 py-2 font-pixel"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setShowComingSoon(null);
                    handleGoogleLogin();
                  }}
                  className="btn-gold px-6 py-2 font-pixel"
                >
                  Use Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
