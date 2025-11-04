import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const CompanyDetails = ({ companyId }) => {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const docRef = doc(db, 'companies', companyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCompany(docSnap.data());
      }
    };
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  if (!company) {
    return <div>Loading...</div>;
  }

  return null;
};

export default CompanyDetails;