import React from 'react';
import { useParams } from 'react-router-dom';
import CompanyDetails from '../components/CompanyDetails';
import ProductsList from '../components/ProductsList';
import Breadcrumb from '../components/Breadcrumb';

const Company = () => {
  const { id } = useParams();

  return (
    <div className="container mt-4">
      <Breadcrumb />
      <CompanyDetails companyId={id} />
      <ProductsList companyId={id} />
    </div>
  );
};

export default Company;