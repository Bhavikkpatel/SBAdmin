import React from 'react';
import { useParams } from 'react-router-dom';
import ProductDetails from '../components/ProductDetails';
import SparePartsList from '../components/SparePartsList';
import Breadcrumb from '../components/Breadcrumb';

const Product = () => {
  const { companyId, productId } = useParams();

  return (
    <div className="container mt-4">
      <Breadcrumb />
      <ProductDetails companyId={companyId} productId={productId} />
    </div>
  );
};

export default Product;