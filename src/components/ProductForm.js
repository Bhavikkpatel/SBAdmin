import React, { useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import "./Form.css";
import { checkIfModelExists } from '../helper.js';

const TARGET_COLLECTION = "products_staging";

const ProductForm = ({ product, companyId, setShowForm }) => {
  const [initialProductData] = useState(
    product || {
      description: "",
      modelId: "",
      specifications: [],
      category: "",
      videoUrl: "", // NEW FIELD
    }
  );
  const [productData, setProductData] = useState(() => {
    const data = { ...initialProductData };
    if (data.specifications && typeof data.specifications === "object" && !Array.isArray(data.specifications)) {
      data.specifications = Object.entries(data.specifications).map(([key, value]) => ({ key, value }));
    } else if (!data.specifications) {
      data.specifications = [];
    }
    return data;
  });
  
  const [manual, setManual] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // --- FIELD VALIDATION ---
  const validateField = async (name, value) => {
    let error = null;
    if (name === 'modelId') {
        if (!value.trim()) {
            error = "Model ID is required.";
        } else {
            if (!product || product.modelId !== value) {
                const exists = await checkIfModelExists("products_staging", value, companyId);
                if (exists) error = "This Model ID already exists.";
            }
        }
    } else if (name === 'description' && !value.trim()) {
        error = "Description is required.";
    } else if (name === 'category' && !value.trim()) {
        error = "Category is required.";
    } else if (name === 'videoUrl' && value.trim()) {
        // NEW: Youtube URL Validation
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!youtubeRegex.test(value)) {
            error = "Please enter a valid YouTube URL.";
        }
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    await validateField(name, value);
  };

  // ... (Specification handlers remain the same) ...
  const handleSpecificationChange = (index, field, value) => {
    const newSpecifications = [...productData.specifications];
    newSpecifications[index][field] = value;
    setProductData((prevData) => ({ ...prevData, specifications: newSpecifications }));
    if (errors.specifications && errors.specifications[index]) {
         setErrors(prev => {
             const newSpecErrors = [...(prev.specifications || [])];
             if (newSpecErrors[index]) newSpecErrors[index] = { ...newSpecErrors[index], [field]: null };
             return { ...prev, specifications: newSpecErrors };
         });
    }
  };
  const addSpecification = () => setProductData((prev) => ({ ...prev, specifications: [...prev.specifications, { key: "", value: "" }] }));
  const removeSpecification = (index) => {
    const newSpecifications = [...productData.specifications];
    newSpecifications.splice(index, 1);
    setProductData((prev) => ({ ...prev, specifications: newSpecifications }));
    setErrors(prev => {
        if (!prev.specifications) return prev;
        const newSpecErrors = [...prev.specifications];
        newSpecErrors.splice(index, 1);
        return { ...prev, specifications: newSpecErrors };
    });
  };

  // ... (handleDelete remains the same) ...
  const handleDelete = async () => {
    if (product && product.docId) {
      if (!window.confirm("Are you sure you want to delete this product?")) return;
      try {
        setLoading(true);
        await updateDoc(doc(db, TARGET_COLLECTION, product.docId), {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        });
        setShowForm(false);
      } catch (error) {
        console.error("Error deleting product: ", error);
        setErrors(prev => ({ ...prev, form: "Delete failed. Please try again." }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const modelIdError = await validateField('modelId', productData.modelId);
    const descError = await validateField('description', productData.description);
    const catError = await validateField('category', productData.category);
    const videoError = await validateField('videoUrl', productData.videoUrl); // NEW

    let hasSpecErrors = false;
    const specErrors = productData.specifications.map(spec => {
        const keyError = spec.key.trim() ? null : "Name required";
        const valueError = spec.value.trim() ? null : "Value required";
        if (keyError || valueError) hasSpecErrors = true;
        return { key: keyError, value: valueError };
    });

    if (modelIdError || descError || catError || videoError || hasSpecErrors) {
        setErrors(prev => ({ ...prev, specifications: specErrors }));
        return;
    }

    setLoading(true);
    const trimmedData = {};
    for (const key in productData) {
        trimmedData[key] = typeof productData[key] === 'string' ? productData[key].trim() : productData[key];
    }

    let manualUrl = product ? product.manualUrl : "";
    let thumbNailUrl = product ? product.thumbNailUrl : "";

    try {
      const productId = product ? product.docId : Date.now().toString();

      // ... (Image upload logic remains the same) ...
      if (manual) {
        const storageRef = ref(storage, `manuals/${productId}/${manual.name}`);
        await uploadBytes(storageRef, manual);
        manualUrl = await getDownloadURL(storageRef);
      }
      if (thumbnail) {
        const storageRef = ref(storage, `thumbnails/${productId}/${thumbnail.name}`);
        await uploadBytes(storageRef, thumbnail);
        thumbNailUrl = await getDownloadURL(storageRef);
      }

      const specificationsMap = productData.specifications.reduce((acc, spec) => {
          if (spec.key.trim()) acc[spec.key.trim()] = spec.value.trim();
          return acc;
        }, {});

      const finalProductData = {
        ...trimmedData,
        specifications: specificationsMap,
        manualUrl,
        thumbNailUrl,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      };

      if (product && product.docId) {
        await updateDoc(doc(db, TARGET_COLLECTION, product.docId), finalProductData);
      } else {
        await addDoc(collection(db, TARGET_COLLECTION), {
          ...finalProductData,
          companyId: companyId,
          createdAt: serverTimestamp(),
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error saving product: ", error);
      setErrors(prev => ({ ...prev, form: "Failed to save product. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <fieldset disabled={loading}>
        <h2 className="form-title">{product ? "Edit Product" : "Add Product"}</h2>

        {errors.form && <div className="alert alert-danger">{errors.form}</div>}

        <div className="form-group">
          <label htmlFor="modelId">Model ID</label>
          <input
            id="modelId"
            name="modelId"
            value={productData.modelId}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter product model ID"
            className={`form-control ${errors.modelId ? 'is-invalid' : ''}`}
            required
          />
          {errors.modelId && <div className="invalid-feedback">{errors.modelId}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="productDescription">Description</label>
          <textarea
            id="productDescription"
            name="description"
            value={productData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter product description"
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            required
          />
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="productCategory">Category</label>
          <input
            id="productCategory"
            name="category"
            value={productData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter product category"
            className={`form-control ${errors.category ? 'is-invalid' : ''}`}
            required
          />
          {errors.category && <div className="invalid-feedback">{errors.category}</div>}
        </div>

        {/* --- NEW VIDEO URL FIELD --- */}
        <div className="form-group">
          <label htmlFor="videoUrl">YouTube Video URL</label>
          <input
            id="videoUrl"
            name="videoUrl"
            value={productData.videoUrl}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://www.youtube.com/watch?v=..."
            className={`form-control ${errors.videoUrl ? 'is-invalid' : ''}`}
          />
          {errors.videoUrl && <div className="invalid-feedback">{errors.videoUrl}</div>}
        </div>

        {/* ... (Specifications and Files sections remain same) ... */}
        <h5 className="mt-4">Specifications</h5>
        <div className="specifications-container">
          {productData.specifications.length > 0 && (
            <div className="spec-header">
              <span>Name</span><span>Value</span><span></span>
            </div>
          )}
          {productData.specifications.map((spec, index) => {
             const specError = errors.specifications && errors.specifications[index];
             return (
                <div className="spec-row" key={index}>
                  <div className="spec-input-group">
                    <input 
                        type="text" 
                        value={spec.key} 
                        onChange={(e) => handleSpecificationChange(index, "key", e.target.value)} 
                        placeholder="e.g., Weight" 
                        className={`form-control spec-input ${specError?.key ? 'is-invalid' : ''}`}
                    />
                    {specError?.key && <div className="invalid-feedback">{specError.key}</div>}
                  </div>
                  <div className="spec-input-group">
                    <input 
                        type="text" 
                        value={spec.value} 
                        onChange={(e) => handleSpecificationChange(index, "value", e.target.value)} 
                        placeholder="e.g., 50 lbs" 
                        className={`form-control spec-input ${specError?.value ? 'is-invalid' : ''}`}
                    />
                    {specError?.value && <div className="invalid-feedback">{specError.value}</div>}
                  </div>
                  <div className="spec-action">
                    <button type="button" className="btn-icon-danger" onClick={() => removeSpecification(index)} title="Remove specification">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
             );
          })}
          {productData.specifications.length === 0 && <p className="no-specs-text">No specifications added yet.</p>}
        </div>
        <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={addSpecification}>+ Add Specification</button>

        <h5 className="mt-4">Files</h5>
        <div className="form-row">
          <div className="form-group col">
            <label>Manual PDF</label>
            <input type="file" onChange={(e) => setManual(e.target.files[0])} className="form-control-file" accept="application/pdf,.pdf" />
            {productData.manualUrl && !manual && <small><a href={productData.manualUrl} target="_blank" rel="noopener noreferrer">Current Manual</a></small>}
          </div>
          <div className="form-group col">
            <label>Thumbnail Image</label>
            <input type="file" onChange={(e) => setThumbnail(e.target.files[0])} className="form-control-file" accept="image/*" />
            {productData.thumbNailUrl && !thumbnail && <img src={productData.thumbNailUrl} alt="Thumbnail" style={{ height: "50px", marginTop: "5px" }} />}
          </div>
        </div>

        <div className="button-group mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : product ? "Save Product" : "Add Product"}
          </button>
          {product && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>Delete</button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={loading}>Cancel</button>
        </div>
      </fieldset>
    </form>
  );
};

export default ProductForm;