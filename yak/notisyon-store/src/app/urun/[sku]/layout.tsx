import { ProductReviews } from "@/components/product-reviews";
export default async function ProductLayout({children,params}:{children:React.ReactNode;params:Promise<{sku:string}>}){const{sku}=await params;return <>{children}<ProductReviews sku={sku}/></>}
