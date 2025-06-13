"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes } from "react-icons/fa";

function AddStore({ onClose, onCompanyAdded }) {
  const [companyName, setCompanyName] = useState("");
  const [companyImage, setCompanyImage] = useState("");
  const [companyLink, setCompanyLink] = useState("");
  const [privateShop, isPrivateShop] = useState(true);
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
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setUploadError("");
      setCompanyImage(""); // Clear manual URL if file is selected
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/companyStores/uploadImage', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.url);
        setCompanyImage(result.url);
        setSelectedFile(null);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Network error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageUrl("");
    setCompanyImage("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!companyName || !companyImage || !companyLink) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createCompany();
      if (success) {
        // Clear form
        setCompanyName("");
        setCompanyImage("");
        setCompanyLink("");
        setUploadedImageUrl("");
        setSelectedFile(null);

        // Notify parent component to refresh the list
        if (onCompanyAdded) {
          onCompanyAdded();
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

  async function createCompany() {
    try {
      const companyData = {
        companyName: companyName,
        companyLink: companyLink,
        companyImage: companyImage,
        private: privateShop,
      };

      const response = await fetch("/api/companyStores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Company created successfully:", data.data);
        console.log("Message:", data.message);
        return true;
      } else {
        console.error("Error creating company:", data.error);
        console.error("Details:", data.details);
        alert("Error creating company: " + (data.error || "Unknown error"));
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
          Add a Company Store
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
            <label>Company Logo</label>
            
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
              
              {selectedFile && (
                <div className={styles.fileInfo}>
                  <span>{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={isUploading}
                    className={styles.uploadButton}
                  >
                    {isUploading ? "Uploading..." : "Upload to S3"}
                  </button>
                </div>
              )}
            </div>

            {/* Show uploaded image preview */}
            {uploadedImageUrl && (
              <div className={styles.imagePreview}>
                <img src={uploadedImageUrl} alt="Uploaded" className={styles.previewImage} />
                <button
                  type="button"
                  onClick={removeUploadedImage}
                  className={styles.removeButton}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Fallback: Manual URL input */}
            <div className={styles.orDivider}>
              <span>OR</span>
            </div>
            <input
              className={styles.input}
              value={companyImage}
              onChange={(e) => setCompanyImage(e.target.value)}
              placeholder="Or paste image URL"
              disabled={!!uploadedImageUrl}
            />

            {uploadError && (
              <div className={styles.error}>
                {uploadError}
              </div>
            )}
          </div>

          <div className={styles.formInput}>
            <label>Company Link</label>
            <input
              className={styles.input}
              value={companyLink}
              onChange={(e) => setCompanyLink(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div className={styles.formInput} style={{ display: "flex", gap: "10px" }}>
            <label>Viewing Settings</label>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <input
                type="radio"
                id="private"
                name="status"
                value="Private"
                checked={privateShop}
                onClick={() => isPrivateShop(true)}
              />
              <label for="private">Private</label>
            </div>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <input
                type="radio"
                id="public"
                name="status"
                value="Public"
                checked={!privateShop}
                onClick={() => isPrivateShop(false)}
              />
              <label for="public">Public</label>
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

function EditStore({ company, onClose, onCompanyEdited }) {
  console.log(company)
  const [companyName, setCompanyName] = useState(company.companyName);
  const [companyImage, setCompanyImage] = useState(company.companyImage);
  const [companyLink, setCompanyLink] = useState(company.companyLink);
  const [privateShop, isPrivateShop] = useState(company.private)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(company.companyImage);
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
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/companyStores/uploadImage', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.url);
        setCompanyImage(result.url);
        setSelectedFile(null);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Network error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImageUrl("");
    setCompanyImage("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName || !companyImage || !companyLink) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await editCompany();
      if (success) {
        if (onCompanyEdited) {
          onCompanyEdited();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async(e) => {
    e.preventDefault()
    setIsDeleting(true);

    try {
      const success = await deleteCompany();
      if (success) {
        if (onCompanyEdited) {
          onCompanyEdited();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function editCompany() {
    try {
      const companyData = {
        companyName: companyName,
        companyLink: companyLink,
        companyImage: companyImage,
        private: privateShop,

      };

      const response = await fetch(`/api/companyStores/${company._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Company edited successfully:", data.data);
        return true;
      } else {
        console.error("Error editing company:", data.error);
        alert("Error editing company: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  async function deleteCompany(){
    try {
      const response = await fetch(`/api/companyStores/${company._id}`, {
        method: 'DELETE',
      });
  
      const data = await response.json();
  
      if (data.success) {
        console.log('Company deleted successfully:', data.message);
        return true;
      } else {
        console.error('Error deleting company:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Network error:', error);
      return false;
    }
  }

  return (
    <div className={styles.addStoreOverlay} onClick={handleOverlayClick}>
      <div className={styles.overlay} onClick={handleModalClick}>
        <div className={styles.title} style={{ marginBottom: "30px" }}>
          Edit Company Store
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
            <label>Company Logo</label>
            
            {/* Current Image */}
            {uploadedImageUrl && (
              <div className={styles.imagePreview}>
                <img src={uploadedImageUrl} alt="Current" className={styles.previewImage} />
                <button
                  type="button"
                  onClick={removeUploadedImage}
                  className={styles.removeButton}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* File Upload Section */}
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="file-upload-edit"
              />
              <label htmlFor="file-upload-edit" className={styles.fileLabel}>
                <FaUpload /> {uploadedImageUrl ? 'Change Image' : 'Choose Image File'}
              </label>
              
              {selectedFile && (
                <div className={styles.fileInfo}>
                  <span>{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={isUploading}
                    className={styles.uploadButton}
                  >
                    {isUploading ? "Uploading..." : "Upload to S3"}
                  </button>
                </div>
              )}
            </div>

            {/* Manual URL input */}
            <div className={styles.orDivider}>
              <span>OR</span>
            </div>
            <input
              className={styles.input}
              value={companyImage}
              onChange={(e) => setCompanyImage(e.target.value)}
              placeholder="Or paste image URL"
            />

            {uploadError && (
              <div className={styles.error}>
                {uploadError}
              </div>
            )}
          </div>

          <div className={styles.formInput}>
            <label>Company Link</label>
            <input
              className={styles.input}
              value={companyLink}
              onChange={(e) => setCompanyLink(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div className={styles.formInput} style={{ display: "flex", gap: "10px" }}>
            <label>Viewing Settings</label>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <input
                type="radio"
                id="private"
                name="status"
                value="Private"
                checked={privateShop}
                onClick={() => isPrivateShop(true)}
              />
              <label for="private">Private</label>
            </div>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <input
                type="radio"
                id="public"
                name="status"
                value="Public"
                checked={!privateShop}
                onClick={() => isPrivateShop(false)}
              />
              <label for="public">Public</label>
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

function AddCompanyStore() {
  const [companies, setCompanies] = useState([]);
  const [addStoreOpen, setAddStoreOpen] = useState(false);
  const [editStoreOpen, setEditStoreOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState({})

  useEffect(() => {
    getAllCompanies();
  }, []);

  const handleCompanyAdded = () => {
    getAllCompanies(); 
  };

  async function getAllCompanies() {
    try {
      const response = await fetch("/api/companyStores");
      const data = await response.json();

      if (data.success) {
        console.log("Companies:", data.data);
        setCompanies(data.data);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }
  console.log(companies)

  return (
    <>
      {addStoreOpen && (
        <AddStore 
          onClose={() => setAddStoreOpen(false)} 
          onCompanyAdded={handleCompanyAdded} 
        />
      )}
      {editStoreOpen && (
        <EditStore
          company={selectedStore}
          onClose={() => setEditStoreOpen(false)} 
          onCompanyEdited={handleCompanyAdded}
        />
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Company Stores</div>
          <button
            className={styles.button}
            onClick={() => setAddStoreOpen(true)}
          >
            Add Store
          </button>
        </div>
        <div className={styles.companies}>
          {companies.map((company, index) => (
            <div className={styles.company} key={index}>
              <div className={styles.imageContainer}>
                <img
                  src={company.companyImage}
                  className={styles.companyImage}
                  alt={company.companyName}
                />
              </div>
              <div className={styles.companyName}>{company.companyName}</div>
              <div className={styles.edit} onClick={() => {setSelectedStore(company); setEditStoreOpen(true)}}>
                <FaRegEdit size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AddCompanyStore;