import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import SparePartForm from './SparePartForm';
import Modal from './Modal';
import SparePartDetails from './SparePartDetails';
import './SparePartsList.css';

// CHANGED: Define the new target root collection
const TARGET_COLLECTION = 'spareParts_staging';

const SparePartsList = ({ companyId, productId }) => {
  const [spareParts, setSpareParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSparePart, setSelectedSparePart] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Only need productId to filter, but good to have both check
    if (!companyId || !productId) return;

    // CHANGED: Query from root collection instead of nested path
    const q = query(
      collection(db, TARGET_COLLECTION),
      where("productId", "==", productId), // Filter by product ID
      where("isDeleted", "!=", true)       // Filter out deleted items
    );
    console.log(q);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSpareParts(snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id })));
    });

    return () => unsubscribe();
  }, [companyId, productId]); // Re-run if product changes

  return (
    <div className="list-container">
      <div className="header">
        <h2>Spare Parts</h2>
        {/* <small style={{ color: 'gray', marginLeft: '10px' }}>Source: {TARGET_COLLECTION}</small> */}
        <button className="btn btn-add-outlined" onClick={() => { setShowForm(true); setSelectedSparePart(null); }}>Add Spare Part</button>
      </div>

      <div className="spare-parts-grid">
        {spareParts.map(sparePart => (
          <div key={sparePart.docId} className="spare-part-card">
            {/* <img src={sparePart.thumbNailUrl || 'placeholder-image-url.jpg'} alt={sparePart.modelId} className="spare-part-card-image" /> */}
            <div className="spare-part-card-body">
              <h3 className="spare-part-card-title">{sparePart.modelId}</h3>
              <p className="spare-part-card-text">{sparePart.description}</p>
              <div className="spare-part-card-actions">
                <button className="btn btn-edit" onClick={() => { setShowForm(true); setSelectedSparePart(sparePart); }}>Edit</button>
                <button className="btn btn-view" onClick={() => { setShowDetails(true); setSelectedSparePart(sparePart); }}>View</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <SparePartForm
          sparePart={selectedSparePart}
          companyId={companyId}
          productId={productId}
          setShowForm={setShowForm}
        />
      </Modal>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)}>
        <SparePartDetails
          // CHANGED: You might only need the ID now, depending on how SparePartDetails is implemented.
          // If it still needs full path, you'll need to update it too.
          // For now, passing just the ID might be enough if updated to read from root.
          sparePartId={selectedSparePart?.docId}
          // Optional: pass these if SparePartDetails still needs them for some reason
          // companyId={companyId}
          // productId={productId}
        />
      </Modal>
    </div>
  );
};

export default SparePartsList;