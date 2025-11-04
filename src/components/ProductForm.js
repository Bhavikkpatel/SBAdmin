import React, { useState } from 'react';
import { collection, setDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import './Form.css';

const ProductForm = ({ product, companyId, setShowForm }) => {
  const [productData, setProductData] = useState(() => {
    const initialData = product || {
      description: '',
      id: '',
      specifications: [],
    };

    // Ensure specifications is an array for the form
    if (initialData.specifications && typeof initialData.specifications === 'object' && !Array.isArray(initialData.specifications)) {
      initialData.specifications = Object.entries(initialData.specifications).map(([key, value]) => ({ key, value }));
    } else if (!initialData.specifications) {
      initialData.specifications = [];
    }

    return initialData;
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
      await updateDoc(doc(db, 'companies', companyId, 'products', product.id), {
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

    try {
      if (manual) {
        const storageRef = ref(storage, `manuals/${productData.id}/${manual.name}`);
        await uploadBytes(storageRef, manual);
        manualUrl = await getDownloadURL(storageRef);
      }

      if (thumbnail) {
        const storageRef = ref(storage, `thumbnails/${productData.id}/${thumbnail.name}`);
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
        await updateDoc(doc(db, 'companies', companyId, 'products', product.id), finalProductData);
      } else {
        if (productData.id) {
          await setDoc(doc(db, 'companies', companyId, 'products', productData.id), finalProductData);
        } else {
          alert("Product ID is required.");
          setLoading(false);
          return;
        }
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
          <label htmlFor="productId">ID</label>
          <input id="productId" name="id" value={productData.id} onChange={handleChange} placeholder="Enter product ID" className="form-control" />
        </div>
        <div className="form-group">
          <label htmlFor="productDescription">Description</label>
          <textarea id="productDescription" name="description" value={productData.description} onChange={handleChange} placeholder="Enter product description" className="form-control" />
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