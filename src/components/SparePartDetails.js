import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './SparePartDetails.css';

// Define the target collection
const TARGET_COLLECTION = 'spareParts_staging';

const SparePartDetails = ({ sparePartId }) => {
  const [sparePart, setSparePart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSparePart = async () => {
      try {
        setLoading(true);
        // CHANGED: Fetch directly from root collection using ID
        const docRef = doc(db, TARGET_COLLECTION, sparePartId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSparePart(docSnap.data());
        } else {
          setError("Spare part not found.");
        }
      } catch (err) {
        console.error("Error fetching spare part:", err);
        setError("Failed to load spare part details.");
      } finally {
        setLoading(false);
      }
    };

    if (sparePartId) {
      fetchSparePart();
    }
  }, [sparePartId]);

  if (loading) return <div>Loading details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!sparePart) return <div>Spare part not found.</div>;

  return (
    <div>
      <div className="spare-part-details-container">
        <div className="spare-part-image-gallery">
           {/* Added fallback for missing image */}
          <img src={sparePart.thumbNailUrl || 'placeholder.jpg'} alt={sparePart.modelId} className="spare-part-main-image" />
        </div>
        <div className="spare-part-info">
          <h1>{sparePart.modelId}</h1>
          <p>{sparePart.description}</p>
          <p><strong>Category:</strong> {sparePart.category}</p>
          {sparePart.manualUrl ? (
              <a href={sparePart.manualUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Manual</a>
          ) : (
              <p className="text-muted">No manual available.</p>
          )}
          <hr />
        </div>
      </div>
    </div>
  );
};

export default SparePartDetails;