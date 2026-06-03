"use client";

import { useEffect, useState } from "react";
import { FALLBACK_PRODUCT_CATEGORIES, listProductCategories } from "@/app/lib/api/categories";

export function useProductCategories(): string[] {
    const [categories, setCategories] = useState<string[]>([...FALLBACK_PRODUCT_CATEGORIES]);

    useEffect(() => {
        let cancelled = false;
        void listProductCategories().then((items) => {
            if (!cancelled && items.length > 0) {
                setCategories(items);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return categories;
}

/** Category bar labels: «ทั้งหมด» + active categories from API. */
export function useCategoryBarLabels(): string[] {
    const categories = useProductCategories();
    return ["ทั้งหมด", ...categories];
}
