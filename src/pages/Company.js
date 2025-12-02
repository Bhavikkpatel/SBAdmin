import React from 'react';
import { useParams } from 'react-router-dom';
import CompanyDetails from '../components/CompanyDetails';
import ProductsList from '../components/ProductsList';
import SparePartsList from '../components/SparePartsList'; // Changed: Imported SparePartsList
import Breadcrumb from '../components/Breadcrumb';

const Company = () => {
  const { id } = useParams();

  return (
    <div className="container-fluid p-0 p-md-4">
      <Breadcrumb />
      <CompanyDetails companyId={id} />
      
      {/* Existing Products List */}
      <ProductsList companyId={id} />

      {/* Changed: Added SparePartsList to display direct parts */}
      <SparePartsList companyId={id} />
    </div>
  );
};

export default Company;