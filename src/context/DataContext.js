// src/context/DataContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  // Cache structures: { [parentId]: [arrayOfItems] }
  const [productsCache, setProductsCache] = useState({});
  const [sparePartsCache, setSparePartsCache] = useState({});

  // Helper to actually perform the fetch
  const fetchFromFirestore = async (collectionName, parentField, parentId) => {
    const q = query(
      collection(db, collectionName),
      where(parentField, "==", parentId),
      where("isDeleted", "!=", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
  };

  // --- PRODUCTS ---
  const getProducts = useCallback(async (companyId, forceRefresh = false) => {
    // If we have it in cache and aren't forcing a refresh, return cached data
    if (!forceRefresh && productsCache[companyId]) {
      return productsCache[companyId];
    }

    // Otherwise, fetch from Firestore
    const products = await fetchFromFirestore('products_staging', 'companyId', companyId);
    
    // Update cache
    setProductsCache(prev => ({ ...prev, [companyId]: products }));
    return products;
  }, [productsCache]);

  // --- SPARE PARTS ---
  const getSpareParts = useCallback(async (productId, forceRefresh = false) => {
    if (!forceRefresh && sparePartsCache[productId]) {
      return sparePartsCache[productId];
    }

    const parts = await fetchFromFirestore('spareParts_staging', 'productId', productId);
    
    setSparePartsCache(prev => ({ ...prev, [productId]: parts }));
    return parts;
  }, [sparePartsCache]);

  // Value to be exposed to components
  const value = {
    getProducts,
    getSpareParts,
    // Helpers to force update after a form save
    refreshProducts: (companyId) => getProducts(companyId, true),
    refreshSpareParts: (productId) => getSpareParts(productId, true)
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};