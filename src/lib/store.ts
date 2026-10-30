import { queryOptions } from "@tanstack/react-query";
import {
  fileToDataUrl,
  getCategories,
  getProducts,
  type Category,
  type Product,
  type ProductWithVariants,
  type Variant,
} from "@/lib/local-db";

export type { Category, Product, ProductWithVariants, Variant };

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
    queryFn: async () => getCategories(),
  });

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async () => getProducts(),
  });

export const variantPrice = (p: Product, v?: Variant | null) => Number(p.base_price) + Number(v?.price_adjustment ?? 0);

export async function uploadImage(file: File): Promise<string> {
  return fileToDataUrl(file);
}
