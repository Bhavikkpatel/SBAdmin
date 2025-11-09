import React, { useState } from "react";
// Added serverTimestamp for better tracking
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

// Define the new root collection
const TARGET_COLLECTION = "products_staging";

const ProductForm = ({ product, companyId, setShowForm }) => {
  const [initialProductData] = useState(
    product || {
      description: "",
      modelId: "",
      specifications: [],
      category: "",
    }
  );
  const [productData, setProductData] = useState(() => {
    const data = { ...initialProductData };
    if (
      data.specifications &&
      typeof data.specifications === "object" &&
      !Array.isArray(data.specifications)
    ) {
      data.specifications = Object.entries(data.specifications).map(
        ([key, value]) => ({ key, value })
      );
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
    setProductData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecifications = [...productData.specifications];
    newSpecifications[index][field] = value;
    setProductData((prevData) => ({
      ...prevData,
      specifications: newSpecifications,
    }));
  };

  const addSpecification = () => {
    setProductData((prevData) => ({
      ...prevData,
      specifications: [...prevData.specifications, { key: "", value: "" }],
    }));
  };

  const removeSpecification = (index) => {
    const newSpecifications = [...productData.specifications];
    newSpecifications.splice(index, 1);
    setProductData((prevData) => ({
      ...prevData,
      specifications: newSpecifications,
    }));
  };

  // --- UPDATED DELETE HANDLER ---
  const handleDelete = async () => {
    if (product && product.docId) {
      if (!window.confirm("Are you sure you want to delete this product?"))
        return;

      try {
        setLoading(true);
        // CHANGED: Soft delete in the root collection
        await updateDoc(doc(db, TARGET_COLLECTION, product.docId), {
          isDeleted: true,
          updatedAt: serverTimestamp(),
        });
        setShowForm(false);
      } catch (error) {
        console.error("Error deleting product: ", error);
        alert("Delete failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let manualUrl = product ? product.manualUrl : "";
    let thumbNailUrl = product ? product.thumbNailUrl : "";

    try {
      // Use existing ID or generate a temporary one for storage paths
      const productId = product ? product.docId : Date.now().toString();

      if (manual) {
        const storageRef = ref(storage, `manuals/${productId}/${manual.name}`);
        await uploadBytes(storageRef, manual);
        manualUrl = await getDownloadURL(storageRef);
      }

      if (thumbnail) {
        const storageRef = ref(
          storage,
          `thumbnails/${productId}/${thumbnail.name}`
        );
        await uploadBytes(storageRef, thumbnail);
        thumbNailUrl = await getDownloadURL(storageRef);
      }

      const specificationsMap = productData.specifications.reduce(
        (acc, spec) => {
          if (spec.key) {
            acc[spec.key] = spec.value;
          }
          return acc;
        },
        {}
      );

      const finalProductData = {
        ...productData,
        specifications: specificationsMap,
        manualUrl,
        thumbNailUrl,
        isDeleted: false,
        updatedAt: serverTimestamp(),
      };

      if (product && product.docId) {
        // CHANGED: Update existing document in root collection
        await updateDoc(
          doc(db, TARGET_COLLECTION, product.docId),
          finalProductData
        );
      } else {
        // CHANGED: Add new document to root collection with FOREIGN KEY
        await addDoc(collection(db, TARGET_COLLECTION), {
          ...finalProductData,
          companyId: companyId, // MUST INCLUDE THIS
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error saving product: ", error);
      alert("Save failed. Please try again.");
    } finally {
      setLoading(false);
      setShowForm(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <fieldset disabled={loading}>
        <h2 className="form-title">
          {product ? "Edit Product" : "Add Product"}
        </h2>

        <div className="form-group">
          <label htmlFor="modelId">Model ID</label>
          <input
            id="modelId"
            name="modelId"
            value={productData.modelId}
            onChange={handleChange}
            placeholder="Enter product model ID"
            className="form-control"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="productDescription">Description</label>
          <textarea
            id="productDescription"
            name="description"
            value={productData.description}
            onChange={handleChange}
            placeholder="Enter product description"
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="productCategory">Category</label>
          <input
            id="productCategory"
            name="category"
            value={productData.category}
            onChange={handleChange}
            placeholder="Enter product category"
            className="form-control"
          />
        </div>

        <h5 className="mt-4">Specifications</h5>
        <div className="specifications-container">
          {productData.specifications.length > 0 && (
            <div className="spec-header">
              <span>Name</span>
              <span>Value</span>
              <span></span> {/* Empty for action column */}
            </div>
          )}

          {productData.specifications.map((spec, index) => (
            <div className="spec-row" key={index}>
              <div className="spec-input-group">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) =>
                    handleSpecificationChange(index, "key", e.target.value)
                  }
                  placeholder="e.g., Weight"
                  className="form-control spec-input"
                />
              </div>
              <div className="spec-input-group">
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) =>
                    handleSpecificationChange(index, "value", e.target.value)
                  }
                  placeholder="e.g., 50 lbs"
                  className="form-control spec-input"
                />
              </div>
              <div className="spec-action">
                <button
                  type="button"
                  className="btn-icon-danger"
                  onClick={() => removeSpecification(index)}
                  title="Remove specification"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {productData.specifications.length === 0 && (
            <p className="no-specs-text">No specifications added yet.</p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm mt-3"
          onClick={addSpecification}
        >
          + Add Specification
        </button>

        <h5 className="mt-4">Files</h5>
        <div className="form-row">
          <div className="form-group col">
            <label>Manual PDF</label>
            <input
              type="file"
              onChange={(e) => setManual(e.target.files[0])}
              className="form-control-file"
              accept="application/pdf,.pdf"
            />
            {productData.manualUrl && !manual && (
              <small>
                <a
                  href={productData.manualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Current Manual
                </a>
              </small>
            )}
          </div>
          <div className="form-group col">
            <label>Thumbnail Image</label>
            <input
              type="file"
              onChange={(e) => setThumbnail(e.target.files[0])}
              className="form-control-file"
              accept="image/*"
            />
            {productData.thumbNailUrl && !thumbnail && (
              <img
                src={productData.thumbNailUrl}
                alt="Thumbnail"
                style={{ height: "50px", marginTop: "5px" }}
              />
            )}
          </div>
        </div>

        <div className="button-group mt-4">
          <button type="submit" className="btn btn-primary">
            {loading ? "Saving..." : product ? "Save Product" : "Add Product"}
          </button>
          {product && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowForm(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
};

export default ProductForm;
