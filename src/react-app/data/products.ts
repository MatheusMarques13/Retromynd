export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: string;
  rating: number;
  reviews: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Mechanical RGB Keyboard",
    price: 149.99,
    originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop",
    category: "Gaming",
    badge: "HOT",
    rating: 4.9,
    reviews: 1247,
  },
  {
    id: "2",
    name: "Retro Game Console",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400&h=400&fit=crop",
    category: "Retro Tech",
    badge: "CLASSIC",
    rating: 4.8,
    reviews: 892,
  },
  {
    id: "3",
    name: "Sci-Fi Movie Poster Set",
    price: 34.99,
    originalPrice: 49.99,
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop",
    category: "Collectibles",
    rating: 4.7,
    reviews: 234,
  },
  {
    id: "4",
    name: "LED Gaming Mouse",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop",
    category: "Gaming",
    badge: "NEW",
    rating: 4.6,
    reviews: 567,
  },
  {
    id: "5",
    name: "Vintage Comic Collection",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=400&fit=crop",
    category: "Comics",
    badge: "RARE",
    rating: 4.9,
    reviews: 156,
  },
  {
    id: "6",
    name: "Strategy Board Game Deluxe",
    price: 64.99,
    originalPrice: 84.99,
    image: "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=400&fit=crop",
    category: "Board Games",
    badge: "SALE",
    rating: 4.8,
    reviews: 423,
  },
  {
    id: "7",
    name: "Anime Figure - Limited Edition",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&h=400&fit=crop",
    category: "Collectibles",
    badge: "LIMITED",
    rating: 4.9,
    reviews: 789,
  },
  {
    id: "8",
    name: "VR Headset Stand",
    price: 44.99,
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&h=400&fit=crop",
    category: "Gaming",
    rating: 4.5,
    reviews: 312,
  },
  {
    id: "9",
    name: "Pixel Art Desk Lamp",
    price: 59.99,
    originalPrice: 79.99,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    category: "Decor",
    badge: "TRENDING",
    rating: 4.7,
    reviews: 445,
  },
  {
    id: "10",
    name: "D&D Dice Set - Metal",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1551431009-a802eeec77b1?w=400&h=400&fit=crop",
    category: "Board Games",
    badge: "POPULAR",
    rating: 4.8,
    reviews: 678,
  },
  {
    id: "11",
    name: "Retro Cassette Player",
    price: 119.99,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    category: "Retro Tech",
    badge: "NOSTALGIC",
    rating: 4.6,
    reviews: 234,
  },
  {
    id: "12",
    name: "Gaming Headset Pro",
    price: 159.99,
    originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop",
    category: "Gaming",
    badge: "HOT",
    rating: 4.9,
    reviews: 1567,
  },
];

export const categories = [
  { name: "All", icon: "Rocket" },
  { name: "Gaming", icon: "Gamepad2" },
  { name: "Collectibles", icon: "Trophy" },
  { name: "Retro Tech", icon: "Tv" },
  { name: "Board Games", icon: "Dice5" },
  { name: "Comics", icon: "Sparkles" },
  { name: "Decor", icon: "Lamp" },
];
