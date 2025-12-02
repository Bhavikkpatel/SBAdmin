import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import SparePartsList from './SparePartsList';
import './ProductDetails.css';

const PRODUCTS_COLLECTION = 'products_staging';

const ProductDetails = ({ companyId, productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  // State to track which image is currently big
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, PRODUCTS_COLLECTION, productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct(data);
          // Set initial main image
          setActiveImage(data.thumbNailUrl || '');
          
          // --- PRELOAD LOGIC ---
          // This forces the browser to fetch and cache these images immediately
          if (data.otherImageUrls) {
            data.otherImageUrls.forEach((url) => {
              const img = new Image();
              img.src = url;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found.</div>;

  // Combine main thumbnail and other images for the gallery strip
  const allImages = [product.thumbNailUrl, ...(product.otherImageUrls || [])].filter(Boolean);

  return (
    <div>
      <div className="product-details-container">
        <div className="product-image-gallery">
           {/* Main Large Image */}
          <div className="main-image-wrapper">
             <img 
               src={activeImage || 'https://placehold.co/400'} 
               alt={product.modelId} 
               className="product-main-image" 
             />
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="thumbnail-strip">
              {allImages.map((url, index) => (
                <img 
                  key={index}
                  src={url}
                  alt={`Thumbnail ${index}`}
                  className={`thumbnail-item ${activeImage === url ? 'active' : ''}`}
                  onClick={() => setActiveImage(url)} // Swap image on click
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <h1>{product.modelId}</h1>
          {/* ... rest of your info ... */}
          <p>{product.description}</p>
          <p><strong>Category:</strong> {product.category}</p>
          
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