"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { trackStorefrontEvent } from "@/components/storefront-analytics";

export type CartProduct = { sku: string; name: string; price: number; brand: string };
type CartLine = CartProduct & { quantity: number };
type CartState = { lines: CartLine[]; itemCount: number; subtotal: number; add: (product: CartProduct) => void; changeQuantity: (sku: string, quantity: number) => void; remove: (sku: string) => void };

const CartContext = createContext<CartState | null>(null);
const storageKey = "notisyon-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as CartLine[];
        if (Array.isArray(stored)) setLines(stored);
      } catch { /* Bozuk yerel sepet verisini boş kabul et. */ }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => { if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(lines)); }, [hydrated, lines]);

  const value = useMemo<CartState>(() => ({
    lines,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    subtotal: lines.reduce((total, line) => total + line.price * line.quantity, 0),
    add: (product) => setLines((current) => {
      const exists = current.find((line) => line.sku === product.sku);
      return exists ? current.map((line) => line.sku === product.sku ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { ...product, quantity: 1 }];
    }),
    changeQuantity: (sku, quantity) => setLines((current) => quantity < 1 ? current.filter((line) => line.sku !== sku) : current.map((line) => line.sku === sku ? { ...line, quantity } : line)),
    remove: (sku) => setLines((current) => current.filter((line) => line.sku !== sku)),
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart, CartProvider içinde kullanılmalıdır.");
  return cart;
}

export function CartLink() {
  const { itemCount } = useCart();
  return <Link href="/sepet">Sepet ({itemCount})</Link>;
}

export function AddToCartButton({ product, className = "add-button", label = "Sepete ekle" }: { product: CartProduct; className?: string; label?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const handleAdd = () => { add(product);trackStorefrontEvent("add_to_cart",{path:window.location.pathname,product_sku:product.sku,cart_value:product.price});setAdded(true); window.setTimeout(() => setAdded(false), 1200); };
  return <button className={className} onClick={handleAdd}>{added ? "Sepete eklendi" : label}</button>;
}
