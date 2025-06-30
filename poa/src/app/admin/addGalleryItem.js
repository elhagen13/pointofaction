"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes } from "react-icons/fa";

// Define the service type options
const SERVICE_TYPES = [
  "Embroidery",
  "Laser Etching",
  "Vinyl Printing",
  "Patches",
  "Printing",
  "Art Digitizing",
];

function AddImage({ onClose, onCompanyAdded }) {
  const [companyName, setCompanyName] = useState("");
  const [image, setImage] = useState("");
  const [type, setType] = useState("");
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
      setImage(""); // Clear manual URL if file is selected
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

      const response = await fetch("/api/galleryImages/uploadImage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.url);
        setImage(result.url);
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
    setImage("");
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!companyName || !image || !type) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createGalleryItem();
      if (success) {
        // Clear form
        setCompanyName("");
        setImage("");
        setType("");
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

  async function createGalleryItem() {
    try {
      const imageData = {
        company: companyName,
        imageLink: image,
        type: type,
      };

      const response = await fetch("/api/galleryImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageData),
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
          Add a Gallery Image
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
            <label>Service Type</label>
            <select
              className={styles.input}
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Select a service type</option>
              {SERVICE_TYPES.map((serviceType) => (
                <option key={serviceType} value={serviceType}>
                  {serviceType}
                </option>
              ))}
            </select>
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

function EditImage({ image, onClose, onCompanyEdited: onGalleryItemEdited }) {
  const [companyName, setCompanyName] = useState(image.company);
  const [galleryImage, setGalleryImage] = useState(image.imageLink);
  const [type, setType] = useState(image.type);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(image.imageLink);
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

      const response = await fetch("/api/galleryImages/uploadImage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.url);
        setGalleryImage(result.url);
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

    if (!companyName || !galleryImage || !type) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await editGalleryItem();
      if (success) {
        if (onGalleryItemEdited) {
          onGalleryItemEdited();
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
      const success = await deleteGalleryItem();
      if (success) {
        if (onGalleryItemEdited) {
          onGalleryItemEdited();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  async function editGalleryItem() {
    try {
      const imageData = {
        company: companyName,
        imageLink: galleryImage,
        type: type,
      };

      const response = await fetch(`/api/galleryImages/${image._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Image edited successfully:", data.data);
        return true;
      } else {
        console.error("Error editing image:", data.error);
        alert("Error editing image: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  async function deleteGalleryItem() {
    try {
      const response = await fetch(`/api/galleryImages/${image._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        console.log("Image deleted successfully:", data.message);
        return true;
      } else {
        console.error("Error deleting image:", data.error);
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
          Edit Gallery Item
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
            <label>Gallery Image</label>

            {/* Current Image */}
            {uploadedImageUrl && (
              <div className={styles.imagePreview}>
                <img
                  src={uploadedImageUrl}
                  alt="Current"
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
                <FaUpload />{" "}
                {uploadedImageUrl ? "Change Image" : "Choose Image File"}
              </label>
            </div>

            {uploadError && <div className={styles.error}>{uploadError}</div>}
          </div>

          <div className={styles.formInput}>
            <label>Service Type</label>
            <select
              className={styles.input}
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Select a service type</option>
              {SERVICE_TYPES.map((serviceType) => (
                <option key={serviceType} value={serviceType}>
                  {serviceType}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
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

function AddGalleryItem() {
  const [images, setImages] = useState([]);
  const [addGalleryItemOpen, setAddGalleryItemOpen] = useState(false);
  const [editGalleryItemOpen, setEditGalleryItemOpen] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState({});
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    getAllImages();
  }, []);

  const handleCompanyAdded = () => {
    getAllImages();
  };

  async function getAllImages() {
    try {
      const response = await fetch("/api/galleryImages");
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
  console.log(images);

  return (
    <>
      {addGalleryItemOpen && (
        <AddImage
          onClose={() => setAddGalleryItemOpen(false)}
          onCompanyAdded={handleCompanyAdded}
        />
      )}
      {editGalleryItemOpen && (
        <EditImage
          image={selectedGalleryItem}
          onClose={() => setEditGalleryItemOpen(false)}
          onCompanyEdited={handleCompanyAdded}
        />
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Product Images</div>
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
              onClick={() => setGalleryOpen(!galleryOpen)}
            >
              {galleryOpen ? "Hide Products" : "View Products"}
            </button>
            <button
              className={styles.button}
              onClick={() => setAddGalleryItemOpen(true)}
            >
              Add Image
            </button>
          </div>
        </div>
        <div className={styles.companies}>
          { galleryOpen && images.map((image, index) => (
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
                  setSelectedGalleryItem(image);
                  setEditGalleryItemOpen(true);
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

export default AddGalleryItem;
