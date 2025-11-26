import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import './SparePartForm.css';
import './Form.css';

const TARGET_COLLECTION = 'spareParts_staging';

const SparePartForm = ({ sparePart, companyId, productId, setShowForm }) => {
  const [sparePartData, setSparePartData] = useState(() => {
    const initialData = {
      description: '',
      modelId: '',
      category: '',
      videoUrl: '', // NEW FIELD
      ...sparePart,
    };
    return initialData;
  });
  const [manual, setManual] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Simple error state for spare parts for now

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSparePartData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    setError(null);
  };

  const handleDelete = async () => {
    if (sparePart && sparePart.docId) {
      try {
        setLoading(true);
        await updateDoc(doc(db, TARGET_COLLECTION, sparePart.docId), {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        });
        setShowForm(false);
      } catch (error) {
        console.error("Error deleting document: ", error);
        setError("Delete failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate Video URL
    if (sparePartData.videoUrl && sparePartData.videoUrl.trim() !== "") {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!youtubeRegex.test(sparePartData.videoUrl)) {
            setError("Please enter a valid YouTube URL.");
            setLoading(false);
            return;
        }
    }

    const trimmedData = {};
    for (const key in sparePartData) {
        if (typeof sparePartData[key] === 'string') {
            trimmedData[key] = sparePartData[key].trim();
        } else {
            trimmedData[key] = sparePartData[key];
        }
    }

    let manualUrl = sparePart ? sparePart.manualUrl : '';
    let thumbNailUrl = sparePart ? sparePart.thumbNailUrl : '';

    try {
      if (manual) {
        const storageRef = ref(storage, `manuals/${Date.now()}_${manual.name}`);
        await uploadBytes(storageRef, manual);
        manualUrl = await getDownloadURL(storageRef);
      }

      if (thumbnail) {
        const storageRef = ref(storage, `thumbnails/${Date.now()}_${thumbnail.name}`);
        await uploadBytes(storageRef, thumbnail);
        thumbNailUrl = await getDownloadURL(storageRef);
      }

      const finalSparePartData = {
        ...trimmedData,
        manualUrl,
        thumbNailUrl,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      };

      if (sparePart && sparePart.docId) {
        await updateDoc(doc(db, TARGET_COLLECTION, sparePart.docId), finalSparePartData);
      } else {
        await addDoc(collection(db, TARGET_COLLECTION), {
          ...finalSparePartData,
          companyId,
          productId,
          createdAt: serverTimestamp(),
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error saving spare part: ", error);
      setError("Failed to save spare part. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <fieldset disabled={loading}>
        <h2 className="form-title">{sparePart ? 'Edit Spare Part' : 'Add Spare Part'}</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-group">
          <label htmlFor="modelId">Model ID</label>
          <input id="modelId" name="modelId" value={sparePartData.modelId} onChange={handleChange} placeholder="Enter spare part model ID" className="form-control" required />
        </div>
        <div className="form-group">
          <label htmlFor="sparePartDescription">Description</label>
          <textarea id="sparePartDescription" name="description" value={sparePartData.description} onChange={handleChange} placeholder="Enter spare part description" className="form-control" required />
        </div>
        <div className="form-group">
          <label htmlFor="sparePartCategory">Category</label>
          <input id="sparePartCategory" name="category" value={sparePartData.category} onChange={handleChange} placeholder="Enter spare part category" className="form-control" required />
        </div>

        {/* --- NEW VIDEO URL FIELD --- */}
        <div className="form-group">
          <label htmlFor="videoUrl">YouTube Video URL</label>
          <input
            id="videoUrl"
            name="videoUrl"
            value={sparePartData.videoUrl}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="form-control"
          />
        </div>

        <h5 className="mt-4">Files</h5>
        <div className="form-row">
          <div className="form-group">
            <label>Manual PDF</label>
            <input type="file" onChange={(e) => setManual(e.target.files[0])} className="form-control-file" accept="application/pdf" />
             {sparePartData.manualUrl && !manual && <small><a href={sparePartData.manualUrl} target="_blank" rel="noopener noreferrer">Current Manual</a></small>}
          </div>
          <div className="form-group">
            <label>Thumbnail Image</label>
            <input type="file" onChange={(e) => setThumbnail(e.target.files[0])} className="form-control-file" accept="image/*" />
            {sparePartData.thumbNailUrl && !thumbnail && <img src={sparePartData.thumbNailUrl} alt="Current Thumbnail" style={{ height: '50px', marginTop: '5px' }} />}
          </div>
        </div>

        <div className="button-group mt-4">
             <button type="submit" className="btn btn-primary">
               {loading ? 'Saving...' : (sparePart ? 'Save Changes' : 'Add Spare Part')}
             </button>
             {sparePart && (
               <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                 Delete
               </button>
             )}
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={loading}>
                 Cancel
               </button>
        </div>
      </fieldset>
    </form>
  );
};

export default SparePartForm;