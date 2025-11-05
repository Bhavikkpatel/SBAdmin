import React, { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import './Form.css';

const ProductForm = ({ product, companyId, setShowForm }) => {
  const [initialProductData] = useState(product || {
    description: '',
    modelId: '',
    specifications: [],
    category: '',
  });
  const [productData, setProductData] = useState(() => {
    const data = { ...initialProductData };
    if (data.specifications && typeof data.specifications === 'object' && !Array.isArray(data.specifications)) {
      data.specifications = Object.entries(data.specifications).map(([key, value]) => ({ key, value }));
    } else if (!data.specifications) {
      data.specifications = [];
    }
    return data;
  });
  const [manual, setManual] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecifications = [...productData.specifications];
    newSpecifications[index][field] = value;
    setProductData(prevData => ({
      ...prevData,
      specifications: newSpecifications,
    }));
  };

  const addSpecification = () => {
    setProductData(prevData => ({
      ...prevData,
      specifications: [...prevData.specifications, { key: '', value: '' }],
    }));
  };

  const removeSpecification = (index) => {
    const newSpecifications = [...productData.specifications];
    newSpecifications.splice(index, 1);
    setProductData(prevData => ({
      ...prevData,
      specifications: newSpecifications,
    }));
  };

  const handleDelete = async () => {
    if (product) {
      await updateDoc(doc(db, 'companies', companyId, 'products', product.docId), {
        isDeleted: true,
      });
      setShowForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let manualUrl = product ? product.manualUrl : '';
    let thumbNailUrl = product ? product.thumbNailUrl : '';
    console.log(product);
    try {
      const productId = product ? product.docId : doc(collection(db, 'temp')).id;
      if (manual && manual.name) {
        const storageRef = ref(storage, `manuals/${productId}/${manual.name}`);
        await uploadBytes(storageRef, manual);
        manualUrl = await getDownloadURL(storageRef);
      }

      if (thumbnail && thumbnail.name) {
        const storageRef = ref(storage, `thumbnails/${productId}/${thumbnail.name}`);
        await uploadBytes(storageRef, thumbnail);
        thumbNailUrl = await getDownloadURL(storageRef);
      }

      const specificationsMap = productData.specifications.reduce((acc, spec) => {
        if (spec.key) {
          acc[spec.key] = spec.value;
        }
        return acc;
      }, {});

      const finalProductData = {
        ...productData,
        specifications: specificationsMap,
        manualUrl,
        thumbNailUrl,
        isDeleted: false,
      };

      if (product) {
        const updatedFields = {};
        for (const key in finalProductData) {
          if (finalProductData[key] !== initialProductData[key]) {
            updatedFields[key] = finalProductData[key];
          }
        }
        if (Object.keys(updatedFields).length > 0) {
          await updateDoc(doc(db, 'companies', companyId, 'products', product.docId), updatedFields);
        }
      } else {
        await addDoc(collection(db, 'companies', companyId, 'products'), finalProductData);
      }
    } catch (error) {
      console.error("Error uploading file: ", error);
      alert("File upload failed. Please try again.");
    } finally {
      setLoading(false);
      setShowForm(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <fieldset disabled={loading}>
        <h2 className="form-title">{product ? 'Edit Product' : 'Add Product'}</h2>
        {/* ... other form groups ... */}
        <div className="form-group">
          <label htmlFor="modelId">Model ID</label>
          <input id="modelId" name="modelId" value={productData.modelId} onChange={handleChange} placeholder="Enter product model ID" className="form-control" required />
        </div>
        <div className="form-group">
          <label htmlFor="productDescription">Description</label>
          <textarea id="productDescription" name="description" value={productData.description} onChange={handleChange} placeholder="Enter product description" className="form-control" />
        </div>
        <div className="form-group">
          <label htmlFor="productCategory">Category</label>
          <input id="productCategory" name="category" value={productData.category} onChange={handleChange} placeholder="Enter product category" className="form-control" />
        </div>
        
        <h5 className="mt-4">Specifications</h5>
        <div className="specifications-container">
          {productData.specifications.map((spec, index) => (
            <div className="form-row" key={index}>
              <div className="col">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                  placeholder="Specification Name"
                  className="form-control"
                />
              </div>
              <div className="col">
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                  placeholder="Specification Value"
                  className="form-control"
                />
              </div>
              <div className="col-auto">
                <button type="button" className="btn btn-danger" onClick={() => removeSpecification(index)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary mt-2" onClick={addSpecification}>Add Specification</button>

        <h5 className="mt-4">Files</h5>
        
        {/* THIS IS THE KEY CHANGE */}
        <div className="form-row">
          <div className="form-group col">
            <label>Manual PDF</label>
            <input type="file" onChange={(e) => setManual(e.target.files[0])} className="form-control-file" accept="application/pdf,.pdf" />
          </div>
          <div className="form-group col">
            <label>Thumbnail Image</label>
            <input type="file" onChange={(e) => setThumbnail(e.target.files[0])} className="form-control-file" accept="image/*" />
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-4">
          {loading ? 'Loading...' : (product ? 'Save Product' : 'Add Product')}
        </button>
        {product && (
          <button type="button" className="btn btn-danger mt-4" onClick={handleDelete}>
            Delete
          </button>
        )}
      </fieldset>
    </form>
  );
};

export default ProductForm;