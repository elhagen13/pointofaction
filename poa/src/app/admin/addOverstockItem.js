"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes, FaRegTrashAlt } from "react-icons/fa";
import { FaRegSquarePlus } from "react-icons/fa6";

function AddStore({ onClose, onOverstockAdded }) {
  const [boxName, setBoxName] = useState("");
  const [boxDescription, setBoxDescription] = useState("");
  const [boxDiscount, setBoxDiscount] = useState(20);
  const [boxLocation, setBoxLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currentItem, setCurrentItem] = useState({
    imageUrl: "",
    description: "",
    style: "",
    size: "",
    color: "",
    quantity: 0,
    price: 0.0,
  });
  const [contents, setContents] = useState([
    {
      imageUrl:
        "https://www.harrisonsusa.com/cdn/shop/products/K128Navy.png?v=1691854258",
      description: "Nice shirt",
      style: "carhartt",
      size: "L",
      color: "Gray",
      quantity: 20,
      price: 5.7,
    },
    {
      imageUrl:
        "https://www.harrisonsusa.com/cdn/shop/products/K128Navy.png?v=1691854258",
      description: "Same shirt but testing longer description",
      style: "carhartt",
      size: "M",
      color: "Blue",
      quantity: 17,
      price: 40.0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [newItemOpen, setNewItemOpen] = useState(false);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Handle clicking on thumbnail to select new image
  const handleThumbnailClick = (index) => {
    setSelectedItemIndex(index);
    // Create a temporary file input and trigger it
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => handleFileSelect(e, "content", index);
    fileInput.click();
  };

  // Handle clicking on new item thumbnail
  const handleNewItemThumbnailClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => handleFileSelect(e, "content");
    fileInput.click();
  };

  const handleFileSelect = (e, type, itemIndex = null) => {
    console.log(e, type, itemIndex);
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
      console.log(e, type, itemIndex);
      handleUploadImage(file, type, itemIndex);
      setUploadError("");
    }
  };

  const handleUploadImage = async (file, type, itemIndex = null) => {
    console.log(file, type, itemIndex);
    if (!file) {
      return;
    }
    setImageUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/saleItems/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        if (type === "content" && itemIndex !== null) {
          // Update specific item's image
          setContents((prevContents) =>
            prevContents.map((item, index) =>
              index === itemIndex ? { ...item, imageUrl: result.url } : item
            )
          );
        } else if (type === "content") {
          // Update current item being added
          setCurrentItem({
            ...currentItem,
            imageUrl: result.url,
          });
        } else {
          // Update box image
          setImageUrl(result.url);
        }
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (error) {
      setUploadError("Network error: " + error.message);
    } finally {
      setImageUploading(false);
      setSelectedItemIndex(null);
    }
  };

  useEffect(() => {
    console.log(imageUrl);
  }, [imageUrl]);

  const removeUploadedImage = () => {
    setImageUrl("");
  };

  const updateExistingContent = (idToUpdate, field, newValue) => {
    setContents((prevContents) =>
      prevContents.map((item, index) =>
        index === idToUpdate ? { ...item, [field]: newValue } : item
      )
    );
  };

  const removeItem = (indexToRemove) => {
    setContents((prevContents) =>
      prevContents.filter((_, index) => index !== indexToRemove)
    );
  };

  const addNewItem = () => {
    if (currentItem.description.trim() === "") {
      setUploadError("Please enter a description for the item");
      return;
    }

    setContents((prevContents) => [...prevContents, { ...currentItem }]);
    setCurrentItem({
      imageUrl: "",
      description: "",
      style: "",
      size: "",
      color: "",
      quantity: 0,
      price: 0.0,
    });
    setNewItemOpen(false);
  };

  const cancelNewItem = () => {
    setCurrentItem({
      imageUrl: "",
      description: "",
      style: "",
      size: "",
      color: "",
      quantity: 0,
      price: 0.0,
    });
    setNewItemOpen(false);
  };

  const itemTotal = () => {
    const total = contents.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.price;
      }, 0).toFixed(2)

    const discount = total * boxDiscount * 0.01;
    const boxPrice = total - discount;

    return {total: total, discount: discount, boxPrice: boxPrice}
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!boxName || !boxDiscount || !boxDescription || !boxLocation || !imageUrl || contents.length < 1) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createSaleBox();
      if (success) {
        // Clear form
        setBoxName("")
        setBoxDescription("");
        setBoxDiscount(20);
        setBoxLocation("");
        setImageUrl("");

        // Notify parent component to refresh the list
        if (onOverstockAdded) {
          onOverstockAdded();
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

  async function createSaleBox() {
    try {
      const itemData = {
        name: boxName,
        description: boxDescription,
        discount: boxDiscount,
        location: boxLocation,
        imageLink: imageUrl,
        contents: contents,
      };

      const response = await fetch("/api/saleItems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Box created successfully:", data.data);
        console.log("Message:", data.message);
        return true;
      } else {
        console.error("Error creating box:", data.error);
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
      <div
        className={`${styles.overlay} ${styles.overlayLg}`}
        onClick={handleModalClick}
      >
        <div className={styles.title} style={{ marginBottom: "30px" }}>
          Add Box to Store
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
            <div className={styles.formInput} style={{ flexGrow: 1 }}>
              <label>Box Name</label>
              <input
                className={styles.input}
                value={boxName}
                onChange={(e) => setBoxName(e.target.value)}
                required
              />
            </div>
            <div className={styles.formInput} style={{ width: "10%" }}>
              <label>Discount</label>
              <input
                className={styles.input}
                onChange={(e) =>
                  setBoxDiscount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                value={`${boxDiscount}%`}
                required
              />
            </div>
            <div className={styles.formInput} style={{ width: "20%" }}>
              <label>Location</label>
              <input
                className={styles.input}
                onChange={(e) => setBoxLocation(e.target.value)}
                value={boxLocation}
                required
              />
            </div>
          </div>
          <div className={styles.formInput}>
            <label>Box Description</label>
            <textarea
              className={styles.input}
              style={{ resize: "vertical", minHeight: "80px" }}
              onChange={(e) => setBoxDescription(e.target.value)}
              value={boxDescription}
              required
            />
          </div>
          <div className={styles.formInput}>
            <label>Image</label>
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, "box")}
                className={styles.fileInput}
                id="file-upload"
              />
              <label htmlFor="file-upload" className={styles.fileLabel}>
                <FaUpload /> Choose Image File
              </label>
            </div>
            {imageUrl && (
              <div className={styles.imagePreview}>
                <div style={{ position: "relative" }}>
                  <img
                    src={imageUrl}
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
              </div>
            )}
            <div className={styles.formInput}>
              <label>Box Inventory</label>
              <table style={{ width: "100%", textAlign: "left" }}>
                <thead>
                  <tr className={styles.row}>
                    <th className={styles.tableSm}>Image</th>
                    <th className={styles.tableLg}>Description</th>
                    <th className={styles.tableMed}>Style</th>
                    <th className={styles.tableReg}>Size</th>
                    <th className={styles.tableReg}>Color</th>
                    <th className={styles.tableReg}>Quantity</th>
                    <th className={styles.tableReg}>Price</th>
                    <th className={styles.tableTiny}></th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        height: "60px",
                        width: "100%",
                        backgroundColor:
                          index % 2 === 0 ? "#f8f9fa" : "#f4f9ff",
                      }}
                    >
                      <td
                        className={styles.tableSm}
                        style={{ position: "relative" }}
                      >
                        <img
                          src={item.imageUrl}
                          alt={`Item ${index + 1}`}
                          onClick={() => handleThumbnailClick(index)}
                          style={{
                            cursor: "pointer",
                            opacity:
                              selectedItemIndex === index && imageUploading
                                ? 0.5
                                : 1,
                            transition: "opacity 0.2s",
                          }}
                          title="Click to change image"
                        />
                        {selectedItemIndex === index && imageUploading && (
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              color: "#007bff",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            Uploading...
                          </div>
                        )}
                      </td>
                      <td className={styles.tableLg}>
                        <input
                          value={item.description}
                          onChange={(e) =>
                            updateExistingContent(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                      </td>
                      <td className={styles.tableMed}>
                        <input
                          value={item.style}
                          onChange={(e) =>
                            updateExistingContent(
                              index,
                              "style",
                              e.target.value
                            )
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                      </td>
                      <td className={styles.tableReg}>
                        <input
                          value={item.size}
                          onChange={(e) =>
                            updateExistingContent(index, "size", e.target.value)
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                      </td>
                      <td className={styles.tableReg}>
                        <input
                          value={item.color}
                          onChange={(e) =>
                            updateExistingContent(
                              index,
                              "color",
                              e.target.value
                            )
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                      </td>
                      <td className={styles.tableReg}>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateExistingContent(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                      </td>
                      <td className={styles.tableReg}>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateExistingContent(
                              index,
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                      </td>
                      <td className={styles.tableTiny}>
                        <div
                          className={styles.trash}
                          onClick={() => removeItem(index)}
                          style={{ cursor: "pointer" }}
                        >
                          <FaRegTrashAlt />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{ color: "gray", cursor: "pointer" }}
                onClick={() => {
                  newItemOpen && cancelNewItem();
                  setNewItemOpen(!newItemOpen);
                }}
              >
                Add Item to Box Inventory →
              </div>
              {newItemOpen && (
                <div>
                  <table style={{ width: "100%", textAlign: "left" }}>
                    <tbody>
                      <tr
                        style={{
                          height: "60px",
                          width: "100%",
                        }}
                      >
                        <td
                          className={styles.tableSm}
                          style={{ position: "relative" }}
                        >
                          {currentItem.imageUrl !== "" ? (
                            <img
                              src={currentItem.imageUrl}
                              alt="New Item"
                              onClick={handleNewItemThumbnailClick}
                              style={{
                                cursor: "pointer",
                                opacity: imageUploading ? 0.5 : 1,
                                transition: "opacity 0.2s",
                              }}
                              title="Click to change image"
                            />
                          ) : (
                            <div className={styles.uploadSection}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, "content")}
                                className={styles.fileInput}
                                style={{ padding: "none", margin: "none" }}
                                id="file-upload-new"
                              />
                              <label
                                htmlFor="file-upload-new"
                                className={styles.fileLabel}
                              >
                                <FaUpload />
                              </label>
                            </div>
                          )}
                        </td>
                        <td className={styles.tableLg}>
                          <input
                            value={currentItem.description}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                description: e.target.value,
                              })
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                            }}
                          />
                        </td>
                        <td className={styles.tableMed}>
                          <input
                            value={currentItem.style}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                style: e.target.value,
                              })
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                            }}
                          />
                        </td>
                        <td className={styles.tableReg}>
                          <input
                            value={currentItem.size}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                size: e.target.value,
                              })
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                            }}
                          />
                        </td>
                        <td className={styles.tableReg}>
                          <input
                            value={currentItem.color}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                color: e.target.value,
                              })
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                            }}
                          />
                        </td>
                        <td className={styles.tableReg}>
                          <input
                            type="number"
                            value={currentItem.quantity}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                quantity: parseInt(e.target.value) || 0,
                              })
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                            }}
                          />
                        </td>
                        <td className={styles.tableReg}>
                          <input
                            type="number"
                            step="0.01"
                            value={currentItem.price}
                            onChange={(e) =>
                              setCurrentItem({
                                ...currentItem,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                            }}
                          />
                        </td>
                        <td className={styles.tableTiny}>
                          <div
                            className={styles.trash}
                            onClick={addNewItem}
                            style={{ cursor: "pointer" }}
                          >
                            <FaRegSquarePlus />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {uploadError && <div className={styles.error}>{uploadError}</div>}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              marginTop: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", textAlign: "right", fontWeight:"bold", color:"#bdbdbd"}}>
              <div>
                Total Cost:{" $"}
                {itemTotal().total}
              </div>
              <div>
                Discount: -${itemTotal().discount}
              </div>
              <div>
                Discounted Box Price: ${itemTotal().boxPrice}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <button type="button" onClick={onClose} className={styles.button}>
              Cancel
            </button>
            <button type="submit" className={styles.button}>
              Add Box
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function EditStore({ company, onClose, onCompanyEdited }) {
  console.log(company);
  const [companyName, setCompanyName] = useState(company.companyName);
  const [companyImage, setCompanyImage] = useState(company.companyImage);
  const [companyLink, setCompanyLink] = useState(company.companyLink);
  const [privateShop, isPrivateShop] = useState(company.private);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(
    company.companyImage
  );
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

      const response = await fetch("/api/companyStores/uploadImage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImageUrl(result.url);
        setCompanyImage(result.url);
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

  const handleDelete = async (e) => {
    e.preventDefault();
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
  };

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

  async function deleteCompany() {
    try {
      const response = await fetch(`/api/companyStores/${company._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        console.log("Company deleted successfully:", data.message);
        return true;
      } else {
        console.error("Error deleting company:", data.error);
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

            {uploadError && <div className={styles.error}>{uploadError}</div>}
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
          <div
            className={styles.formInput}
            style={{ display: "flex", gap: "10px" }}
          >
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

function overstockItems() {
  const [saleItems, setSaleItems] = useState([]);
  const [addSaleItemOpen, setAddSaleItemOpen] = useState(false);
  const [editAddSaleItemOpen, setEditSaleItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [saleItemOpen, setSaleItemOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return saleItems;
    }

    const searchLower = search.toLowerCase();
    return saleItems.filter((item) => {
      const itemMatch = item.name.toLowerCase().includes(searchLower);

      return itemMatch;
    });
  }, [saleItems, search]);

  useEffect(() => {
    getAllItems();
  }, []);

  const handleItemAdded = () => {
    getAllItems();
  };

  async function getAllItems() {
    try {
      const response = await fetch("/api/saleItems");
      const data = await response.json();

      if (data.success) {
        console.log("Items:", data.data);
        setSaleItems(data.data);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }
  console.log(saleItems);

  return (
    <>
      {addSaleItemOpen && (
        <AddStore
          onClose={() => setAddSaleItemOpen(false)}
          onOverstockAdded={handleItemAdded}
        />
      )}
      {editAddSaleItemOpen && (
        <EditStore
          company={selectedItem}
          onClose={() => setEditSaleItemOpen(false)}
          onCompanyEdited={handleItemAdded}
        />
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Overstock Items</div>
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
              onClick={() => setSaleItemOpen(!saleItemOpen)}
            >
              {saleItemOpen ? "Hide Overstock Items" : "View Overstock Items"}
            </button>
            <button
              className={styles.button}
              onClick={() => setAddSaleItemOpen(true)}
            >
              Add Item
            </button>
          </div>
        </div>
        {saleItemOpen && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "right",
            }}
          >
            <input
              placeholder="Search..."
              className={styles.search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
        )}
        <div className={styles.companies}>
          {saleItemOpen &&
            filteredItems.map((item, index) => (
              <div className={styles.company} key={index}>
                <div className={styles.imageContainer}>
                  <img
                    src={item.imageLink}
                    className={styles.companyImage}
                    alt={item.name}
                  />
                </div>
                <div className={styles.companyName}>{item.name}</div>
                <div
                  className={styles.edit}
                  onClick={() => {
                    setSelectedItem(company);
                    setEditSaleItemOpen(true);
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

export default overstockItems;
