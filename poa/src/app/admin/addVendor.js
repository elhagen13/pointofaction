"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes } from "react-icons/fa";

const VENDOR_TYPES = [
  "overall",
  "tops",
  "outerwear",
  "activewear",
  "headwear",
  "workwear",
  "drinkware",
];

function AddVendor({ onClose, onVendorAdded }) {
  const [companyName, setCompanyName] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [category, setCategory] = useState([]);
  const [link, setLink] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setUploadError("");
      setImageLink(""); // Clear manual URL if file is selected
    }
  };

  useEffect(() => {
    handleUploadImage();
  }, [selectedFile]);

  const handleUploadImage = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/vendors/uploadImage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.url);
        setImageLink(result.url);
        setSelectedFile(null);
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (error) {
      setUploadError("Network error: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageUrl("");
    setImageLink("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!companyName || !imageLink || !category || !link) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createVendorItem();
      if (success) {
        // Clear form
        setCompanyName("");
        setImageLink("");
        setCategory("");
        setLink("");
        setBlocked(false);
        setUploadedImageUrl("");
        setSelectedFile(null);

        // Notify parent component to refresh the list
        if (onVendorAdded) {
          onVendorAdded();
        }

        // Close modal
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  async function createVendorItem() {
    try {
      const vendorData = {
        company: companyName,
        imageLink: imageLink,
        category: category,
        link: link,
        blocked: blocked,
      };

      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vendorData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Vendor created successfully:", data.data);
        console.log("Message:", data.message);
        return true;
      } else {
        console.error("Error creating vendor:", data.error);
        console.error("Details:", data.details);
        alert("Error creating vendor: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  return (
    <div className={styles.addStoreOverlay} onClick={handleOverlayClick}>
      <div className={styles.overlay} onClick={handleModalClick}>
        <div className={styles.title} style={{ marginBottom: "30px" }}>
          Add a Vendor
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formInput}>
            <label>Company Name</label>
            <input
              className={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              required
            />
          </div>

          <div className={styles.formInput}>
            <label>Image</label>

            {/* File Upload Section */}
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="file-upload"
              />
              <label htmlFor="file-upload" className={styles.fileLabel}>
                <FaUpload /> Choose Image File
              </label>
            </div>

            {/* Show uploaded image preview */}
            {uploadedImageUrl && (
              <div className={styles.imagePreview}>
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded"
                  className={styles.previewImage}
                />
                <button
                  type="button"
                  onClick={removeUploadedImage}
                  className={styles.removeButton}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {uploadError && <div className={styles.error}>{uploadError}</div>}
          </div>

          <div className={styles.formInput}>
            <label>Vendor Type</label>
            <select
              className={styles.input}
              value={category}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                setCategory(selectedOptions);
              }}
              multiple
              required
            >
              <option value="">Select a service type</option>
              {VENDOR_TYPES.map((vendorType) => (
                <option key={vendorType} value={vendorType}>
                  {vendorType}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formInput}>
            <label>Redirect Link</label>
            <input
              className={styles.input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.pointofaction.com"
              required
            />
          </div>
          <div className={styles.formInput}>
            <div>
              <input
                type="radio"
                id="blocked"
                name="blockStatus"
                checked={blocked}
                onChange={() => setBlocked(true)}
              />
              <label htmlFor="blocked">Link blocked</label>
            </div>
            <div>
              <input
                type="radio"
                id="unblocked"
                name="blockStatus"
                checked={!blocked}
                onChange={() => setBlocked(false)}
              />
              <label htmlFor="unblocked">Link unblocked</label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className={styles.button}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditVendor({ vendor, onClose, onVendorItemEdited }) {
  const [companyName, setCompanyName] = useState(vendor.company);
  const [imageLink, setImageLink] = useState(vendor.imageLink);
  const [category, setCategory] = useState(vendor.category);
  const [link, setLink] = useState(vendor.link);
  const [blocked, setBlocked] = useState(vendor.blocked);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(vendor.imageLink);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setUploadError("");
    }
  };

  useEffect(() => {
    handleUploadImage();
  }, [selectedFile]);

  const handleUploadImage = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/vendors/uploadImage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.url);
        setImageLink(result.url);
        setSelectedFile(null);
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (error) {
      setUploadError("Network error: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageUrl("");
    setGalleryImage("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName || !imageLink || !category || !link) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await editVendorItem();
      if (success) {
        if (onVendorItemEdited) {
          onVendorItemEdited();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      const success = await deleteVendorItem();
      if (success) {
        if (onVendorItemEdited) {
          onVendorItemEdited();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
    onVendorItemEdited();
    onClose();
  };

  async function editVendorItem() {
    try {
      const vendorData = {
        company: companyName,
        imageLink: imageLink,
        category: category,
        link: link,
        blocked: blocked,
      };

      const response = await fetch(`/api/vendors/${vendor._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vendorData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Vendor edited successfully:", data.data);
        return true;
      } else {
        console.error("Error editing vendor:", data.error);
        alert("Error editing vendor: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  async function deleteVendorItem() {
    try {
      const response = await fetch(`/api/vendors/${vendor._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        console.log("Vendor deleted successfully:", data.message);
        return true;
      } else {
        console.error("Error deleting vendor:", data.error);
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      return false;
    }
  }

  return (
    <div className={styles.addStoreOverlay} onClick={handleOverlayClick}>
    <div className={styles.overlay} onClick={handleModalClick}>
      <div className={styles.title} style={{ marginBottom: "30px" }}>
        Edit Vendor
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.formInput}>
          <label>Company Name</label>
          <input
            className={styles.input}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
            required
          />
        </div>

        <div className={styles.formInput}>
          <label>Image</label>

          {/* File Upload Section */}
          <div className={styles.uploadSection}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.fileInput}
              id="file-upload"
            />
            <label htmlFor="file-upload" className={styles.fileLabel}>
              <FaUpload /> Choose Image File
            </label>
          </div>

          {/* Show uploaded image preview */}
          {uploadedImageUrl && (
            <div className={styles.imagePreview}>
              <img
                src={uploadedImageUrl}
                alt="Uploaded"
                className={styles.previewImage}
              />
              <button
                type="button"
                onClick={removeUploadedImage}
                className={styles.removeButton}
              >
                <FaTimes />
              </button>
            </div>
          )}

          {uploadError && <div className={styles.error}>{uploadError}</div>}
        </div>

        <div className={styles.formInput}>
          <label>Vendor Type</label>
          <select
            className={styles.input}
            value={category}
            onChange={(e) => {
              const selectedOptions = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              setCategory(selectedOptions);
            }}
            multiple
            required
          >
            <option value="">Select a service type</option>
            {VENDOR_TYPES.map((vendorType) => (
              <option key={vendorType} value={vendorType}>
                {vendorType}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formInput}>
          <label>Redirect Link</label>
          <input
            className={styles.input}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.pointofaction.com"
            required
          />
        </div>
        <div className={styles.formInput}>
          <div>
            <input
              type="radio"
              id="blocked"
              name="blockStatus"
              checked={blocked}
              onChange={() => setBlocked(true)}
            />
            <label htmlFor="blocked">Link blocked</label>
          </div>
          <div>
            <input
              type="radio"
              id="unblocked"
              name="blockStatus"
              checked={!blocked}
              onChange={() => setBlocked(false)}
            />
            <label htmlFor="unblocked">Link unblocked</label>
          </div>
        </div>

        <div style={{display:"flex", justifyContent:"space-between"}}>
            <button 
              type="submit" 
              disabled={isSubmitting || isUploading} 
              className={styles.button}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button 
              className={`${styles.button} ${styles.delete}`} 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
      </form>
    </div>
  </div>
  );
}

function AddVendorItem() {
  const [images, setImages] = useState([]);
  const [addVendorItemOpen, setAddVendorItemOpen] = useState(false);
  const [editVendorItemOpen, setEditVendorItemOpen] = useState(false);
  const [selectedVendorItem, setSelectedVendorItem] = useState({});
  const [vendorOpen, setVendorOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredImages = useMemo(() => {
    if (!search.trim()) {
      return images;
    }
    
    const searchLower = search.toLowerCase();
    return images.filter(image => {
      const companyMatch = image.company.toLowerCase().includes(searchLower);
      // Fix: Check if any category in the array matches
      const categoryMatch = Array.isArray(image.category) 
        ? image.category.some(cat => cat.toLowerCase().includes(searchLower))
        : image.category.toLowerCase().includes(searchLower);
      
      return companyMatch || categoryMatch;
    });
  }, [images, search]);

  useEffect(() => {
    getAllImages();
  }, []);


  const handleVendorAdded = () => {
    getAllImages();
  };

  const filterImages = () => {
    setFilteredImages(images.filter(image => 
        image.company.toLowerCase().includes(search.toLowerCase()) || image.category.includes(search.toLowerCase())
    ))
  }

  async function getAllImages() {
    try {
      const response = await fetch("/api/vendors");
      const data = await response.json();

      if (data.success) {
        console.log("Images:", data.data);
        setImages(data.data);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }

  return (
    <>
      {addVendorItemOpen && (
        <AddVendor
          onClose={() => setAddVendorItemOpen(false)}
          onVendorAdded={handleVendorAdded}
        />
      )}
      {editVendorItemOpen && (
        <EditVendor
          vendor={selectedVendorItem}
          onClose={() => setEditVendorItemOpen(false)}
          onVendorItemEdited={handleVendorAdded}
        />
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Vendors</div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <button
              className={styles.button}
              style={{
                border: "2px solid #538561",
                backgroundColor: "white",
                color: "#538561",
              }}
              onClick={() => setVendorOpen(!vendorOpen)}
            >
              {vendorOpen ? "Hide Vendors" : "View Vendors"}
            </button>
            <button
              className={styles.button}
              onClick={() => setAddVendorItemOpen(true)}
            >
              Add Vendor
            </button>
          </div>
        </div>
        {vendorOpen && 
            <div style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "right"}}>
            <input 
              placeholder="Search..." 
              className={styles.search} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        }
        <div className={styles.companies}>
          {vendorOpen &&
            filteredImages.map((image, index) => (
              <div className={styles.company} key={index}>
                <div className={styles.imageContainer}>
                  <img
                    src={image.imageLink}
                    className={styles.companyImage}
                    alt={image.company}
                  />
                </div>
                <div className={styles.companyName}>{image.company}</div>
                <div
                  className={styles.edit}
                  onClick={() => {
                    setSelectedVendorItem(image);
                    setEditVendorItemOpen(true);
                  }}
                >
                  <FaRegEdit size={20} />
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

export default AddVendorItem;
