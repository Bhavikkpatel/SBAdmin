import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './SparePartDetails.css';

const SparePartDetails = ({ companyId, productId, sparePartId }) => {
  const [sparePart, setSparePart] = useState(null);

  useEffect(() => {
    const fetchSparePart = async () => {
      const docRef = doc(db, 'companies', companyId, 'products', productId, 'spareParts', sparePartId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSparePart(docSnap.data());
      }
    };
    if (companyId && productId && sparePartId) {
      fetchSparePart();
    }
  }, [companyId, productId, sparePartId]);

  if (!sparePart) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="spare-part-details-container">
        <div className="spare-part-image-gallery">
          <img src={sparePart.thumbNailUrl} alt={sparePart.modelId} className="spare-part-main-image" />
        </div>
        <div className="spare-part-info">
          <h1>{sparePart.modelId}</h1>
          <p>{sparePart.description}</p>
          <p><strong>Category:</strong> {sparePart.category}</p>
          <a href={sparePart.manualUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Manual</a>
          <hr />
        </div>
      </div>
    </div>
  );
};

export default SparePartDetails;