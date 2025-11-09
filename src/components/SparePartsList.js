import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import SparePartForm from './SparePartForm';
import Modal from './Modal';
import SparePartDetails from './SparePartDetails';
import Dropdown from './dropdown';
import { useData } from '../context/DataContext';
import '../styles/TableTheme.css';
import { COL_WIDTHS } from './ProductsList';

const TARGET_COLLECTION = 'spareParts_staging';

const SparePartsList = ({ companyId, productId }) => {
  const [spareParts, setSpareParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSparePart, setSelectedSparePart] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  const { getSpareParts, refreshSpareParts } = useData();

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setLoading(true);
    getSpareParts(productId).then(data => {
       if (isMounted) {
         setSpareParts(data);
         setLoading(false);
       }
    });
    return () => { isMounted = false; };
  }, [productId, getSpareParts]);

  const handleDeleteSparePart = async (part) => {
    if (window.confirm(`Are you sure you want to delete spare part "${part.modelId}"?`)) {
        try {
            await updateDoc(doc(db, TARGET_COLLECTION, part.docId), { 
                isDeleted: true, 
                updatedAt: serverTimestamp() 
            });
            const updatedData = await refreshSpareParts(productId);
            setSpareParts(updatedData);
        } catch (error) {
             console.error("Error deleting spare part:", error);
             alert("Failed to delete spare part.");
        }
    }
  };

  if (loading) return <div className="text-muted" style={{padding: '1rem'}}>Loading parts...</div>;

  return (
    <div style={{ width: '100%' }}>
      {spareParts.length === 0 ? (
        <div className="text-muted" style={{ fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
            No spare parts added yet. Use the "Add Spare Part" option in the parent product menu.
        </div>
      ) : (
        <div style={{ background: 'transparent' }}>
          <table className="modern-table">
            <tbody>
              {spareParts.map(part => (
                <tr key={part.docId} style={{ background: 'transparent' }}>
                  <td className="td-toggle" style={{width: COL_WIDTHS.toggle, borderBottom: '1px dashed #e0e0e0'}}></td>
                  <td className="td-image" style={{width: COL_WIDTHS.image, borderBottom: '1px dashed #e0e0e0'}}>
                    <img src={part.thumbNailUrl || 'https://placehold.co/48'} alt="" className="table-thumbnail" />
                  </td>
                  <td className="fw-medium td-model" style={{width: COL_WIDTHS.model, borderBottom: '1px dashed #e0e0e0'}}>
                      {/* CHANGED: Model ID is now a clickable button-link to open modal */}
                      <button 
                          className="data-link-button" 
                          onClick={() => { setShowDetails(true); setSelectedSparePart(part); }}
                      >
                          {part.modelId}
                      </button>
                      <span className="spare-part-tag">Spare Part</span>
                  </td>
                  <td className="td-category" style={{width: COL_WIDTHS.category, borderBottom: '1px dashed #e0e0e0'}}>
                      <span className="text-muted">{part.category}</span>
                  </td>
                   <td className="text-muted td-desc" style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '1px dashed #e0e0e0'}}>
                    {part.description}
                  </td>
                  <td className="td-actions" style={{width: COL_WIDTHS.actions, borderBottom: '1px dashed #e0e0e0'}}>
                    <div className="actions-cell">
                       {/* Removed direct View/Edit buttons */}
                       
                       <Dropdown alignRight={true}>
                            {/* View included in dropdown for completeness */}
                            <button className="dropdown-item" onClick={() => { setShowDetails(true); setSelectedSparePart(part); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                View Details
                            </button>
                            <button className="dropdown-item" onClick={() => { setShowForm(true); setSelectedSparePart(part); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                Edit Spare Part
                            </button>
                            <button className="dropdown-item danger" onClick={() => handleDeleteSparePart(part)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                Delete Spare Part
                            </button>
                        </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <SparePartForm
          sparePart={selectedSparePart}
          companyId={companyId}
          productId={productId}
          setShowForm={setShowForm}
        />
      </Modal>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)}>
        <SparePartDetails sparePartId={selectedSparePart?.docId} />
      </Modal>
    </div>
  );
};

export default SparePartsList;