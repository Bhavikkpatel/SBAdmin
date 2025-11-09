import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SparePartsList from './SparePartsList';
import './ProductDetails.css';

// CHANGED: Define target collection for products
const PRODUCTS_COLLECTION = 'products_staging';

const ProductDetails = ({ companyId, productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // CHANGED: Fetch from root collection using just productId
        const docRef = doc(db, PRODUCTS_COLLECTION, productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct(docSnap.data());
        } else {
            console.log("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]); // Removed companyId dependency as it's not needed for root lookup

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found.</div>;

  return (
    <div>
      <div className="product-details-container">
        <div className="product-image-gallery">
           {/* Added fallback for missing images */}
          <img src={product.thumbNailUrl || 'placeholder.jpg'} alt={product.modelId} className="product-main-image" />
        </div>
        <div className="product-info">
          <h1>{product.modelId}</h1>
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
      <SparePartsList companyId={companyId} productId={productId} />
    </div>
  );
};

export default ProductDetails;