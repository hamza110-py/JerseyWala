import ProductForm from '@/components/admin/ProductForm';

export const metadata = { title: 'Edit Product' };

export default function EditProductPage({ params }) {
  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-bold">Edit Product</h1>
      <ProductForm productId={params.id} />
    </div>
  );
}
