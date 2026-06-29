import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/react-app/auth";

export function useWishlist() {
  const { user, isPending } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (isPending) return;
    
    if (user) {
      setIsLoading(true);
      fetch("/api/wishlist")
        .then(res => res.json())
        .then(data => {
          setWishlist(data.productIds || []);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      // Clear wishlist when logged out
      setWishlist([]);
    }
  }, [user, isPending]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!user) {
      return { requiresAuth: true };
    }

    const isInWishlist = wishlist.includes(productId);
    
    // Optimistic update
    setWishlist(prev => 
      isInWishlist
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: isInWishlist ? "DELETE" : "POST",
      });

      if (!response.ok) {
        // Revert on error
        setWishlist(prev => 
          isInWishlist
            ? [...prev, productId]
            : prev.filter(id => id !== productId)
        );
      }
    } catch (error) {
      // Revert on error
      setWishlist(prev => 
        isInWishlist
          ? [...prev, productId]
          : prev.filter(id => id !== productId)
      );
      console.error("Failed to update wishlist:", error);
    }

    return { requiresAuth: false };
  }, [user, wishlist]);

  const isWishlisted = useCallback((productId: string) => {
    return wishlist.includes(productId);
  }, [wishlist]);

  return {
    wishlist,
    isLoading,
    toggleWishlist,
    isWishlisted,
    wishlistCount: wishlist.length,
  };
}
