import { connection } from "next/server";
import { CategoryManager } from "@/components/categories/category-manager";
import { PageHeader } from "@/components/ui/misc";
import { listCategories } from "@/lib/data/categories";

export default async function CategoriesPage() {
  await connection();
  const categories = await listCategories();

  return (
    <>
      <PageHeader title="Kategori" description="Dipakai untuk mengelompokkan transaksi di analitik." />
      <CategoryManager categories={categories} />
    </>
  );
}
