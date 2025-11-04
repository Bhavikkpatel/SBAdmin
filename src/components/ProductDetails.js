import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SparePartsList from './SparePartsList';
import './ProductDetails.css';

const ProductDetails = ({ companyId, productId }) => {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, 'companies', companyId, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct(docSnap.data());
      }
    };
    if (companyId && productId) {
      fetchProduct();
    }
  }, [companyId, productId]);

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="product-details-container">
        <div className="product-image-gallery">
          {/* Thumbnail gallery can be added here */}
          <img src={product.thumbNailUrl} alt={product.id} className="product-main-image" />
        </div>
        <div className="product-info">
          <h1>{product.id}</h1>
          <p>{product.description}</p>
          <p><strong>Count:</strong> {product.count}</p>
          <a href={product.manualUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Manual</a>
          <hr />
          <h3>Specifications</h3>
          <ul className="list-group">
            {product.specifications ? (
              Object.entries(product.specifications).map(([key, value]) => (
                <li key={key} className="list-group-item">
                  <strong>{key}:</strong> {value}
                </li>
              ))
            ) : (
              <p>No specifications found.</p>
            )}
          </ul>
        </div>
      </div>
      <SparePartsList companyId={companyId} productId={productId} />
    </div>
  );
};

export default ProductDetails;