import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import ProductForm from './ProductForm';
import SparePartForm from './SparePartForm';
import Modal from './Modal';
import SparePartsList from './SparePartsList';
import Dropdown from './dropdown';
import { useData } from '../context/DataContext';
import '../styles/TableTheme.css';

const TARGET_COLLECTION = 'products_staging';

export const COL_WIDTHS = {
  toggle: '50px',
  image: '80px',
  model: '25%',
  category: '15%',
  desc: 'auto',
  actions: '80px' // Further reduced as it only holds the dropdown dots now
};

const ProductsList = ({ companyId }) => {
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [showAddPartForm, setShowAddPartForm] = useState(false);
  const [productForNewPart, setProductForNewPart] = useState(null);

  const { getProducts, refreshProducts } = useData();

  useEffect(() => {
    if (!companyId) return;
    let isMounted = true;
    setLoading(true);
    getProducts(companyId).then(data => {
      if (isMounted) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [companyId, getProducts]);

  const toggleRow = (productId) => {
      setExpandedProductId(prevId => prevId === productId ? null : productId);
  };

  const handleAddSparePart = (product) => {
      setProductForNewPart(product);
      setShowAddPartForm(true);
      setExpandedProductId(product.docId);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete product "${product.modelId}"?`)) {
        try {
            await updateDoc(doc(db, TARGET_COLLECTION, product.docId), { 
                isDeleted: true, 
                updatedAt: serverTimestamp() 
            });
            const updatedData = await refreshProducts(companyId);
            setProducts(updatedData);
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product.");
        }
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Products</h2>
        <button className="btn-add-primary" onClick={() => { setShowProductForm(true); setSelectedProduct(null); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Product
        </button>
      </div>

      {loading ? <p>Loading products...</p> : products.length === 0 ? (
        <div className="no-data">No products found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{width: COL_WIDTHS.toggle}}></th>
                <th style={{width: COL_WIDTHS.image}}>Image</th>
                <th style={{width: COL_WIDTHS.model}}>Model ID</th>
                <th style={{width: COL_WIDTHS.category}}>Category</th>
                <th>Description</th>
                <th style={{width: COL_WIDTHS.actions, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const isExpanded = expandedProductId === product.docId;
                return (
                  <React.Fragment key={product.docId}>
                    <tr 
                        className={isExpanded ? "row-expanded" : ""} 
                        onClick={() => toggleRow(product.docId)}
                        style={{ cursor: 'pointer' }}
                    >
                      <td className="toggle-cell td-toggle" style={{width: COL_WIDTHS.toggle}}>
                          <svg className="toggle-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </td>
                      <td className="td-image" style={{width: COL_WIDTHS.image}}>
                        <img src={product.thumbNailUrl || 'https://placehold.co/48'} alt="" className="table-thumbnail" />
                      </td>
                      <td className="td-model" style={{width: COL_WIDTHS.model}}>
                          {/* CHANGED: Model ID is now a link, stopPropagation prevents row toggle when clicked */}
                          <Link 
                            to={`/company/${companyId}/product/${product.docId}`} 
                            className="data-link"
                            onClick={(e) => e.stopPropagation()}
                           >
                              {product.modelId}
                          </Link>
                      </td>
                      <td className="td-category" style={{width: COL_WIDTHS.category}}><span className="text-muted">{product.category}</span></td>
                      <td className="text-muted td-desc" style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {product.description}
                      </td>
                      <td className="td-actions" style={{width: COL_WIDTHS.actions}}>
                        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          {/* View Button REMOVED from here, now handled by data-link on Model ID */}
                          {/* Edit Button (icon) REMOVED from here, moved to dropdown */}
                          
                          <Dropdown alignRight={true}>
                             {/* Optional: Keep 'View Details' in dropdown for clarity on desktop if desired, 
                                 but usually the link on Model ID is enough. keeping it for completeness. */}
                             <Link to={`/company/${companyId}/product/${product.docId}`} className="dropdown-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                View Details
                             </Link>
                             <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); setShowProductForm(true); setSelectedProduct(product); }}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                               Edit Product
                             </button>
                             <button className="dropdown-item" onClick={() => handleAddSparePart(product)}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                               Add Spare Part
                             </button>
                             <button className="dropdown-item danger" onClick={() => handleDeleteProduct(product)}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                               Delete Product
                             </button>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                        <tr className="expanded-row">
                            <td colSpan="6" className="expanded-row-content">
                                <SparePartsList companyId={companyId} productId={product.docId} />
                            </td>
                        </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showProductForm} onClose={() => setShowProductForm(false)}>
        <ProductForm product={selectedProduct} companyId={companyId} setShowForm={setShowProductForm} />
      </Modal>

      <Modal isOpen={showAddPartForm} onClose={() => setShowAddPartForm(false)}>
        <SparePartForm companyId={companyId} productId={productForNewPart?.docId} setShowForm={setShowAddPartForm} />
      </Modal>
    </div>
  );
};

export default ProductsList;