import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import ProductForm from './ProductForm';
import Modal from './Modal';
import './ProductsList.css';

const ProductsList = ({ companyId }) => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'companies', companyId, 'products'), where("isDeleted", "!=", true));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id })));
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching products for company ${companyId}: `, error);
      setLoading(false);
    });

    return () => unsub();
  }, [companyId]);


  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setSelectedProduct(null); }}>Add Product</button>
      </div>

      {loading && <p>Loading products...</p>}
      
      
      <div className="products-grid">
        {products.map(product => (
          <div key={product.docId} className="product-card">
            <img src={product.thumbNailUrl} className="product-card-image" alt={product.modelId} />
            <div className="product-card-body">
              <h5 className="product-card-title">{product.modelId}</h5>
              <p className="product-card-text">{product.description}</p>
              <div className="product-card-actions">
                <button className="btn btn-secondary" onClick={() => { setShowForm(true); setSelectedProduct(product); }}>Edit</button>
                <Link to={`/company/${companyId}/product/${product.docId}`} className="btn btn-info">View</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && <p>No products found for this company.</p>}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <ProductForm product={selectedProduct} companyId={companyId} setShowForm={setShowForm} />
      </Modal>
    </div>
  );
};

export default ProductsList;