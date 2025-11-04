import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import SparePartForm from './SparePartForm';
import Modal from './Modal';
import SparePartDetails from './SparePartDetails';
import './SparePartsList.css';

const SparePartsList = ({ companyId, productId }) => {
  const [spareParts, setSpareParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSparePart, setSelectedSparePart] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!companyId || !productId) return;

    const sparePartsCollection = collection(db, 'companies', companyId, 'products', productId, 'spareParts');
    const q = query(sparePartsCollection, where("isDeleted", "!=", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSpareParts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });

    return () => unsubscribe();
  }, [companyId, productId]);


  return (
    <div className="list-container">
      <div className="header">
        <h2>Spare Parts</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setSelectedSparePart(null); }}>Add Spare Part</button>
      </div>

      <div className="spare-parts-grid">
        {spareParts.map(sparePart => (
          <div key={sparePart.id} className="spare-part-card">
            <img src={sparePart.thumbNailUrl} alt={sparePart.id} className="spare-part-card-image" />
            <div className="spare-part-card-body">
              <h3 className="spare-part-card-title">{sparePart.id}</h3>
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
          companyId={companyId}
          productId={productId}
          sparePartId={selectedSparePart?.id}
        />
      </Modal>
    </div>
  );
};

export default SparePartsList;