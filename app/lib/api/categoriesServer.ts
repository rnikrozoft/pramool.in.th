import { cache } from "react"
import { listProductCategories } from "@/app/lib/api/categories"

export const listProductCategoriesCached = cache(listProductCategories)
