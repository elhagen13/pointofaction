"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes, FaRegTrashAlt } from "react-icons/fa";
import { FaRegSquarePlus } from "react-icons/fa6";

function AddOverstock({ onClose, onOverstockAdded }) {
  const [boxName, setBoxName] = useState("");
  const [boxDescription, setBoxDescription] = useState("");
  const [minimumPrice, setMinimumPrice] = useState(0)
  /*admin (always clicked), public inventory, sale*/
  const [visibility, setVisibility] = useState("private")
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
  const [contents, setContents] = useState([]);
  const [page, setPage] = useState("box");
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
    if(page === "box"){
    const total = contents
      .reduce((accumulator, currentValue) => {
        return accumulator + currentValue.price * currentValue.quantity;
      }, 0)
      .toFixed(2);

    const discount = (total * boxDiscount * 0.01).toFixed(2);
    const boxPrice = (total - discount).toFixed(2);


    return { total: total, discount: discount, boxPrice: boxPrice };
    }

    return {total : currentItem.price * currentItem.quantity, individualPrice: currentItem.price}
  };

  const switchPage = () => {
    setCurrentItem({
      imageUrl: "",
      description: "",
      style: "",
      size: "",
      color: "",
      quantity: 0,
      price: 0.0,
    })
    setBoxLocation("")
    setPage(page === "box" ? "item" : "box")
  }

  const handleSubmitBox = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !boxName ||
      !boxDiscount ||
      !boxDescription ||
      minimumPrice === ""  || 
      !boxLocation ||
      !imageUrl ||
      contents.length < 1
    ) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createSaleBox();
      if (success) {
        // Clear form
        setBoxName("");
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

  const handleSubmitItem = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !currentItem.color ||
      !currentItem.description ||
      !currentItem.imageUrl ||
      currentItem.price <= 0 ||
      currentItem.quantity <= 0 ||
      !currentItem.style || 
      !boxLocation

    ) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createSaleItem();
      if (success) {
        // Clear form
        setCurrentItem({
          imageUrl: "",
          description: "",
          style: "",
          size: "",
          color: "",
          quantity: 0,
          price: 0.0,
              })

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


  async function createSaleItem(){
    try {
      const itemData = {
        type: page,
        imageUrl: currentItem.imageUrl,
        description: currentItem.description,
        style: currentItem.style,
        size: currentItem.size,
        color: currentItem.color,
        quantity: currentItem.quantity,
        price: currentItem.price,
        location: boxLocation
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
        console.log("Item created successfully:", data.data);
        console.log("Message:", data.message);
        return true;
      } else {
        console.error("Error creating item:", data.error);
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

  async function createSaleBox() {
    try {
      const itemData = {
        type: page,
        name: boxName,
        minPrice: minimumPrice,
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
        {page === "box" ? (
          <div>
            <div className={styles.title} style={{ marginBottom: "10px" }}>
              Add Box to Store
            </div>
            <div
              onClick={switchPage}
              style={{
                marginBottom: "30px",
                fontWeight: "bold",
                color: "grey",
                cursor: "pointer",
              }}
            >
              switch to Add Item →
            </div>
            <form onSubmit={handleSubmitBox}>
              <div
                style={{ display: "flex", flexDirection: "row", gap: "10px" }}
              >
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
                  <label>Min. Purchase</label>
                  <input
                    className={styles.input}
                    onChange={(e) =>
                      setMinimumPrice(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    value={`$${minimumPrice}`}
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
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr className={styles.row} style={{ backgroundColor:"#f0f0f0"}}>
                        <th className={styles.tableSm} >Image</th>
                        <th className={styles.tableLg}style={{ border: "none"}}>Description</th>
                        <th className={styles.tableMed} style={{ border: "none"}}>Style</th>
                        <th className={styles.tableReg} style={{ border: "none"}}>Size</th>
                        <th className={styles.tableReg} style={{ border: "none"}}>Color</th>
                        <th className={styles.tableReg} style={{ border: "none"}}>Quantity</th>
                        <th className={styles.tableReg} style={{ border: "none"}}>Price</th>
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
                                updateExistingContent(
                                  index,
                                  "size",
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
                                    onChange={(e) =>
                                      handleFileSelect(e, "content")
                                    }
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
                {uploadError && (
                  <div className={styles.error}>{uploadError}</div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#bdbdbd",
                  }}
                >
                  <div>
                    Total Cost:{" $"}
                    {itemTotal().total}
                  </div>
                  <div>Discount: -${itemTotal().discount}</div>
                  <div>Discounted Box Price: ${itemTotal().boxPrice}</div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.button}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.button}>
                  Add Box
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className={styles.title} style={{ marginBottom: "10px" }}>
              Add Item to Store
            </div>
            <div
              onClick={switchPage}
              style={{
                marginBottom: "30px",
                fontWeight: "bold",
                color: "grey",
                cursor: "pointer",
              }}
            >
              switch to Add Box →
            </div>
            <form onSubmit={handleSubmitItem}>
              <div className={styles.formInput}>
                <div className={styles.formInput}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse"}}>
                    <thead>
                      <tr className={styles.row} style={{ backgroundColor:"#f0f0f0"}}>
                        <th className={styles.tableSm}>Image</th>
                        <th className={styles.tableLg}>Description</th>
                        <th className={styles.tableReg}>Style</th>
                        <th className={styles.tableReg}>Size</th>
                        <th className={styles.tableReg}>Color</th>
                        <th className={styles.tableReg}>Quantity</th>
                        <th className={styles.tableReg}>Price</th>
                        <th className={styles.tableReg}>Location</th>
                      </tr>
                    </thead>
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
                                    onChange={(e) =>
                                      handleFileSelect(e, "content")
                                    }
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
                            <td className={styles.tableReg}>
                              <input
                                value={boxLocation}
                                onChange={(e) =>
                                  setBoxLocation(e.target.value)
                                }
                                className={styles.input}
                                style={{
                                  margin: 0,
                                  minHeight: "auto",
                                  width: "100%",
                                }}
                              />
                            </td>
                          </tr>
                        </tbody>
                  </table>        
                </div>
                {uploadError && (
                  <div className={styles.error}>{uploadError}</div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#bdbdbd",
                  }}
                >
                  <div>
                    Unit Price:{" $"}
                    {itemTotal().individualPrice}
                  </div>
                  <div>
                    Total Cost:{" $"}
                    {itemTotal().total}
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
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.button}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.button}>
                  Add {page === "box" ? "Box" : "Item"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
function EditOverstock({ overstock, onClose, onOverstockEdited }) {
  const [boxName, setBoxName] = useState(overstock.name || "");
  const [boxDescription, setBoxDescription] = useState(overstock.itemDescription || "");
  const [minimumPrice, setMinimumPrice] = useState(overstock.minPrice || 0)
  const [boxDiscount, setBoxDiscount] = useState(overstock.discount || 20);
  const [boxLocation, setBoxLocation] = useState(overstock.location || "");
  const [imageUrl, setImageUrl] = useState(overstock.imageLink || "");
  const [currentItem, setCurrentItem] = useState({
    imageUrl: overstock.contents ? "" : overstock.imageLink,
    description: overstock.contents ? "" : overstock.itemDescription,
    style: overstock.contents ? "" : overstock.style,
    size: overstock.contents ? "" : overstock.size,
    color: overstock.contents ? "" : overstock.color,
    quantity: overstock.contents ? 0 : overstock.quantity,
    price: overstock.contents ? 0 : overstock.price,
  });
  const [contents, setContents] = useState(overstock.contents || []);
  const [page, setPage] = useState(overstock.name ? "box" : "item");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [newItemOpen, setNewItemOpen] = useState(false);

  // Initialize currentItem for single item editing
  useEffect(() => {
    if (overstock.type === "item") {
      setCurrentItem({
        imageUrl: overstock.imageUrl || "",
        description: overstock.itemDescription || "",
        style: overstock.style || "",
        size: overstock.size || "",
        color: overstock.color || "",
        quantity: overstock.quantity || 0,
        price: overstock.price || 0.0,
      });
    }
  }, [overstock]);

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
      handleUploadImage(file, type, itemIndex);
      setUploadError("");
    }
  };

  const handleUploadImage = async (file, type, itemIndex = null) => {
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
          setContents((prevContents) =>
            prevContents.map((item, index) =>
              index === itemIndex ? { ...item, imageUrl: result.url } : item
            )
          );
        } else if (type === "content") {
          setCurrentItem({
            ...currentItem,
            imageUrl: result.url,
          });
        } else {
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
    if (page === "box") {
      const total = contents
        .reduce((accumulator, currentValue) => {
          return accumulator + currentValue.price * currentValue.quantity;
        }, 0)
        .toFixed(2);

      const discount = (total * boxDiscount * 0.01).toFixed(2);
      const boxPrice = (total - discount).toFixed(2);

      return { total: total, discount: discount, boxPrice: boxPrice };
    }

    return { total: currentItem.price * currentItem.quantity, individualPrice: currentItem.price };
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const success = await deleteSaleItem();
      if (success) {
        if (onOverstockEdited) {
          onOverstockEdited();
        }
        onClose();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    switch(page){
      case "box":
        if (
          !boxName ||
          !boxDiscount ||
          minimumPrice == "" || 
          !boxDescription ||
          !boxLocation ||
          !imageUrl ||
          contents.length < 1
        ) {
          alert("Please fill in all fields and upload an image");
          return;
        }
        break;
      case "item":
        if(
          !currentItem.imageUrl ||
          !currentItem.description ||
          !currentItem.style ||
          !currentItem.color || 
          !currentItem.quantity ||
          !currentItem.price
        )
        {
          alert("Please fill in all fields and upload an image");
          return;
        }
        break;
    }

    setIsSubmitting(true);

    try {
      let success = null;
      if(page == "box"){
        success = updateSaleBox();
      }
      else{
        success = updateSaleItem();
      }

      if (success) {
        console.log("success")
        
         await onOverstockEdited();
         await onOverstockEdited();

        // Close modal
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  async function updateSaleItem() {
    try {
      const itemData = {
        type: page,
        imageLink: currentItem.imageUrl,
        itemDescription: currentItem.description,
        style: currentItem.style,
        size: currentItem.size,
        color: currentItem.color,
        quantity: currentItem.quantity,
        price: currentItem.price,
        location: boxLocation,
      };

      const response = await fetch(`/api/saleItems/${overstock._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Item updated successfully:", data.data);
        return true;
      } else {
        console.error("Error updating item:", data.error);
        alert("Error updating item: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  async function updateSaleBox() {
    
    try {
      const itemData = {
        type: page,
        name: boxName,
        minPrice: minimumPrice,
        itemDescription: boxDescription,
        discount: boxDiscount,
        location: boxLocation,
        imageLink: imageUrl,
        contents: contents,
      };

      const response = await fetch(`/api/saleItems/${overstock._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Box updated successfully:", data.data);
        return true;
      } else {
        console.error("Error updating box:", data.error);
        alert("Error updating box: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  async function deleteSaleItem() {
    try {
      const response = await fetch(`/api/saleItems/${overstock._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        console.log("Item deleted successfully");
        return true;
      } else {
        console.error("Error deleting item:", data.error);
        alert("Error deleting item: " + (data.error || "Unknown error"));
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
        {overstock.name ? (
          <div>
            <div className={styles.title} style={{ marginBottom: "10px" }}>
              Edit Box
            </div>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "row", gap: "10px" }}
              >
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
                  <label>Min. Purchase</label>
                  <input
                    className={styles.input}
                    onChange={(e) =>
                      setMinimumPrice(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    value={`$${minimumPrice}`}
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
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr className={styles.row} style={{ backgroundColor:"#f0f0f0"}}>
                        <th className={styles.tableSm} style={{ border: "none" }}>Image</th>
                        <th className={styles.tableLg} style={{ border: "none" }}>Description</th>
                        <th className={styles.tableMed} style={{ border: "none" }}>Style</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Size</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Color</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Quantity</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Price</th>
                        <th className={styles.tableTiny} style={{ border: "none" }}></th>
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
                            style={{ position: "relative", border: "none" }}
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
                          <td className={styles.tableLg} style={{ border: "none" }}>
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
                          <td className={styles.tableMed} style={{ border: "none" }}>
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
                          <td className={styles.tableReg} style={{ border: "none" }}>
                            <input
                              value={item.size}
                              onChange={(e) =>
                                updateExistingContent(
                                  index,
                                  "size",
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
                          <td className={styles.tableReg} style={{ border: "none" }}>
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
                          <td className={styles.tableReg} style={{ border: "none" }}>
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
                          <td className={styles.tableReg} style={{ border: "none" }}>
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
                          <td className={styles.tableTiny} style={{ border: "none" }}>
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
                      <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr
                            style={{
                              height: "60px",
                              width: "100%",
                            }}
                          >
                            <td
                              className={styles.tableSm}
                              style={{ position: "relative", border: "none" }}
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
                                    onChange={(e) =>
                                      handleFileSelect(e, "content")
                                    }
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
                            <td className={styles.tableLg} style={{ border: "none" }}>
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
                            <td className={styles.tableMed} style={{ border: "none" }}>
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
                            <td className={styles.tableReg} style={{ border: "none" }}>
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
                            <td className={styles.tableReg} style={{ border: "none" }}>
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
                            <td className={styles.tableReg} style={{ border: "none" }}>
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
                            <td className={styles.tableReg} style={{ border: "none" }}>
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
                            <td className={styles.tableTiny} style={{ border: "none" }}>
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
                {uploadError && (
                  <div className={styles.error}>{uploadError}</div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#bdbdbd",
                  }}
                >
                  <div>
                    Total Cost: ${itemTotal().total}
                  </div>
                  <div>Discount: -${itemTotal().discount}</div>
                  <div>Discounted Box Price: ${itemTotal().boxPrice}</div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.button}
                >
                  Cancel
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`${styles.button} ${styles.delete}`}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                  <button 
                    type="submit" 
                    className={styles.button}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Box"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className={styles.title} style={{ marginBottom: "10px" }}>
              Edit Item
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formInput}>
                <div className={styles.formInput}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr className={styles.row} style={{ backgroundColor:"#f0f0f0"}}>
                        <th className={styles.tableSm} style={{ border: "none" }}>Image</th>
                        <th className={styles.tableLg} style={{ border: "none" }}>Description</th>
                        <th className={styles.tableMed} style={{ border: "none" }}>Style</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Size</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Color</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Quantity</th>
                        <th className={styles.tableReg} style={{ border: "none" }}>Price</th>
                      </tr>
                    </thead>
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
                                    onChange={(e) =>
                                      handleFileSelect(e, "content")
                                    }
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
                          </tr>
                        </tbody>
                  </table>
                </div>
                </div>
                </form>
                <div
                style={{
                  display: "flex",
                  justifyContent: "end",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#bdbdbd",
                  }}
                >
                   <div>
                    Unit Price:{" $"}
                    {itemTotal().individualPrice}
                  </div>
                  <div>
                    Total Cost:{" $"}
                    {itemTotal().total}
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
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.button}
                >
                  Cancel
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`${styles.button} ${styles.delete}`}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                  <button 
                    type="submit" 
                    className={styles.button}
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "Updating..." : "Update Item"}
                  </button>
                </div>
              </div>
                </div>)
}</div></div>
)}

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
      const itemMatch = item.name?.toLowerCase().includes(searchLower)
      || item.itemDescription?.toLowerCase().includes(searchLower)
      || item.color?.toLowerCase().includes(searchLower) 
     

      return itemMatch;
    });
  }, [saleItems, search]);

  useEffect(() => {
    getAllItems();
  }, []);


  const handleItemAdded = async () => {
    try {
      const response = await fetch("/api/saleItems");
      const data = await response.json();
      if (data.success) {
        setSaleItems(data.data);
      }
    } catch (error) {
      console.error("Error refreshing items:", error);
    }
  };

  async function getAllItems() {
    console.log("entered")
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
        <AddOverstock
          onClose={() => setAddSaleItemOpen(false)}
          onOverstockAdded={handleItemAdded}
        />
      )}
      {editAddSaleItemOpen && (
        <EditOverstock
          overstock={selectedItem}
          onClose={() => setEditSaleItemOpen(false)}
          onOverstockEdited={handleItemAdded}
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
                <div className={styles.companyName}>{item.name ?? item.itemDescription}</div>
                <div
                  className={styles.edit}
                  onClick={() => {
                    setSelectedItem(item);
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
