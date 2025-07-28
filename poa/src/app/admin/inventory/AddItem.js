"use client";
import styles from "./inventory.module.css";
import { useState, useEffect } from "react";
import {
  FaRegEdit,
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaDownload
} from "react-icons/fa";
import { FaRegSquarePlus} from "react-icons/fa6";
import { IoIosAddCircle, IoIosCheckmarkCircle } from "react-icons/io";
import jsPDF from 'jspdf';



export default function AddItem({onClose, refresh}) {
  const [page, setPage] = useState("box");
  const [box, setBox] = useState ({})

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
        {page === "box" && <AddBox setPage={setPage} setBox={setBox}/>}
        {page === "qr" && <QrPopup setPage={setPage} box={box}/>}
      </div>
    </div>
  );
}


const QrPopup = ({box}) => {
  const downloadBoxPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 6]
      });
      
      // Title
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Box ${box.boxId}`, 2, 1, { align: 'center' });
      
      pdf.setFontSize(12); 
      pdf.setFont(undefined, 'normal'); 
      pdf.text(`${box.description}`, 2, 1.6, { 
        align: 'center',
        maxWidth: 3.5 
      });
      
      const qrSize = 2;
      const qrX = (4 - qrSize) / 2;
      const qrY = 2.2;
      pdf.addImage(box.qrCode, 'PNG', qrX, qrY, qrSize, qrSize);
      pdf.save(`box-${box.boxId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return(
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px"
    }}>
      <div style={{fontWeight: "bold", fontSize: "32px"}}>
        Box {box.boxId}
      </div>
      <div>
        <img src={box.qrCode} alt={`QR Code for Box ${box.boxId}`} />
      </div>
      <div style={{width: "100%", display: "flex", justifyContent: "end"}}>
        <button className={styles.button} onClick={downloadBoxPDF}>
          <span>Download PDF <FaDownload /></span>
        </button>
      </div>
    </div>
  )
}


const AddBox = ({setPage, setBox}) => {
  const [boxDescription, setBoxDescription] = useState("");
  const [boxLocation, setBoxLocation] = useState("");
  const [contents, setContents] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [minimumPrice, setMinimumPrice] = useState(0);
  /*admin (always clicked), public inventory, sale*/
  const [visibility, setVisibility] = useState(["admin"]);
  const [boxDiscount, setBoxDiscount] = useState(20);
  const [currentItem, setCurrentItem] = useState({
    imageUrl: "",
    description: "",
    style: "",
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

  const handleSubmitBox = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !boxDescription ||
      !boxLocation ||
      !imageUrl ||
      contents.length < 1
      || (visibility.includes("sale") && !(boxDiscount && minimumPrice))
    ) {
      alert("Please fill in all fields and upload an image");
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
        setVisibility(["admin"])

        // Close modal
        setPage("qr")
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
          minPrice: minimumPrice
        }),
        contents: contents
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

      setBox(data.data)
  
      const boxId = data.data._id
  
      for (const content of contents) {
        const itemData = {
          box_id: boxId,
          image: content.imageUrl,
          description: content.description,
          style: content.style,
          color: content.color,
          quantity: content.quantity,
          price: content.price,
          sale: visibility.includes("sale"),
          public: visibility.includes("public")
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
          alert("Error creating item: " + (itemResult.error || "Unknown error"));
          return false;
        }
      }
  
      alert("Box and all items created successfully!");
      return true;
  
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  return(
    <div>
        <div>
            <h2>Add Box to Inventory</h2>
            <form className={styles.form} style={{ marginTop: "30px" }} onSubmit={handleSubmitBox}>
              <div className={styles.formInput} style={{ flexGrow: 1 }}>
                <label>Box Description</label>
                <textarea
                  className={styles.input}
                  style={{ resize: "vertical", minHeight: "90px" }}
                  value={boxDescription}
                  onChange={(e) => setBoxDescription(e.target.value)}
                  required
                />
              </div>
              <div className={styles.horizontal}>
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
                <table
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
                      <th
                        className={styles.tableSm}
                        style={{ fontWeight: "bold" }}
                      >
                        Image
                      </th>
                      <th
                        className={styles.tableLg}
                        style={{ border: "none", fontWeight: "bold" }}
                      >
                        Description
                      </th>
                      <th
                        className={styles.tableMed}
                        style={{ border: "none", fontWeight: "bold" }}
                      >
                        Style
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
                        Price
                      </th>
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
                            index % 2 === 0 ? "#dae2eb" : "#ccd5e0",
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
                  style={{ color: "gray", cursor: "pointer", display: "flex", flexDirection: "row", gap: "15px", alignItems: "center", justifyContent: "center"}}
                  onClick={() => {
                    newItemOpen && cancelNewItem();
                    setNewItemOpen(!newItemOpen);
                  }}
                >
                  <IoIosAddCircle style={{color: "green", fontSize: "30px"}}/>
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
                            style={{
                              position: "relative",
                              width:
                                currentItem.imageUrl !== "" ? "50px" : "150px",
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
                                  onChange={(e) =>
                                    setImageUrlInput(e.target.value)
                                  }
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
                                    onChange={(e) =>
                                      handleFileSelect(e, "content")
                                    }
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
                                  <FaLink />
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
                              className={`${styles.trash} ${styles.add}`}
                              onClick={addNewItem}
                              style={{ cursor: "pointer", fontSize: "25px"}}
                            >
                              <IoIosCheckmarkCircle />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className={styles.formInput}>
                <label>Visibility</label>
                <div
                  style={{ display: "flex", flexDirection: "row", gap: "20px" }}
                >
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
              {
                visibility.includes("sale") && 
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
              }
              {uploadError && <div className={styles.error}>{uploadError}</div>}
              <div style={{width: "100%", display: "flex", justifyContent: "end"}}>
                <button className={styles.button}>
                    Upload & Finalize
                </button>

              </div>
            </form>
          </div>
    </div>

  )

}