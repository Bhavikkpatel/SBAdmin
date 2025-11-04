import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import './Form.css';

const CompanyForm = ({ company, setShowForm }) => {
  const [companyName, setCompanyName] = useState(company ? company.displayName : '');
  const [logo, setLogo] = useState(null);

  const handleDelete = async () => {
    if (company) {
      await updateDoc(doc(db, 'companies', company.id), {
        isDeleted: true,
      });
      setShowForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let logoUrl = company ? company.logoUrl : '';

    if (logo) {
      const storageRef = ref(storage, `logos/${companyName}/${logo.name}`);
      await uploadBytes(storageRef, logo);
      logoUrl = await getDownloadURL(storageRef);
    }

    const companyData = {
      displayName: companyName,
      logoUrl: logoUrl,
      isDeleted: false,
    };

    if (company) {
      await updateDoc(doc(db, 'companies', company.id), companyData);
    } else {
      await addDoc(collection(db, 'companies'), companyData);
    }
    setShowForm(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">{company ? 'Edit Company' : 'Add Company'}</h2>
      <div className="form-group">
        <label htmlFor="companyName">Company Name</label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name"
          className="form-control"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="logo">Logo</label>
        <input
          id="logo"
          type="file"
          onChange={(e) => setLogo(e.target.files)}
          className="form-control-file"
        />
      </div>
      <div className="form-row">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
        {company && (
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
};

export default CompanyForm;