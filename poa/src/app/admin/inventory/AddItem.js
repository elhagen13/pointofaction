"use client";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo } from "react";
import {
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaDownload,
  FaRegCopy,
  FaBookmark,
  FaPlus,
} from "react-icons/fa";
import { IoIosAddCircle, IoIosCheckmarkCircle, IoIosRemoveCircle } from "react-icons/io";
import jsPDF from "jspdf";

export default function AddItem({ onClose, refresh, options }) {
  const [page, setPage] = useState("box");
  const [item, setItem] = useState({});

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
        {page === "box" && <AddBox setPage={setPage} setItem={setItem} refresh={refresh} options={options} />}
        {page === "qr" && <QrPopup setPage={setPage} item={item} />}
      </div>
    </div>
  );
}

const QrPopup = ({ item }) => {
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
      let description = item.description + "(" + item.style + ")";
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
        {item.description} {"("}{item.style}{")"}
      </div>
      <div>
        <img src={item.qrCode} alt={`QR Code for ${item.description}`} />
      </div>
      <div style={{ width: "100%", display: "flex", justifyContent: "end" }}>
        <button className={styles.button} onClick={downloadItemPDF}>
          <span>
            Download PDF <FaDownload />
          </span>
        </button>
      </div>
    </div>
  );
};

const AddBox = ({ setPage, setItem, refresh, options }) => {
  const [location, setLocation] = useState("");
  const [minimumPrice, setMinimumPrice] = useState(0);
  const [visibility, setVisibility] = useState(["admin"]);
  const [discount, setDiscount] = useState(20);
  const [currentItem, setCurrentItem] = useState({
    imageUrl: "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
    description: "",
    descriptionId: null,
    style: "",
    brand: "",
    brandId: null,
    size: "",
    sizeId: null,
    color: "",
    quantity: 0,
    price: 0.0,
    descriptionOpen: false,
    brandOpen: false,
    sizeOpen: false,
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");

  // Create dictionaries for quick lookup
  const descriptionDict = useMemo(() => {
    const dict = {};
    if (!options?.descriptions) return {};
    options.descriptions.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.description.toLowerCase().trim()] = item;
    });
    return dict;
  }, [options]);

  const brandDict = useMemo(() => {
    const dict = {};
    if (!options?.brands) return {};
    options.brands.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.brand.toLowerCase().trim()] = item;
    });
    return dict;
  }, [options]);

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options?.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.size.toLowerCase().trim()] = item;
    });
    return dict;
  }, [options]);

  // Filter options based on search
  const filteredDescriptions = useMemo(() => {
    if (!options?.descriptions) return [];
    if (!descriptionSearch || !descriptionSearch.trim()) {
      return options.descriptions;
    }
    return options.descriptions.filter(desc =>
      desc.description.toLowerCase().includes(descriptionSearch.toLowerCase())
    );
  }, [options?.descriptions, descriptionSearch]);

  const filteredBrands = useMemo(() => {
    if (!options?.brands) return [];
    if (!brandSearch || !brandSearch.trim()) {
      return options.brands;
    }
    return options.brands.filter(brand =>
      brand.brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [options?.brands, brandSearch]);

  const filteredSizes = useMemo(() => {
    if (!options?.sizes) return [];
    if (!sizeSearch || !sizeSearch.trim()) {
      return options.sizes;
    }
    return options.sizes.filter(size =>
      size.size.toLowerCase().includes(sizeSearch.toLowerCase())
    );
  }, [options?.sizes, sizeSearch]);

  const handleFileSelect = (e, type) => {
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

      handleUploadImage(file, type);
      setUploadError("");
    }
  };

  const handleUrlSubmit = (type) => {
    if (!imageUrlInput.trim()) {
      setUploadError("Please enter a valid URL");
      return;
    }

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

  const handleUploadImage = async (file, type) => {
    if (!file) return;
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
        setCurrentItem({
          ...currentItem,
          imageUrl: result.url,
        });
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (error) {
      setUploadError("Network error: " + error.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleNewItemThumbnailClick = (e) => {
    e.preventDefault();
    setShowUrlInput(true);
  };

  const submitItem = async (e) => {
    e.preventDefault();
    await submitDb();
  };

  const submitDb = async () => {
    if (!currentItem.description.trim()) {
      setUploadError("Please enter a description for the item");
      return false;
    }

    if (!location.trim()) {
      setUploadError("Please enter an item location");
      return false;
    }

    const itemData = {
      location: location,
      image: currentItem.imageUrl,
      style: currentItem.style,
      color: currentItem.color,
      quantity: currentItem.quantity,
      price: currentItem.price,
      sale: visibility.includes("sale"),
      public: visibility.includes("public"),
    };

    if (currentItem.descriptionId) {
      itemData.descriptionId = currentItem.descriptionId;
    } else {
      itemData.description = currentItem.description;
    }

    if (currentItem.brandId) {
      itemData.brandId = currentItem.brandId;
    } else {
      itemData.brand = currentItem.brand;
    }

    if (currentItem.sizeId) {
      itemData.sizeId = currentItem.sizeId;
    } else {
      itemData.size = currentItem.size;
    }

    if (visibility.includes("sale")) {
      itemData.discount = discount;
      itemData.minPrice = minimumPrice;
    }

    try {
      const itemResponse = await fetch("/api/inventory/item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const itemResult = await itemResponse.json();

      if (itemResult.success) {
        console.log("Item created successfully:", itemResult.data);
        alert("Item created successfully!");
        
        // Reset form
        setCurrentItem({
          imageUrl: "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
          description: "",
          descriptionId: null,
          style: "",
          brand: "",
          brandId: null,
          size: "",
          sizeId: null,
          color: "",
          quantity: 0,
          price: 0.0,
          descriptionOpen: false,
          brandOpen: false,
          sizeOpen: false,
        });
        setLocation("");
        setUploadError("");
        
        setPage("qr");
        setItem(itemResult.data);
        refresh();
        return true;
      } else {
        console.error("Error creating item:", itemResult.error);
        setUploadError(itemResult.error || "Unknown error occurred");
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      setUploadError("Network error: " + error.message);
      return false;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close description dropdown
      if (!event.target.closest("[data-description-dropdown]") && currentItem.descriptionOpen) {
        const searchTerm = descriptionSearch || "";
        const matchedItem = descriptionDict[searchTerm.toLowerCase().trim()];
        if (!matchedItem) {
          setCurrentItem({
            ...currentItem,
            description: searchTerm,
            descriptionId: null,
            descriptionOpen: false,
          });
        } else {
          setCurrentItem({
            ...currentItem,
            description: matchedItem.description,
            descriptionId: matchedItem._id,
            descriptionOpen: false,
          });
        }
        setDescriptionSearch("");
      }

      // Close brand dropdown
      if (!event.target.closest("[data-brand-dropdown]") && currentItem.brandOpen) {
        const searchTerm = brandSearch || "";
        const matchedItem = brandDict[searchTerm.toLowerCase().trim()];
        if (!matchedItem) {
          setCurrentItem({
            ...currentItem,
            brand: searchTerm,
            brandId: null,
            brandOpen: false,
          });
        } else {
          setCurrentItem({
            ...currentItem,
            brand: matchedItem.brand,
            brandId: matchedItem._id,
            brandOpen: false,
          });
        }
        setBrandSearch("");
      }

      // Close size dropdown
      if (!event.target.closest("[data-size-dropdown]") && currentItem.sizeOpen) {
        const searchTerm = sizeSearch || "";
        const matchedItem = sizeDict[searchTerm.toLowerCase().trim()];
        if (!matchedItem) {
          setCurrentItem({
            ...currentItem,
            size: searchTerm,
            sizeId: null,
            sizeOpen: false,
          });
        } else {
          setCurrentItem({
            ...currentItem,
            size: matchedItem.size,
            sizeId: matchedItem._id,
            sizeOpen: false,
          });
        }
        setSizeSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    currentItem.descriptionOpen,
    currentItem.brandOpen,
    currentItem.sizeOpen,
    descriptionSearch,
    brandSearch,
    sizeSearch,
    descriptionDict,
    brandDict,
    sizeDict
  ]);

  const handleDescriptionKeyDown = (e) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const matchedItem = descriptionDict[descriptionSearch.toLowerCase().trim()];
      if (!matchedItem) {
        setCurrentItem({
          ...currentItem,
          description: descriptionSearch,
          descriptionId: null,
          descriptionOpen: false,
        });
      } else {
        setCurrentItem({
          ...currentItem,
          description: matchedItem.description,
          descriptionId: matchedItem._id,
          descriptionOpen: false,
        });
      }
      setDescriptionSearch("");
    }
  };

  const handleBrandKeyDown = (e) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const matchedItem = brandDict[brandSearch.toLowerCase().trim()];
      if (!matchedItem) {
        setCurrentItem({
          ...currentItem,
          brand: brandSearch,
          brandId: null,
          brandOpen: false,
        });
      } else {
        setCurrentItem({
          ...currentItem,
          brand: matchedItem.brand,
          brandId: matchedItem._id,
          brandOpen: false,
        });
      }
      setBrandSearch("");
    }
  };

  const handleSizeKeyDown = (e) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const matchedItem = sizeDict[sizeSearch.toLowerCase().trim()];
      if (!matchedItem) {
        setCurrentItem({
          ...currentItem,
          size: sizeSearch,
          sizeId: null,
          sizeOpen: false,
        });
      } else {
        setCurrentItem({
          ...currentItem,
          size: matchedItem.size,
          sizeId: matchedItem._id,
          sizeOpen: false,
        });
      }
      setSizeSearch("");
    }
  };

  const addOptDb = async (selectedOption, newItem) => {
    try {
      const itemData = {};
      let url = "";
      switch (selectedOption) {
        case "description":
          itemData.description = newItem;
          url = "/api/details/descriptions";
          break;
        case "brand":
          itemData.brand = newItem;
          url = "/api/details/brands";
          break;
        case "size":
          itemData.size = newItem;
          url = "/api/details/sizes";
          break;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (!data.success) {
        console.error("Error creating item:", data.error);
        setUploadError(data.error || "Unknown error occurred");
        return false;
      }

      // Update the current item with the new option
      if (selectedOption === "description") {
        setCurrentItem({
          ...currentItem,
          description: data.data.description,
          descriptionId: data.data._id,
          descriptionOpen: false,
        });
      } else if (selectedOption === "brand") {
        setCurrentItem({
          ...currentItem,
          brand: data.data.brand,
          brandId: data.data._id,
          brandOpen: false,
        });
      } else if (selectedOption === "size") {
        setCurrentItem({
          ...currentItem,
          size: data.data.size,
          sizeId: data.data._id,
          sizeOpen: false,
        });
      }

      return data.data;
    } catch (error) {
      console.error("Network error:", error);
      setUploadError("Network error: " + error.message);
      return false;
    }
  };

  return (
    <div style={{ overflowX: "scroll", color: "black" }}>
      <div>
        <h2>Add Item to Inventory</h2>
        <form className={styles.form} style={{ marginTop: "30px" }} onSubmit={submitItem}>
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
                      <div style={{position: "relative", width:"auto"}}>
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
                        <IoIosRemoveCircle 
                          style={{
                            position:"absolute", 
                            top: "-15px", 
                            right:"0", 
                            fontSize:"30px", 
                            color:"red"
                          }}
                          onClick={() => setCurrentItem({
                            ...currentItem, 
                            imageUrl: ""
                          })}
                        />
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
                    <div
                      style={{ position: "relative" }}
                      data-description-dropdown
                    >
                      <input
                        value={
                          currentItem.descriptionOpen
                            ? descriptionSearch
                            : currentItem.description
                        }
                        onClick={() => {
                          setCurrentItem({
                            ...currentItem,
                            descriptionOpen: true,
                          });
                          setDescriptionSearch(currentItem.description);
                        }}
                        onChange={(e) => {
                          if (currentItem.descriptionOpen) {
                            setDescriptionSearch(e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setCurrentItem({
                            ...currentItem,
                            descriptionOpen: true,
                          });
                          setDescriptionSearch(currentItem.description);
                        }}
                        onKeyDown={handleDescriptionKeyDown}
                        placeholder={
                          currentItem.descriptionOpen
                            ? "Search descriptions..."
                            : ""
                        }
                        className={styles.input}
                        style={{
                          margin: 0,
                          minHeight: "auto",
                          width: "100%",
                          caretColor: currentItem.descriptionOpen
                            ? "auto"
                            : "transparent",
                        }}
                        data-description-dropdown
                      />
                      {currentItem.descriptionOpen && (
                        <div
                          className={styles.dropdown}
                          data-description-dropdown
                          style={{ maxWidth: "250px" }}
                        >
                          <div
                            style={{
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                            data-description-dropdown
                          >
                            {filteredDescriptions.length > 0 ? (
                              filteredDescriptions.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setCurrentItem({
                                      ...currentItem,
                                      description: opt.description,
                                      descriptionId: opt._id,
                                      descriptionOpen: false,
                                    });
                                    setDescriptionSearch("");
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom:
                                      oIndex < filteredDescriptions.length - 1
                                        ? "1px solid #eee"
                                        : "none",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.target.style.backgroundColor = "#f5f5f5")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.target.style.backgroundColor = "white")
                                  }
                                  data-description-dropdown
                                >
                                  <strong>{opt.description}</strong>
                                </div>
                              ))
                            ) : (
                              <div
                                className={styles.dropdownItem}
                                style={{
                                  color: "#999",
                                  fontStyle: "italic",
                                  padding: "8px 12px",
                                  textAlign: "center",
                                }}
                                data-description-dropdown
                              >
                                No descriptions found
                              </div>
                            )}
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                addOptDb("description", descriptionSearch);
                                setDescriptionSearch("");
                              }}
                              data-description-dropdown
                            >
                              <div>
                                Add to inventory? <FaBookmark />
                              </div>
                            </div>
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                setCurrentItem({
                                  ...currentItem,
                                  description: descriptionSearch,
                                  descriptionId: null,
                                  descriptionOpen: false,
                                });
                              }}
                              data-description-dropdown
                            >
                              <div>
                                Add only to item? <FaPlus />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                    <div
                      style={{ position: "relative" }}
                      data-brand-dropdown
                    >
                      <input
                        value={
                          currentItem.brandOpen
                            ? brandSearch
                            : currentItem.brand
                        }
                        onClick={() => {
                          setCurrentItem({
                            ...currentItem,
                            brandOpen: true,
                          });
                          setBrandSearch(currentItem.brand);
                        }}
                        onChange={(e) => {
                          if (currentItem.brandOpen) {
                            setBrandSearch(e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setCurrentItem({
                            ...currentItem,
                            brandOpen: true,
                          });
                          setBrandSearch(currentItem.brand);
                        }}
                        onKeyDown={handleBrandKeyDown}
                        placeholder={
                          currentItem.brandOpen ? "Search brands..." : ""
                        }
                        className={styles.input}
                        style={{
                          margin: 0,
                          minHeight: "auto",
                          width: "100%",
                          caretColor: currentItem.brandOpen
                            ? "auto"
                            : "transparent",
                        }}
                        data-brand-dropdown
                      />
                      {currentItem.brandOpen && (
                        <div
                          className={styles.dropdown}
                          data-brand-dropdown
                          style={{ maxWidth: "250px" }}
                        >
                          <div
                            style={{
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                            data-brand-dropdown
                          >
                            {filteredBrands.length > 0 ? (
                              filteredBrands.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setCurrentItem({
                                      ...currentItem,
                                      brand: opt.brand,
                                      brandId: opt._id,
                                      brandOpen: false,
                                    });
                                    setBrandSearch("");
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom:
                                      oIndex < filteredBrands.length - 1
                                        ? "1px solid #eee"
                                        : "none",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.target.style.backgroundColor = "#f5f5f5")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.target.style.backgroundColor = "white")
                                  }
                                  data-brand-dropdown
                                >
                                  <strong>{opt.brand}</strong>
                                </div>
                              ))
                            ) : (
                              <div
                                className={styles.dropdownItem}
                                style={{
                                  color: "#999",
                                  fontStyle: "italic",
                                  padding: "8px 12px",
                                  textAlign: "center",
                                }}
                                data-brand-dropdown
                              >
                                No brands found
                              </div>
                            )}
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                addOptDb("brand", brandSearch);
                                setBrandSearch("");
                              }}
                              data-brand-dropdown
                            >
                              <div>
                                Add to inventory? <FaBookmark />
                              </div>
                            </div>
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                setCurrentItem({
                                  ...currentItem,
                                  brand: brandSearch,
                                  brandId: null,
                                  brandOpen: false,
                                });
                              }}
                              data-brand-dropdown
                            >
                              <div>
                                Add only to item? <FaPlus />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={styles.tableReg}>
                    <div
                      style={{ position: "relative" }}
                      data-size-dropdown
                    >
                      <input
                        value={
                          currentItem.sizeOpen
                            ? sizeSearch
                            : currentItem.size
                        }
                        onClick={() => {
                          setCurrentItem({
                            ...currentItem,
                            sizeOpen: true,
                          });
                          setSizeSearch(currentItem.size);
                        }}
                        onChange={(e) => {
                          if (currentItem.sizeOpen) {
                            setSizeSearch(e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setCurrentItem({
                            ...currentItem,
                            sizeOpen: true,
                          });
                          setSizeSearch(currentItem.size);
                        }}
                        onKeyDown={handleSizeKeyDown}
                        placeholder={
                          currentItem.sizeOpen ? "Search sizes..." : ""
                        }
                        className={styles.input}
                        style={{
                          margin: 0,
                          minHeight: "auto",
                          width: "100%",
                          caretColor: currentItem.sizeOpen
                            ? "auto"
                            : "transparent",
                        }}
                        data-size-dropdown
                      />
                      {currentItem.sizeOpen && (
                        <div
                          className={styles.dropdown}
                          data-size-dropdown
                          style={{ maxWidth: "250px" }}
                        >
                          <div
                            style={{
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                            data-size-dropdown
                          >
                            {filteredSizes.length > 0 ? (
                              filteredSizes.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setCurrentItem({
                                      ...currentItem,
                                      size: opt.size,
                                      sizeId: opt._id,
                                      sizeOpen: false,
                                    });
                                    setSizeSearch("");
                                  }}
                                  style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom:
                                      oIndex < filteredSizes.length - 1
                                        ? "1px solid #eee"
                                        : "none",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.target.style.backgroundColor = "#f5f5f5")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.target.style.backgroundColor = "white")
                                  }
                                  data-size-dropdown
                                >
                                  <strong>{opt.size}</strong>
                                </div>
                              ))
                            ) : (
                              <div
                                className={styles.dropdownItem}
                                style={{
                                  color: "#999",
                                  fontStyle: "italic",
                                  padding: "8px 12px",
                                  textAlign: "center",
                                }}
                                data-size-dropdown
                              >
                                No sizes found
                              </div>
                            )}
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                addOptDb("size", sizeSearch);
                                setSizeSearch("");
                              }}
                              data-size-dropdown
                            >
                              <div>
                                Add to inventory? <FaBookmark />
                              </div>
                            </div>
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                setCurrentItem({
                                  ...currentItem,
                                  size: sizeSearch,
                                  sizeId: null,
                                  sizeOpen: false,
                                });
                              }}
                              data-size-dropdown
                            >
                              <div>
                                Add only to item? <FaPlus />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                        <IoIosRemoveCircle 
                          style={{
                            position:"absolute", 
                            top: "-15px", 
                            right:"-15px", 
                            fontSize:"30px", 
                            color:"red"
                          }}
                          onClick={() => setCurrentItem({
                            ...currentItem, 
                            imageUrl: ""
                          })}
                        />
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
                  <label className={styles.mobileLabel}>Brand</label>
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
          
          <div className={styles.formInput} style={{zIndex: 0}}>
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
            style={{ width: "100%", display: "flex", justifyContent: "end" }}
          >
            <button type="submit" className={styles.button}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};