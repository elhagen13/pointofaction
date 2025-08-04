"use client";
import styles from "./inventory.module.css";
import { useState, useEffect } from "react";
import {
  FaUpload,
  FaTimes,
  FaLink,
  FaDownload,
  FaBox,
  FaBoxOpen,
} from "react-icons/fa";
import { IoIosRemoveCircle} from "react-icons/io";

import jsPDF from "jspdf";


export default function EditItem({ item, onClose, refresh, boxes, items }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      refresh();
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
        <Edit item={item} onClose={onClose} refresh={refresh} boxes={boxes} items={items}/>
      </div>
    </div>
  );
}

const Edit = ({ item, onClose, refresh, boxes, items }) => {
  const [location, setLocation] = useState(item.location);
  const [minimumPrice, setMinimumPrice] = useState(item.minPrice || 0);
  const [visibility, setVisibility] = useState(["admin"]);
  const [discount, setDiscount] = useState(item.discount || 20);
  const [currentItem, setCurrentItem] = useState({
    imageUrl: item.image,
    description: item.description,
    style: item.style,
    brand: item.brand,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    price: item.price,
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [box, setBox] = useState(null);
  
  const [boxDict, setBoxDict] = useState({})

  useEffect(() => {
    let tempDict = {}
    for(const item of items){
      if(item.boxId && !tempDict[item.boxId]){
        tempDict[item.boxId] = {
          sale: item.sale,
          public: item.public
        }
      }
    }
    setBoxDict(tempDict)
  }, [items])

  useEffect(() => {
    const newVisibility = [];
    if (item.public) newVisibility.push("public");
    if (item.sale) newVisibility.push("sale");
    setVisibility(newVisibility);
  }, [item]);

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

  const handleUrlSubmit = (type) => {
    if (!imageUrlInput.trim()) {
      setUploadError("Please enter a valid URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrlInput);
    } catch (e) {
      setUploadError("Please enter a valid URL");
      return;
    }

    if (type === "content") {
      setCurrentItem({
        ...currentItem,
        imageUrl: imageUrlInput,
      });
    }

    setImageUrlInput("");
    setShowUrlInput(false);
    setUploadError("");
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
      const response = await fetch("/api/inventory/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        if (type === "content") {
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
    }
  };

  // Handle clicking on new item thumbnail
  const handleNewItemThumbnailClick = (e) => {
    e.preventDefault();
    console.log("hello");
    setShowUrlInput(true);
  };

  const submitItem = async (e) => {
    e.preventDefault(); // Prevent form submission
    await submitDb();
  };

  const submitDb = async () => {
    // Validate required fields
    if (!currentItem.description.trim()) {
      setUploadError("Please enter a description for the item");
      return false;
    }

    if (!location.trim()) {
      setUploadError("Please enter an item location");
      return false;
    }

    const itemData = {
      image: currentItem.imageUrl,
      description: currentItem.description,
      style: currentItem.style,
      brand: currentItem.brand,
      size: currentItem.size,
      color: currentItem.color,
      quantity: currentItem.quantity,
      price: currentItem.price,
      sale: visibility.includes("sale"),
      public: visibility.includes("public"),
    };

    if (visibility.includes("sale") && !box) {
      itemData.discount = discount;
      itemData.minPrice = minimumPrice;
    }
    console.log(boxDict)

    if(box){
      itemData.box_id = box
      itemData.sale = boxDict[box].sale
      itemData.public = boxDict[box].public

    }
    else{
      itemData.location = location
    }

    try {
      const itemResponse = await fetch(`/api/inventory/item/${item._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const itemResult = await itemResponse.json();

      if (itemResult.success) {
        console.log("Item edited successfully:", itemResult.data);
        console.log("Message:", itemResult.message);
        alert("Item edited successfully!");

        // Reset form
        setCurrentItem({
          imageUrl: "",
          description: "",
          style: "",
          brand: "",
          size: "",
          color: "",
          quantity: 0,
          price: 0.0,
        });
        setLocation("");
        setUploadError("");

        refresh();
        onClose();
        return true;
      } else {
        console.error("Error creating item:", itemResult.error);
        console.error("Details:", itemResult.details);
        setUploadError(itemResult.error || "Unknown error occurred");
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      setUploadError("Network error: " + error.message);
      return false;
    }
  };

  async function handleDelete(e) {
    e.preventDefault();
    try {
      if (item._id) {
        const itemResponse = await fetch(`/api/inventory/item/${item._id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const itemResult = await itemResponse.json();

        if (!itemResult.success) {
          console.error("Error deleting item:", itemResult.error);
          // Continue deleting other items even if one fails
        }
      }

      alert("Item deleted successfully!");

      // Refresh the inventory and close the modal
      refresh();
      onClose();
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen !== false &&
        !event.target.closest("[data-dropdown]")
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen !== false) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const downloadItemPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: [4, 6],
      });
  
      // Constants
      const pageWidth = 4;
      const pageHeight = 6;
      const qrSize = 2;
      const bottomMargin = 0.5; 
      const textStartY = 1.6;
      const lineHeight = 0.2; 
      
      
      const maxQrY = pageHeight - qrSize - bottomMargin; 
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");
      let description = currentItem.size+ " " + currentItem.color + " " + currentItem.description+ "(" + item.style + ")";
      let currentQrY = 2.2; 
      
      const textLines = pdf.splitTextToSize(description, 3.5);
      const textHeight = textLines.length * lineHeight;
      const idealQrY = textStartY + textHeight + 0.3; 
      
      // If QR would go past bottom, truncate text
      if (idealQrY + qrSize > pageHeight - bottomMargin) {
        const availableHeight = maxQrY - textStartY - 0.3; 
        const maxLines = Math.floor(availableHeight / lineHeight);
        
        // Truncate text to fit
        let truncatedText = description;
        let truncatedLines = pdf.splitTextToSize(truncatedText, 3.5);
        
        while (truncatedLines.length > maxLines && truncatedText.length > 0) {
          truncatedText = truncatedText.substring(0, truncatedText.length - 4) + "...";
          truncatedLines = pdf.splitTextToSize(truncatedText, 3.5);
        }
        
        description = truncatedText;
        currentQrY = maxQrY;
      } else {
        currentQrY = idealQrY;
      }
      
      pdf.text(description, 2, textStartY, {
        align: "center",
        maxWidth: 3.5,
      });
      
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(item.qrCode, "PNG", qrX, currentQrY, qrSize, qrSize);
      
      pdf.save(`item-${item.description}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };


  return (
    <div style={{ overflowX: "scroll", color: "black" }}>
      <div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h2>Edit Item</h2>
          <div style={{ display: "flex", gap: !box ? "16px": "20px", position: "relative" }}>
            {item.qrCode ? <FaDownload style={{ cursor: "pointer" }} onClick={downloadItemPDF}/> : ""}
            {
              !box ? 
              <FaBoxOpen
              style={{ cursor: "pointer", fontSize:"20px" }}
              onClick={() => setIsDropdownOpen(true)}
              data-dropdown
            />
            :
              <FaBox
              style={{ cursor: "pointer" }}
              onClick={() => setIsDropdownOpen(true)}
              data-dropdown
            />
            
            }
            
            {isDropdownOpen && (
              <div className={styles.dropdown} data-dropdown>
                {" "}
                <div
                  key="removed"
                  className={`${styles.dropdownItem} ${!box ? styles.selected : ""}`}
                  onClick={() => setBox(null)}
                  data-dropdown
                >
                  No Box
                </div>
                {boxes.map((b, boxIndex) => (
                  <div
                    key={boxIndex}
                    className={`${styles.dropdownItem} ${
                      b._id === box ? styles.selected : ""
                    }`}
                    onClick={() => {
                      setBox(b._id);
                    }}
                    data-dropdown
                  >
                    {b.boxId}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <form
          className={styles.form}
          style={{ marginTop: "30px" }}
          onSubmit={submitItem}
        >
          <div className={styles.imageAndLocation}>
            <div className={styles.formInput}>
              <label>Item Location</label>
              <input
                className={styles.input}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.formInput}>
            <label>Item Details</label>

            {/* Desktop Table View */}
            <table
              className={`${styles.boxTable} ${styles.desktopTable}`}
              style={{
                width: "100%",
                textAlign: "left",
                borderCollapse: "collapse",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr
                  className={styles.row}
                  style={{ backgroundColor: "#ccd5e0" }}
                >
                  <th className={styles.tableSm} style={{ fontWeight: "bold" }}>
                    Image
                  </th>
                  <th
                    className={styles.tableLg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                    Description
                  </th>
                  <th
                    className={styles.tableReg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                    Style Code 
                  </th>
                  <th
                    className={styles.tableReg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                   Brand Style
                  </th>
                  <th
                    className={styles.tableReg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                    Size
                  </th>
                  <th
                    className={styles.tableReg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                    Color
                  </th>
                  <th
                    className={styles.tableReg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                    Quantity
                  </th>
                  <th
                    className={styles.tableReg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                    Unit Price
                  </th>
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
                    style={{
                      position: "relative",
                      width: currentItem.imageUrl !== "" ? "50px" : "150px",
                    }}
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
                    ) : showUrlInput ? (
                      <div>
                        <input
                          type="text"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="url..."
                          className={styles.input}
                          style={{
                            margin: 0,
                            padding: 0,
                            width: "100%",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: "0",
                            top: "0",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleUrlSubmit("content")}
                            style={{ padding: "5px" }}
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className={styles.urlCancelButton}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.uploadOptions}>
                        <div className={styles.uploadSection}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, "content")}
                            className={styles.fileInput}
                            id="file-upload-new"
                          />
                          <label
                            htmlFor="file-upload-new"
                            className={styles.fileLabel}
                            title="Upload from computer"
                          >
                            <FaUpload />
                          </label>
                        </div>
                        <button
                          type="button"
                          className={styles.fileLabel}
                          onClick={handleNewItemThumbnailClick}
                          title="Enter image URL"
                        >
                          <FaLink color="black" />
                        </button>
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
                  <td className={styles.tableReg}>
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
                      value={currentItem.brand}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          brand: e.target.value,
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
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: parseInt(e.target.value) || "",
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
                      type="text"
                      pattern="^\d*\.?\d*$"
                      inputMode="decimal"
                      value={currentItem.price}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          price: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value);
                        setCurrentItem({
                          ...currentItem,
                          price: isNaN(numValue) ? 0 : numValue.toFixed(2),
                        });
                      }}
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

            {/* Mobile Vertical Layout */}
            <div className={`${styles.mobileTable}`}>
              <div className={styles.mobileRow}>
                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Image</label>
                  <div className={styles.mobileValue}>
                    {currentItem.imageUrl !== "" ? (
                      <div style={{position:"relative", width:"auton"}}>
                      <img
                        src={currentItem.imageUrl}
                        alt="New Item"
                        onClick={handleNewItemThumbnailClick}
                        style={{
                          cursor: "pointer",
                          opacity: imageUploading ? 0.5 : 1,
                          transition: "opacity 0.2s",
                          maxWidth: "100px",
                          maxHeight: "100px",
                        }}
                        title="Click to change image"
                      />
                       <IoIosRemoveCircle style={{position:"absolute", top: "-15px", right:"0", fontSize:"30px", color:"red"}}
                          onClick={() => setCurrentItem({...currentItem, imageUrl: ""})}/>
                      </div>
                    ) : showUrlInput ? (
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Enter image URL..."
                          className={styles.input}
                          style={{
                            margin: 0,
                            width: "100%",
                          }}
                        />
                        <div style={{ marginTop: "5px" }}>
                          <button
                            type="button"
                            onClick={() => handleUrlSubmit("content")}
                            style={{ padding: "5px", marginRight: "5px" }}
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className={styles.urlCancelButton}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.uploadOptions}>
                        <div className={styles.uploadSection}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, "content")}
                            className={styles.fileInput}
                            id="file-upload-new-mobile"
                          />
                          <label
                            htmlFor="file-upload-new-mobile"
                            className={styles.fileLabel}
                            title="Upload from computer"
                          >
                            <FaUpload />
                          </label>
                        </div>
                        <button
                          type="button"
                          className={styles.fileLabel}
                          onClick={handleNewItemThumbnailClick}
                          title="Enter image URL"
                        >
                          <FaLink color="black" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Description</label>
                  <div className={styles.mobileValue}>
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
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Style Code</label>
                  <div className={styles.mobileValue}>
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
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Brand Style</label>
                  <div className={styles.mobileValue}>
                    <input
                      value={currentItem.brand}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          brand: e.target.value,
                        })
                      }
                      className={styles.input}
                      style={{
                        margin: 0,
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Size</label>
                  <div className={styles.mobileValue}>
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
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Color</label>
                  <div className={styles.mobileValue}>
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
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Quantity</label>
                  <div className={styles.mobileValue}>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: parseInt(e.target.value) || "",
                        })
                      }
                      className={styles.input}
                      style={{
                        margin: 0,
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Unit Price</label>
                  <div className={styles.mobileValue}>
                    <input
                      type="text"
                      pattern="^\d*\.?\d*$"
                      inputMode="decimal"
                      value={currentItem.price}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          price: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value);
                        setCurrentItem({
                          ...currentItem,
                          price: isNaN(numValue) ? 0 : numValue.toFixed(2),
                        });
                      }}
                      className={styles.input}
                      style={{
                        margin: 0,
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formInput}>
            <label>Visibility</label>
            <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
              <div>
                <input
                  type="radio"
                  id="radio1"
                  name="radioGroup"
                  value="admin"
                  checked
                  readOnly
                />
                <label htmlFor="radio1" style={{ marginLeft: "5px" }}>
                  Admin
                </label>
                <br />
              </div>
              <div>
                <input
                  type="checkbox"
                  id="checkbox1"
                  name="public"
                  value="public"
                  checked={visibility.includes("public")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVisibility([...visibility, "public"]);
                    } else {
                      setVisibility(
                        visibility.filter((item) => item !== "public")
                      );
                    }
                  }}
                />
                <label htmlFor="checkbox1" style={{ marginLeft: "5px" }}>
                  Public
                </label>
                <br />
              </div>

              <div>
                <input
                  type="checkbox"
                  id="checkbox2"
                  name="sale"
                  value="sale"
                  checked={visibility.includes("sale")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVisibility([...visibility, "sale"]);
                    } else {
                      setVisibility(
                        visibility.filter((item) => item !== "sale")
                      );
                    }
                  }}
                />

                <label htmlFor="checkbox2" style={{ marginLeft: "5px" }}>
                  Sale
                </label>
              </div>
            </div>
          </div>
          {visibility.includes("sale") && (
            <div className={styles.horizontal}>
              <div className={styles.formInput}>
                <label>Discount</label>
                <input
                  className={styles.input}
                  onChange={(e) =>
                    setDiscount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  value={`${discount}%`}
                  required
                />
              </div>
              <div className={styles.formInput}>
                <label>Minimum Purchase</label>
                <input
                  className={styles.input}
                  onChange={(e) =>
                    setMinimumPrice(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  value={`$${minimumPrice}`}
                  required
                />
              </div>
            </div>
          )}
          {uploadError && <div className={styles.error}>{uploadError}</div>}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              className={styles.button}
              style={{ backgroundColor: "#a83a32" }}
              onClick={(e) => handleDelete(e)}
            >
              Delete
            </button>
            <button type="submit" className={styles.button}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
