import React, { createContext, useState, useContext, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // Cache structures: { [parentId]: [arrayOfItems] }
  const [productsCache, setProductsCache] = useState({});
  const [sparePartsCache, setSparePartsCache] = useState({});
  const [companyPartsCache, setCompanyPartsCache] = useState({});

  // --- FIX IS HERE ---
  // We must use 'parentField' and 'parentId' (the arguments), NOT 'companyId'.
  const fetchFromFirestore = async (collectionName, parentField, parentId) => {
    const q = query(
      collection(db, collectionName),
      where(parentField, "==", parentId), // <--- Corrected variable
      where("isDeleted", "!=", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
  };

  // --- PRODUCTS ---
  const getProducts = useCallback(async (companyId, forceRefresh = false) => {
    if (!forceRefresh && productsCache[companyId]) {
      return productsCache[companyId];
    }
    // This calls fetchFromFirestore('products_staging', 'companyId', companyId)
    const products = await fetchFromFirestore('products_staging', 'companyId', companyId);
    
    setProductsCache(prev => ({ ...prev, [companyId]: products }));
    return products;
  }, [productsCache]);

  // --- SPARE PARTS (By Product) ---
  const getSpareParts = useCallback(async (productId, forceRefresh = false) => {
    if (!forceRefresh && sparePartsCache[productId]) {
      return sparePartsCache[productId];
    }
    // This calls fetchFromFirestore('spareParts_staging', 'productId', productId)
    const parts = await fetchFromFirestore('spareParts_staging', 'productId', productId);
    
    setSparePartsCache(prev => ({ ...prev, [productId]: parts }));
    return parts;
  }, [sparePartsCache]);

  // --- SPARE PARTS (By Company - NEW) ---
  const getSparePartsByCompany = useCallback(async (companyId, forceRefresh = false) => {
    if (!forceRefresh && companyPartsCache[companyId]) {
      return companyPartsCache[companyId];
    }
    // This calls fetchFromFirestore('spareParts_staging', 'companyId', companyId)
    const parts = await fetchFromFirestore('spareParts_staging', 'companyId', companyId);
    
    setCompanyPartsCache(prev => ({ ...prev, [companyId]: parts }));
    return parts;
  }, [companyPartsCache]);

  const value = {
    getProducts,
    getSpareParts,
    getSparePartsByCompany,
    refreshProducts: (companyId) => getProducts(companyId, true),
    refreshSpareParts: (productId) => getSpareParts(productId, true),
    refreshCompanyParts: (companyId) => getSparePartsByCompany(companyId, true)
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};