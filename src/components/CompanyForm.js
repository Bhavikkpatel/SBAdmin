import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import './Form.css';

const CompanyForm = ({ company, setShowForm }) => {
  const [companyData, setCompanyData] = useState({
    displayName: company?.displayName || '', 
    description: company?.description || '',
    logoUrl: company?.logoUrl || ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoFile(e.target.files[0]);
    }
  };

  const validate = () => {
    const newErrors = {};
    const nameValue = companyData.displayName || ''; 
    if (!nameValue.trim()) newErrors.displayName = "Company Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDelete = async () => {
    if (company && company.id) {
      if (!window.confirm(`Are you sure you want to delete "${company.displayName}"?`)) return;

      try {
        setLoading(true);
        await updateDoc(doc(db, 'companies', company.id), {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        });
        setShowForm(false);
      } catch (error) {
        console.error("Error deleting company: ", error);
        setErrors({ form: "Delete failed. Please try again." });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      let finalLogoUrl = companyData.logoUrl || ""; 

      if (logoFile) {
        const metadata = { cacheControl: 'public,max-age=31536000', contentType: logoFile.type };
        const originalName = logoFile.name || "logo.jpg";
        const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, "_");
        const storagePath = `companyLogos/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, logoFile, metadata);
        finalLogoUrl = await getDownloadURL(storageRef);
      }

      const finalData = {
        displayName: (companyData.displayName || '').trim(),
        description: (companyData.description || '').trim(),
        logoUrl: finalLogoUrl,
        updatedAt: serverTimestamp(),
      };

      if (company && company.id) {
        await updateDoc(doc(db, 'companies', company.id), finalData);
      } else {
        // --- FIX HERE: Initialize isDeleted to false ---
        await addDoc(collection(db, 'companies'), {
          ...finalData,
          isDeleted: false, 
          createdAt: serverTimestamp()
        });
      }
      
      setShowForm(false);
    } catch (error) {
      console.error("Error saving company:", error);
      setErrors({ form: "Failed to save company. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <fieldset disabled={loading}>
        <h2 className="form-title">{company ? "Edit Company" : "Add Company"}</h2>
        
        {errors.form && <div className="alert alert-danger">{errors.form}</div>}

        <div className="form-group">
          <label htmlFor="displayName">Company Name</label>
          <input 
            id="displayName" 
            name="displayName"
            value={companyData.displayName} 
            onChange={handleChange} 
            placeholder="Enter company name"
            className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
          />
          {errors.displayName && <div className="invalid-feedback">{errors.displayName}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea 
            id="description" 
            name="description" 
            value={companyData.description} 
            onChange={handleChange}
            placeholder="Enter company description" 
            className="form-control"
          />
        </div>

        <h5 className="mt-4">Logo</h5>
        <div className="form-group">
          <label>Company Logo</label>
          <input 
            type="file" 
            onChange={handleFileChange} 
            className="form-control-file" 
            accept="image/*" 
          />
          {companyData.logoUrl && !logoFile && (
             <img src={companyData.logoUrl} alt="Current Logo" style={{ height: "60px", width: "auto", objectFit: "contain", marginTop: "10px" }} />
          )}
          {logoFile && <div style={{fontSize: '0.8rem', color: 'green', marginTop: '5px'}}>Selected: {logoFile.name}</div>}
        </div>

        <div className="button-group mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : (company ? "Save Changes" : "Add Company")}
          </button>
          
          {company && (
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

export default CompanyForm;