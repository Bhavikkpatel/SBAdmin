import React from 'react';
import { useParams } from 'react-router-dom';
import CompanyDetails from '../components/CompanyDetails';
import ProductsList from '../components/ProductsList';
import Breadcrumb from '../components/Breadcrumb';

const Company = () => {
  const { id } = useParams();

  return (
    // CHANGED: p-0 for mobile, p-md-4 for medium screens and up
    <div className="container-fluid p-0 p-md-4">
      <Breadcrumb />
      <CompanyDetails companyId={id} />
      <ProductsList companyId={id} />
    </div>
  );
};

export default Company;