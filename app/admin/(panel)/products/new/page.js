import ProductForm from '@/components/admin/ProductForm';

export const metadata = { title: 'Add Product' };

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-bold">Add New Product</h1>
      <ProductForm />
    </div>
  );
}
