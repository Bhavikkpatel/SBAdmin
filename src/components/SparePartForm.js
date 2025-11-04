import React, { useState } from 'react';
import { collection, setDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import './SparePartForm.css';
import './Form.css';

const SparePartForm = ({ sparePart, companyId, productId, setShowForm }) => {
  const [sparePartData, setSparePartData] = useState(() => {
    const initialData = {
      description: '',
      id: '',
      ...sparePart,
    };

    return initialData;
  });
  const [manual, setManual] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSparePartData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };


  const handleDelete = async () => {
    if (sparePart) {
      await updateDoc(doc(db, 'companies', companyId, 'products', productId, 'spareParts', sparePart.id), {
        isDeleted: true,
      });
      setShowForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let manualUrl = sparePart ? sparePart.manualUrl : '';
    let thumbNailUrl = sparePart ? sparePart.thumbNailUrl : '';

    try {
      if (manual) {
        const storageRef = ref(storage, `manuals/${manual.name}`);
        await uploadBytes(storageRef, manual);
        manualUrl = await getDownloadURL(storageRef);
      }

      if (thumbnail) {
        const storageRef = ref(storage, `thumbnails/${thumbnail.name}`);
        await uploadBytes(storageRef, thumbnail);
        thumbNailUrl = await getDownloadURL(storageRef);
      }

    const finalSparePartData = {
      ...sparePartData,
      manualUrl,
      thumbNailUrl,
      isDeleted: false,
    };

    if (sparePart) {
      await updateDoc(doc(db, 'companies', companyId, 'products', productId, 'spareParts', sparePart.id), finalSparePartData);
    } else {
      if (sparePartData.id) {
        await setDoc(doc(db, 'companies', companyId, 'products', productId, 'spareParts', sparePartData.id), finalSparePartData);
      } else {
        alert("Spare Part ID is required.");
        return;
      }
    }
    } catch (error) {
      console.error("Error uploading file: ", error);
      alert("File upload failed. Please try again.");
    } finally {
      setLoading(false);
      setShowForm(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <fieldset disabled={loading}>
        <h2 className="form-title">{sparePart ? 'Edit Spare Part' : 'Add Spare Part'}</h2>
        <div className="form-group">
          <label htmlFor="sparePartId">ID</label>
          <input id="sparePartId" name="id" value={sparePartData.id} onChange={handleChange} placeholder="Enter spare part ID" className="form-control" />
        </div>
        <div className="form-group">
          <label htmlFor="sparePartDescription">Description</label>
          <textarea id="sparePartDescription" name="description" value={sparePartData.description} onChange={handleChange} placeholder="Enter spare part description" className="form-control" />
        </div>


        <h5 className="mt-4">Files</h5>
        <div className="form-row">
          <div className="form-group">
            <label>Manual PDF</label>
            <input type="file" onChange={(e) => setManual(e.target.files[0])} className="form-control-file" accept="application/pdf,.pdf" />
          </div>
          <div className="form-group">
            <label>Thumbnail Image</label>
            <input type="file" onChange={(e) => setThumbnail(e.target.files[0])} className="form-control-file" accept="image/*" />
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-4">
          {loading ? 'Loading...' : (sparePart ? 'Save Spare Part' : 'Add Spare Part')}
        </button>
        {sparePart && (
          <button type="button" className="btn btn-danger mt-4" onClick={handleDelete}>
            Delete
          </button>
        )}
      </fieldset>
    </form>
  );
};

export default SparePartForm;