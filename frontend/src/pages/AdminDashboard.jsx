import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Upload,
  CheckCircle,
  XCircle,
  Shield,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { productService } from '../services/productService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Product Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    category: 'Jackets & Coats',
    price: '',
    original_price: '',
    stock: '',
    sizes: 'XS, S, M, L, XL',
    colors: 'Black, Camel',
    tags: 'winter, formal, warm',
    images: ['/placeholder.png'],
    is_featured: false,
    is_active: true,
  });

  // Verify Admin Access
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'products') {
        const res = await productService.getProducts({ limit: 50 });
        setProducts(res.items || []);
      } else {
        const res = await adminService.listAllOrders(1, 50);
        setOrders(res.items || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [activeTab, isAdmin]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      category: 'Jackets & Coats',
      price: '',
      original_price: '',
      stock: '',
      sizes: 'XS, S, M, L, XL',
      colors: 'Black, Camel',
      tags: 'winter, formal, warm',
      images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80'],
      is_featured: false,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      title: p.title,
      description: p.description,
      category: p.category,
      price: p.price.toString(),
      original_price: p.original_price ? p.original_price.toString() : '',
      stock: p.stock.toString(),
      sizes: p.sizes?.join(', ') || '',
      colors: p.colors?.join(', ') || '',
      tags: p.tags?.join(', ') || '',
      images: p.images || ['/placeholder.png'],
      is_featured: p.is_featured || false,
      is_active: p.is_active !== undefined ? p.is_active : true,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await adminService.uploadImage(file);
      setProductForm((prev) => ({
        ...prev,
        images: [res.url, ...(prev.images || [])],
      }));
      setSuccess('Image uploaded and attached successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Image upload failed. Ensure file is PNG/JPG under 5MB.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: productForm.title.trim(),
        description: productForm.description.trim(),
        category: productForm.category.trim(),
        price: parseFloat(productForm.price),
        original_price: productForm.original_price ? parseFloat(productForm.original_price) : undefined,
        stock: parseInt(productForm.stock, 10),
        sizes: productForm.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: productForm.colors.split(',').map((c) => c.trim()).filter(Boolean),
        tags: productForm.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        images: productForm.images.filter(Boolean),
        is_featured: productForm.is_featured,
        is_active: productForm.is_active,
      };

      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, payload);
        setSuccess(`Product '${payload.title}' updated successfully.`);
      } else {
        await adminService.createProduct(payload);
        setSuccess(`Product '${payload.title}' created successfully.`);
      }

      setModalOpen(false);
      setTimeout(() => setSuccess(''), 3500);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (productId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${title}'?`)) return;
    try {
      await adminService.deleteProduct(productId);
      setSuccess(`Product deleted successfully.`);
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order status updated to '${newStatus}'.`);
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    }
  };

  if (authLoading || (!isAdmin && loading)) {
    return <LoadingSpinner text="Verifying administrator credentials..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Shield className="w-4 h-4" />
            <span>Store Administration Console</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
            Control Center
          </h1>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catalog ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}>&times;</button>
        </div>
      )}

      {/* ================= TAB 1: PRODUCT MANAGEMENT ================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              Garments & Inventory
            </h2>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Garment
            </button>
          </div>

          {loading ? (
            <LoadingSpinner text="Fetching store catalog..." />
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-600">
                  <thead className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-100">
                    <tr>
                      <th className="py-3.5 px-4">Garment</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={p.images?.[0] || '/placeholder.png'}
                            alt={p.title}
                            className="w-10 h-12 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900">{p.title}</p>
                            <p className="text-[11px] text-neutral-400">
                              Sizes: {p.sizes?.join(', ')}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-neutral-700">{p.category}</td>
                        <td className="py-3.5 px-4 font-bold text-neutral-900">
                          ${p.price.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-semibold ${
                              p.stock <= 5 ? 'text-red-600' : 'text-neutral-800'
                            }`}
                          >
                            {p.stock} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              p.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.title)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ORDER MANAGEMENT ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-neutral-900">Customer Orders</h2>

          {loading ? (
            <LoadingSpinner text="Fetching customer orders..." />
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-600">
                  <thead className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-100">
                    <tr>
                      <th className="py-3.5 px-4">Order #</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Items</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                          {o.order_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-neutral-900">
                            {o.shipping_address?.full_name}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {o.shipping_address?.city}, {o.shipping_address?.state}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          {o.items?.length} item{o.items?.length === 1 ? '' : 's'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-neutral-900">
                          ${o.total.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 uppercase font-semibold text-[11px]">
                          {o.payment_method.replace('_', ' ')} ({o.payment_status})
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={o.order_status}
                            onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                            className="bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                          >
                            <option value="placed">Placed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= PRODUCT CREATE / EDIT MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <h3 className="font-serif text-2xl font-bold text-neutral-900">
                {editingProduct ? 'Edit Catalog Garment' : 'Add New Catalog Garment'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Garment Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pure Mongolian Cashmere Cardigan"
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white font-medium"
                  >
                    <option value="Jackets & Coats">Jackets & Coats</option>
                    <option value="Sweaters & Knits">Sweaters & Knits</option>
                    <option value="Shirts & Tops">Shirts & Tops</option>
                    <option value="Pants & Trousers">Pants & Trousers</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={productForm.original_price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, original_price: e.target.value })
                    }
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Available Stock *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="25"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe fabrics, weave, cut, and fit..."
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Sizes (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={productForm.sizes}
                    onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Colors (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={productForm.colors}
                    onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Search Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="warm, formal, winter, cashmere"
                    value={productForm.tags}
                    onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                  />
                </div>

                {/* Upload Image Section */}
                <div className="sm:col-span-2 bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Upload Garment Photo (PNG/JPG/WEBP &lt; 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800"
                  />
                  {uploadingImage && <p className="text-[11px] text-amber-700">Uploading media...</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
