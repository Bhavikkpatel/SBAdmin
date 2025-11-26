import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SparePartsList from './SparePartsList';
import Modal from './Modal';
import ProductForm from './ProductForm';
import SparePartForm from './SparePartForm';
import './ProductDetails.css';

// CHANGED: Define target collection for products
const PRODUCTS_COLLECTION = 'products_staging';

const ProductDetails = ({ companyId, productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddPartForm, setShowAddPartForm] = useState(false);
  const [sparePartsRefreshKey, setSparePartsRefreshKey] = useState(0);

  const fetchProduct = useCallback(async () => {
    try {
      // CHANGED: Fetch from root collection using just productId
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // IMPORTANT: Include docId in the product state so ProductForm knows it's an update
        setProduct({ ...data, docId: docSnap.id });

        // Only set selected image if it hasn't been set yet or if we want to reset it on refresh
        // For now, let's keep the current selection if valid, else default
        if (!selectedImage) {
          setSelectedImage(data.thumbNailUrl || 'placeholder.jpg');
        }
      } else {
        console.log("No such product!");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, selectedImage]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [fetchProduct, productId]);

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchProduct(); // Refresh data after edit
  };

  const handleAddPartClose = (val) => {
    setShowAddPartForm(val);
    if (!val) {
      // Form closed, trigger refresh of list
      setSparePartsRefreshKey(prev => prev + 1);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found.</div>;

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="product-details-container">
        <div className="product-image-gallery">
          {/* Added fallback for missing images */}
          <img src={selectedImage || product.thumbNailUrl || 'placeholder.jpg'} alt={product.modelId} className="product-main-image" />

          {product.otherImageUrls && product.otherImageUrls.length > 0 && (
            <div className="thumbnail-grid">
              <img
                src={product.thumbNailUrl || 'placeholder.jpg'}
                alt="Thumbnail Main"
                className={`thumbnail-image ${selectedImage === (product.thumbNailUrl || 'placeholder.jpg') ? 'active' : ''}`}
                onClick={() => setSelectedImage(product.thumbNailUrl || 'placeholder.jpg')}
              />
              {product.otherImageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Thumbnail ${index}`}
                  className={`thumbnail-image ${selectedImage === url ? 'active' : ''}`}
                  onClick={() => setSelectedImage(url)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1>{product.modelId}</h1>
            {/* Edit button removed, moved to FAB */}
          </div>

          <p>{product.description}</p>
          <p><strong>Category:</strong> {product.category}</p>
          {/* Count might not exist on all products, conditional render is safer */}
          {product.count !== undefined && <p><strong>Count:</strong> {product.count}</p>}

          {/* CHANGED: Updated button class for specific styling */}
          {product.manualUrl ? (
            <a href={product.manualUrl} target="_blank" rel="noopener noreferrer" className="btn-view-manual">
              View Manual
            </a>
          ) : (
            <span className="text-muted">No manual available</span>
          )}

          <hr />
          <h3>Specifications</h3>
          <ul className="list-group">
            {product.specifications && Object.keys(product.specifications).length > 0 ? (
              Object.entries(product.specifications).map(([key, value]) => (
                <li key={key} className="list-group-item">
                  <strong>{key}:</strong> {value}
                </li>
              ))
            ) : (
              <p className="text-muted">No specifications found.</p>
            )}
          </ul>
        </div>
      </div>

      <div className="spare-parts-section">
        <div className="section-header">
          <h3>Spare Parts</h3>
          {/* Add Part button removed, moved to FAB */}
        </div>
        <SparePartsList key={sparePartsRefreshKey} companyId={companyId} productId={productId} />
      </div>

      {/* Floating Action Buttons - Always Visible */}
      <div className="fab-container">
        <div className="fab-wrapper">
          <span className="fab-label">Add Spare Part</span>
          <button
            className="fab-btn btn-add"
            onClick={() => setShowAddPartForm(true)}
            title="Add Spare Part"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div className="fab-wrapper">
          <span className="fab-label">Edit Product</span>
          <button
            className="fab-btn btn-edit"
            onClick={() => setShowEditForm(true)}
            title="Edit Product"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
        </div>
      </div>

      <Modal isOpen={showEditForm} onClose={() => setShowEditForm(false)}>
        <ProductForm product={product} companyId={companyId} setShowForm={handleEditSuccess} />
      </Modal>

      <Modal isOpen={showAddPartForm} onClose={() => setShowAddPartForm(false)}>
        <SparePartForm companyId={companyId} productId={productId} setShowForm={handleAddPartClose} />
      </Modal>
    </div>
  );
};

export default ProductDetails;