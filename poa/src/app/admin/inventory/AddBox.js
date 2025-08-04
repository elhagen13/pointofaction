"use client";
import styles from "./inventory.module.css";
import { useState, useEffect } from "react";
import {
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaDownload,
  FaRegCopy,
} from "react-icons/fa";
import { IoIosAddCircle, IoIosRemoveCircle, IoIosCheckmarkCircle } from "react-icons/io";

import { CiCircleRemove } from "react-icons/ci";
import jsPDF from "jspdf";

export default function AddItem({ onClose, refresh }) {
  const [page, setPage] = useState("box");
  const [box, setBox] = useState({});

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
        {page === "box" && <AddBox setPage={setPage} setBox={setBox} />}
        {page === "qr" && <QrPopup setPage={setPage} box={box} />}
      </div>
    </div>
  );
}

const QrPopup = ({ box }) => {
  const downloadBoxPDF = async () => {
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

      // Title
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text(`Box ${box.boxId}`, 2, 1, { align: "center" });

      const maxQrY = pageHeight - qrSize - bottomMargin;

      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");
      console.log("new", box.description);
      let description = box.description;
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
          truncatedText =
            truncatedText.substring(0, truncatedText.length - 4) + "...";
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
      pdf.addImage(box.qrCode, "PNG", qrX, currentQrY, qrSize, qrSize);

      pdf.save(`box-${box.boxId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "32px" }}>
        Box {box.boxId}
      </div>
      <div>
        <img src={box.qrCode} alt={`QR Code for Box ${box.boxId}`} />
      </div>
      <div style={{ width: "100%", display: "flex", justifyContent: "end" }}>
        <button className={styles.button} onClick={downloadBoxPDF}>
          <span>
            Download PDF <FaDownload />
          </span>
        </button>
      </div>
    </div>
  );
};

const AddBox = ({ setPage, setBox }) => {
  const [boxDescription, setBoxDescription] = useState("");
  const [boxLocation, setBoxLocation] = useState("");
  const [contents, setContents] = useState([]);
  const [imageUrl, setImageUrl] = useState("https://companystores.s3.us-east-1.amazonaws.com/sale-items/corrugated-cube_52a4bb18-a30d-468d-baa7-61b0c7a2f842.jpg.webp");
  const [minimumPrice, setMinimumPrice] = useState(0);
  /*admin (always clicked), public inventory, sale*/
  const [visibility, setVisibility] = useState(["admin"]);
  const [boxDiscount, setBoxDiscount] = useState(20);
  const [currentItem, setCurrentItem] = useState({
    imageUrl: "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
    description: "",
    style: "",
    brand: "",
    size: "",
    color: "",
    quantity: 0,
    price: 0.0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  let acknowledgement = false;

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

  const handleUrlSubmit = (type, itemIndex = null) => {
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

    if (type === "content" && itemIndex !== null) {
      // Update specific item's image
      setContents((prevContents) =>
        prevContents.map((item, index) =>
          index === itemIndex ? { ...item, imageUrl: imageUrlInput } : item
        )
      );
    } else if (type === "content") {
      // Update current item being added
      setCurrentItem({
        ...currentItem,
        imageUrl: imageUrlInput,
      });
    } else {
      // Update box image
      setImageUrl(imageUrlInput);
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
    setShowUrlInput(true);
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
  const copyItem = (indexToCopy) => {
    const itemToCopy = contents[indexToCopy];
    setContents([...contents, itemToCopy]);
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
      brand: "",
      size: "",
      color: "",
      quantity: 0,
      price: 0.0,
    });
    setNewItemOpen(false);
    acknowledgement = false;
  };

  const cancelNewItem = () => {
    setCurrentItem({
      imageUrl: "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
      description: "",
      style: "",
      brand: "",
      size: "",
      color: "",
      quantity: 0,
      price: 0.0,
    });
    setNewItemOpen(false);
  };

  const handleSubmitBox = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !boxDescription ||
      !imageUrl ||
      !boxLocation ||
      contents.length < 1 ||
      (visibility.includes("sale") && !(boxDiscount && minimumPrice))
    ) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    for (const item of contents) {
      if (
        !item.description ||
        !item.style ||
        !item.size ||
        !item.brand ||
        !item.color ||
        !item.quantity ||
        !item.price
      ) {
        alert("One of the items in the box is missing a field");
        return;
      }
    }

    if (
      !acknowledgement &&
      (currentItem.color ||
        currentItem.description ||
        currentItem.price ||
        currentItem.brand || 
        currentItem.quantity ||
        currentItem.size ||
        currentItem.style)
    ) {
      alert(
        "Warning: New item not finalized, click the checkmark to the right of the item to add."
      );
      acknowledgement = true;
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await uploadBox();
      if (success) {
        // Clear form
        setBoxDescription("");
        setBoxDiscount(20);
        setBoxLocation("");
        setImageUrl("");
        setContents([]);
        setVisibility(["admin"]);

        // Close modal
        setPage("qr");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    console.log(visibility);
  }, [visibility]);

  async function uploadBox() {
    try {
      const boxData = {
        imageLink: imageUrl,
        location: boxLocation,
        description: boxDescription,
        ...(visibility.includes("sale") && {
          discount: boxDiscount,
          minPrice: minimumPrice,
        }),
        contents: contents,
      };

      // Create the box first
      const boxResponse = await fetch("/api/inventory/box", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(boxData),
      });

      const data = await boxResponse.json();

      if (!data.success) {
        console.error("Error creating box:", data.error);
        console.error("Details:", data.details);
        alert("Error creating box: " + (data.error || "Unknown error"));
        return false;
      }

      console.log("Box created successfully:", data.data);
      console.log("Message:", data.message);

      setBox(data.data);

      const boxId = data.data._id;

      for (const content of contents) {
        const itemData = {
          box_id: boxId,
          image: content.imageUrl,
          description: content.description,
          style: content.style,
          brand: content.brand,
          size: content.size,
          color: content.color,
          quantity: content.quantity,
          price: content.price,
          sale: visibility.includes("sale"),
          public: visibility.includes("public"),
        };

        const itemResponse = await fetch("/api/inventory/item", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData), // Fixed: was boxData
        });

        const itemResult = await itemResponse.json();

        if (itemResult.success) {
          console.log("Item created successfully:", itemResult.data);
          console.log("Message:", itemResult.message);
        } else {
          console.error("Error creating item:", itemResult.error);
          console.error("Details:", itemResult.details);
          alert(
            "Error creating item: " + (itemResult.error || "Unknown error")
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  const generateDescription = (e) => {
    e.preventDefault();

    let retString = "";

    contents.forEach((item) => {
      retString =
        retString +
        "• " +
        item.size +
        " " +
        item.color +
        " " +
        item.description +
        " (" +
        item.style +
        ")\n";
    });

    setBoxDescription(retString);
  };

  return (
    <div style={{ overflowX: "scroll", color: "black" }}>
      <div>
        <h2>Add Box to Inventory</h2>
        <form className={styles.form} style={{ marginTop: "30px" }}>
          <div className={styles.formInput} style={{ flexGrow: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label>Box Description</label>
              <button
                className={styles.button}
                onClick={(e) => generateDescription(e)}
                style={{
                  padding: "2px 10px",
                  minHeight: "0",
                  backgroundColor: "white",
                  border: "1px solid green",
                  color: "green",
                }}
              >
                Autogenerate Description
              </button>
            </div>
            <textarea
              className={styles.input}
              style={{ resize: "vertical", minHeight: "90px" }}
              value={boxDescription}
              onChange={(e) => setBoxDescription(e.target.value)}
              required
            />
          </div>
          <div className={styles.imageAndLocation}>
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
            </div>
            <div className={styles.formInput}>
              <label>Box Location</label>
              <input
                className={styles.input}
                value={boxLocation}
                onChange={(e) => setBoxLocation(e.target.value)}
                required
              />
            </div>
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
            <div style={{width:"100%", maxWidth: "100%", overflowX: "auto"}}>
            <table
              className={styles.boxTable}
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
                    Code
                  </th>
                  <th
                    className={styles.tableReg}
                    style={{ border: "none", fontWeight: "bold" }}
                  >
                    Brand
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contents.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      height: "60px",
                      width: "100%",
                      backgroundColor: index % 2 === 0 ? "#dae2eb" : "#ccd5e0",
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
                    <td className={styles.tableReg}>
                      <input
                        value={item.style}
                        onChange={(e) =>
                          updateExistingContent(index, "style", e.target.value)
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
                        value={item.brand}
                        onChange={(e) =>
                          updateExistingContent(index, "style", e.target.value)
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
                          updateExistingContent(index, "color", e.target.value)
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
                        value={item.quantity}
                        onChange={(e) =>
                          updateExistingContent(
                            index,
                            "quantity",
                            parseInt(e.target.value) || ""
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
                        type="text"
                        pattern="^\d*\.?\d*$"
                        inputMode="decimal"
                        value={item.price}
                        onChange={(e) =>
                          updateExistingContent(index, "price", e.target.value)
                        }
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value);
                          updateExistingContent(
                            index,
                            "price",
                            isNaN(numValue) ? 0 : numValue.toFixed(2)
                          );
                        }}
                        className={styles.input}
                        style={{
                          margin: 0,
                          minHeight: "auto",
                          width: "100%",
                        }}
                      />
                    </td>
                    <td style={{display:"flex", flexDirection:"row", justifyContent:"center", alignItems:"center", width:"100%", height:"60px", gap:"20px"}}>
                      <div
                        onClick={() => copyItem(index)}
                        style={{ cursor: "pointer" }}
                      >
                        <FaRegCopy />
                        </div>

                        <div
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
            </div>
            <div
              style={{
                color: "gray",
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                gap: "15px",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                newItemOpen && cancelNewItem();
                setNewItemOpen(!newItemOpen);
              }}
            >
              <IoIosAddCircle style={{ color: "green", fontSize: "30px" }} />
            </div>
            {newItemOpen && (
              <div>
                <table
                  style={{ width: "100%", textAlign: "left" }}
                  className={`${styles.boxTable} ${styles.desktopTable}`}
                >
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
                          <div style={{position:"relative"}}>
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
                          <IoIosRemoveCircle style={{position:"absolute", top: "-15px", right:"0px", fontSize:"30px", color:"red"}}
                          onClick={() => setCurrentItem({...currentItem, imageUrl: ""})}/>
                          </div>
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
                                onClick={() => handleUrlSubmit("content")}
                                style={{ padding: "5px" }}
                              >
                                Use
                              </button>
                              <button
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
                      <td className={styles.tableTiny}>
                        <div
                          className={`${styles.trash} ${styles.add}`}
                          onClick={addNewItem}
                          style={{ cursor: "pointer", fontSize: "25px" }}
                        >
                          <IoIosCheckmarkCircle />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/*Mobile Inputs*/}
                <div className={`${styles.mobileTable}`}>
                  <div className={styles.mobileRow}>
                    <div className={styles.mobileField}>
                      <label className={styles.mobileLabel}>Image</label>
                      <div className={styles.mobileValue}>
                        {currentItem.imageUrl !== "" ? (
                          <div style={{position:"relative", width:"auto"}}>
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
                          <IoIosRemoveCircle style={{position:"absolute", top: "-15px", right:"-15px", fontSize:"30px", color:"red"}}
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
                      <label className={styles.mobileLabel}>Style</label>
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
                    <div
                          className={`${styles.trash} ${styles.add}`}
                          onClick={addNewItem}
                          style={{ cursor: "pointer", fontSize: "25px" }}
                        >
                          <IoIosCheckmarkCircle />
                        </div>
                  </div>
                </div>
              </div>
            )}
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
                />
                <label for="radio1" style={{ marginLeft: "5px" }}>
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
                <label for="checkbox1" style={{ marginLeft: "5px" }}>
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

                <label for="checkbox2" style={{ marginLeft: "5px" }}>
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
                    setBoxDiscount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  value={`${boxDiscount}%`}
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
            style={{ width: "100%", display: "flex", justifyContent: "end" }}
          >
            <button className={styles.button} onClick={handleSubmitBox}>
              Upload & Finalize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
