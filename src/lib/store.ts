import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type Variant = Tables<"product_variants">;
export type ProductWithVariants = Product & { product_variants: Variant[]; categories: Category | null };

export const SIZES = ["Single", "Double", "Queen", "King", "Estándar"] as const;
export const FREE_SHIPPING_FROM = 300000;
export const SHIPPING_COST = 15000;

export const shippingFor = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;

export const money = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*), categories(*)")
        .order("created_at");
      if (error) throw error;
      return data as ProductWithVariants[];
    },
  });

export const variantPrice = (p: Product, v?: Variant | null) => Number(p.base_price) + Number(v?.price_adjustment ?? 0);

export async function uploadImage(file: File): Promise<string> {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const { error } = await supabase.storage.from("catalog").upload(path, file);
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("catalog").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("No URL");
  return data.signedUrl;
}
