import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import CompanyForm from './CompanyForm';
import Modal from './Modal';
import './CompaniesList.css';

const CompaniesList = () => {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'companies'), where("isDeleted", "!=", true));
    const unsub = onSnapshot(q, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching companies: ", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);


  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Companies</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setSelectedCompany(null); }}>Add Company</button>
      </div>

      {loading && <p>Loading companies...</p>}

      <div className="companies-grid">
        {companies.map(company => (
          <div key={company.id} className="company-card">
            <img src={company.logoUrl} className="company-logo" alt={company.displayName} />
            <div className="company-card-body">
              <h5 className="company-card-title">{company.displayName}</h5>
              <div className="company-card-actions">
                <button className="btn btn-secondary" onClick={() => { setShowForm(true); setSelectedCompany(company); }}>Edit</button>
                <Link to={`/company/${company.id}`} className="btn btn-info">View Products</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && !loading && <p>No companies found. Click "Add Company" to get started.</p>}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <CompanyForm company={selectedCompany} setShowForm={setShowForm} />
      </Modal>
    </div>
  );
};

export default CompaniesList;