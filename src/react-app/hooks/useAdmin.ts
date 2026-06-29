import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/auth";

export function useAdmin() {
  const { user, isPending: authPending } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    if (authPending) return;
    
    if (!user) {
      setIsAdmin(false);
      setIsPending(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setIsPending(false);
      }
    };

    checkAdmin();
  }, [user, authPending]);

  return { isAdmin, isPending: authPending || isPending, user };
}
