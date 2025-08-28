"use client";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaUpload,
  FaTimes,
  FaLink,
  FaDownload,
  FaBox,
  FaBoxOpen,
  FaBookmark,
  FaPlus,
} from "react-icons/fa";
import { IoIosRemoveCircle, IoIosCheckmarkCircle } from "react-icons/io";
import jsPDF from "jspdf";
import Overlay from "@/app/components/popups/Overlay";
import EditPresets from "@/app/components/admin/editPresets/EditPresets";
import Dropdown from "./Dropdown";

export default function EditItem({
  item,
  onClose,
  refresh,
  boxes,
  items,
  options,
  deletePopup,
}) {
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [popup, setPopup] = useState(null);
  const [page, setPage] = useState("item");

  return (
    <Overlay
      onClose={onClose}
      isVisible={true}
      popup={popup}
      setPopup={setPopup}
      unsavedChanges={unsavedChanges}
      setUnsavedChanges={setUnsavedChanges}
    >
      {page === "item" && (
        <Edit
          item={item}
          onClose={onClose}
          refresh={refresh}
          boxes={boxes}
          items={items}
          options={options}
          setUnsavedChanges={setUnsavedChanges}
          unsavedChanges={unsavedChanges}
          popup={popup}
          setPopup={setPopup}
          deletePopup={deletePopup}
          setPage={setPage}
        />
      )}
      {page === "preset" && (
        <EditPresets
          options={options}
          prevPage={"item"}
          setPage={setPage}
          refresh={refresh}
          setPopup={setPopup}
        />
      )}
    </Overlay>
  );
}

const Edit = ({
  item,
  onClose,
  refresh,
  boxes,
  items,
  options,
  setUnsavedChanges,
  unsavedChanges,
  popup,
  setPopup,
  deletePopup,
  setPage,
}) => {
  const [location, setLocation] = useState(item.location);
  const [originalLocation] = useState(item.location);
  const [minimumPrice, setMinimumPrice] = useState(item.minPrice || 0);
  const [originalMinimumPrice] = useState(item.minPrice || 0);
  const [visibility, setVisibility] = useState(["admin"]);
  const [originalVisibility, setOriginalVisibility] = useState([]);
  const [discount, setDiscount] = useState(item.discount || 20);
  const [originalDiscount] = useState(item.discount || 20);
  const [currentItem, setCurrentItem] = useState({
    imageUrl: item.image,
    description: item.description,
    descriptionId: item.descriptionId,
    style: item.style,
    brand: item.brand,
    brandId: item.brandId,
    size: item.size,
    sizeId: item.sizeId,
    color: item.color,
    quantity: item.quantity,
    price: item.price,
    descriptionOpen: false,
    brandOpen: false,
    sizeOpen: false,
  });
  const [originalCurrentItem] = useState({
    imageUrl: item.image,
    description: item.description,
    descriptionId: item.descriptionId,
    style: item.style,
    brand: item.brand,
    brandId: item.brandId,
    size: item.size,
    sizeId: item.sizeId,
    color: item.color,
    quantity: item.quantity,
    price: item.price,
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [box, setBox] = useState(item.boxId || null);
  const [originalBox] = useState(item.boxId || null);
  const [boxDict, setBoxDict] = useState({});
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced setters with change tracking
  const setLocationWithTracking = useCallback(
    (newValue) => {
      setUnsavedChanges(true);
      setLocation(newValue);
    },
    [setUnsavedChanges]
  );

  const setMinimumPriceWithTracking = useCallback(
    (newValue) => {
      setUnsavedChanges(true);
      setMinimumPrice(newValue);
    },
    [setUnsavedChanges]
  );

  const setDiscountWithTracking = useCallback(
    (newValue) => {
      setUnsavedChanges(true);
      setDiscount(newValue);
    },
    [setUnsavedChanges]
  );

  const setVisibilityWithTracking = useCallback(
    (newValue) => {
      setUnsavedChanges(true);
      setVisibility(newValue);
    },
    [setUnsavedChanges]
  );

  const setBoxWithTracking = useCallback(
    (newValue) => {
      setUnsavedChanges(true);
      setBox(newValue);
    },
    [setUnsavedChanges]
  );

  const setCurrentItemWithTracking = useCallback(
    (newItem) => {
      setUnsavedChanges(true);
      setCurrentItem(newItem);
    },
    [setUnsavedChanges]
  );

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        if (popup === "unsaved") {
          handleSubmitItem();
        } else if (popup === "success") {
          onClose();
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (popup === "success" || !unsavedChanges) {
          onClose();
        } else if (unsavedChanges) {
          setPopup("unsaved");
          setUnsavedChanges(false);
        }
      }
    },
    [popup, onClose, unsavedChanges, setPopup, setUnsavedChanges]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

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
    return options.descriptions.filter((desc) =>
      desc.description.toLowerCase().includes(descriptionSearch.toLowerCase())
    );
  }, [options?.descriptions, descriptionSearch]);

  const filteredBrands = useMemo(() => {
    if (!options?.brands) return [];
    if (!brandSearch || !brandSearch.trim()) {
      return options.brands;
    }
    return options.brands.filter((brand) =>
      brand.brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [options?.brands, brandSearch]);

  const filteredSizes = useMemo(() => {
    if (!options?.sizes) return [];
    if (!sizeSearch || !sizeSearch.trim()) {
      return options.sizes;
    }
    return options.sizes.filter((size) =>
      size.size.toLowerCase().includes(sizeSearch.toLowerCase())
    );
  }, [options?.sizes, sizeSearch]);

  useEffect(() => {
    let tempDict = {};
    for (const item of items) {
      if (item.boxId && !tempDict[item.boxId]) {
        tempDict[item.boxId] = {
          sale: item.sale,
          public: item.public,
        };
      }
    }
    setBoxDict(tempDict);
  }, [items]);

  useEffect(() => {
    const newVisibility = [];
    if (item.public) newVisibility.push("public");
    if (item.sale) newVisibility.push("sale");
    setVisibility(newVisibility);
    setOriginalVisibility(newVisibility);
  }, [item]);

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

  const handleUrlSubmit = (e, type) => {
    e.preventDefault();
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
      setCurrentItemWithTracking({
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
        setCurrentItemWithTracking({
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

  const handleSubmitItem = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await submitDb();
      if (success) {
        setUnsavedChanges(false);
        setPopup("success");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setUploadError("Error submitting form: " + error.message);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  const submitItem = async (e) => {
    e.preventDefault();
    await handleSubmitItem();
  };

  const submitDb = async () => {
    if (!location.trim() && !box) {
      setUploadError("Please enter an item location");
      return false;
    }

    const itemData = {
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

    if (visibility.includes("sale") && !box) {
      itemData.discount = discount;
      itemData.minPrice = minimumPrice;
    }

    if (box) {
      itemData.box_id = box;
      itemData.sale = boxDict[box]?.sale || false;
      itemData.public = boxDict[box]?.public || false;
    } else {
      itemData.location = location;
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
      } else {
        console.error("Error creating item:", itemResult.error);
        setUploadError(itemResult.error || "Unknown error occurred");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Network error:", error);
      setUploadError("Network error: " + error.message);
      return false;
    }
  };

  async function handleDelete(e) {
    e.preventDefault();
    try {
      const itemResponse = await fetch(`/api/inventory/item/${item._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const itemResult = await itemResponse.json();

      if (!itemResult.success) {
        console.error("Error deleting item:", itemResult.error);
      }

      deletePopup();
      refresh();
      onClose();
    } catch (error) {
      console.error("Network error:", error);
      setUploadError("Network error: " + error.message);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close description dropdown
      if (
        !event.target.closest("[data-description-dropdown]") &&
        currentItem.descriptionOpen
      ) {
        const searchTerm = descriptionSearch || "";
        const matchedItem = descriptionDict[searchTerm.toLowerCase().trim()];
        if (!matchedItem) {
          setCurrentItemWithTracking({
            ...currentItem,
            description: searchTerm,
            descriptionId: null,
            descriptionOpen: false,
          });
        } else {
          setCurrentItemWithTracking({
            ...currentItem,
            description: matchedItem.description,
            descriptionId: matchedItem._id,
            descriptionOpen: false,
          });
        }
        setDescriptionSearch("");
      }

      // Close brand dropdown
      if (
        !event.target.closest("[data-brand-dropdown]") &&
        currentItem.brandOpen
      ) {
        const searchTerm = brandSearch || "";
        const matchedItem = brandDict[searchTerm.toLowerCase().trim()];
        if (!matchedItem) {
          setCurrentItemWithTracking({
            ...currentItem,
            brand: searchTerm,
            brandId: null,
            brandOpen: false,
          });
        } else {
          setCurrentItemWithTracking({
            ...currentItem,
            brand: matchedItem.brand,
            brandId: matchedItem._id,
            brandOpen: false,
          });
        }
        setBrandSearch("");
      }

      // Close size dropdown
      if (
        !event.target.closest("[data-size-dropdown]") &&
        currentItem.sizeOpen
      ) {
        const searchTerm = sizeSearch || "";
        const matchedItem = sizeDict[searchTerm.toLowerCase().trim()];
        if (!matchedItem) {
          setCurrentItemWithTracking({
            ...currentItem,
            size: searchTerm,
            sizeId: null,
            sizeOpen: false,
          });
        } else {
          setCurrentItemWithTracking({
            ...currentItem,
            size: matchedItem.size,
            sizeId: matchedItem._id,
            sizeOpen: false,
          });
        }
        setSizeSearch("");
      }

      // Close box dropdown
      if (
        isDropdownOpen !== false &&
        !event.target.closest("[data-dropdown]")
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isDropdownOpen,
    currentItem.descriptionOpen,
    currentItem.brandOpen,
    currentItem.sizeOpen,
    descriptionSearch,
    brandSearch,
    sizeSearch,
    descriptionDict,
    brandDict,
    sizeDict,
    setCurrentItemWithTracking,
    currentItem,
  ]);

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
      let description =
        currentItem.size +
        " " +
        currentItem.color +
        " " +
        currentItem.description +
        "(" +
        item.style +
        ")";
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
      pdf.addImage(item.qrCode, "PNG", qrX, currentQrY, qrSize, qrSize);

      pdf.save(`item-${currentItem.description}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const DROPDOWN_CONFIGS = {
    description: {
      searchState: descriptionSearch,
      setSearchState: setDescriptionSearch,
      filteredOptions: filteredDescriptions,
      dictionary: descriptionDict,
      fieldKey: "description",
      idKey: "descriptionId",
      openKey: "descriptionOpen",
      placeholder: "Search descriptions...",
      noResultsText: "No descriptions found",
    },
    brand: {
      searchState: brandSearch,
      setSearchState: setBrandSearch,
      filteredOptions: filteredBrands,
      dictionary: brandDict,
      fieldKey: "brand",
      idKey: "brandId",
      openKey: "brandOpen",
      placeholder: "Search brands...",
      noResultsText: "No brands found",
    },
    size: {
      searchState: sizeSearch,
      setSearchState: setSizeSearch,
      filteredOptions: filteredSizes,
      dictionary: sizeDict,
      fieldKey: "size",
      idKey: "sizeId",
      openKey: "sizeOpen",
      placeholder: "Search sizes...",
      noResultsText: "No sizes found",
    },
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
          <div
            style={{
              display: "flex",
              gap: !box ? "16px" : "20px",
              position: "relative",
            }}
          >
            {item.qrCode ? (
              <FaDownload
                style={{ cursor: "pointer" }}
                onClick={downloadItemPDF}
              />
            ) : (
              ""
            )}
            {!box ? (
              <FaBoxOpen
                style={{ cursor: "pointer", fontSize: "20px" }}
                onClick={() => setIsDropdownOpen(true)}
                data-dropdown
              />
            ) : (
              <FaBox
                style={{ cursor: "pointer" }}
                onClick={() => setIsDropdownOpen(true)}
                data-dropdown
              />
            )}

            {isDropdownOpen && (
              <div className={styles.dropdown} data-dropdown>
                <div
                  key="removed"
                  className={`${styles.dropdownItem} ${!box ? styles.selected : ""}`}
                  onClick={() => setBoxWithTracking(null)}
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
                      setBoxWithTracking(b._id);
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
                onChange={(e) => setLocationWithTracking(e.target.value)}
                disabled={!!box}
                required={!box}
              />
            </div>
          </div>
          <div className={styles.formInput}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label>Item Details</label>
              <label
                style={{ cursor: "pointer" }}
                onClick={() => setPage("preset")}
              >
                Edit presets →
              </label>
            </div>

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
                      <div style={{ position: "relative" }}>
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
                            position: "absolute",
                            top: "-15px",
                            right: "0px",
                            fontSize: "30px",
                            color: "red",
                          }}
                          onClick={() =>
                            setCurrentItemWithTracking({
                              ...currentItem,
                              imageUrl: "",
                            })
                          }
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
                            onClick={(e) => handleUrlSubmit(e, "content")}
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
                    <Dropdown
                      configs={DROPDOWN_CONFIGS}
                      config_type={"description"}
                      contents={null}
                      setContents={null}
                      index={null}
                      setUnsavedChanges={setUnsavedChanges}
                      refresh={refresh}
                      currentItem={currentItem}
                      setCurrentItem={setCurrentItem}
                    />
                  </td>
                  <td className={styles.tableReg}>
                    <input
                      value={currentItem.style}
                      onChange={(e) =>
                        setCurrentItemWithTracking({
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
                    <Dropdown
                      configs={DROPDOWN_CONFIGS}
                      config_type={"brand"}
                      contents={null}
                      setContents={null}
                      index={null}
                      setUnsavedChanges={setUnsavedChanges}
                      refresh={refresh}
                      currentItem={currentItem}
                      setCurrentItem={setCurrentItem}
                    />
                  </td>
                  <td className={styles.tableReg}>
                    <Dropdown
                      configs={DROPDOWN_CONFIGS}
                      config_type={"size"}
                      contents={null}
                      setContents={null}
                      index={null}
                      setUnsavedChanges={setUnsavedChanges}
                      refresh={refresh}
                      currentItem={currentItem}
                      setCurrentItem={setCurrentItem}
                    />
                  </td>
                  <td className={styles.tableReg}>
                    <input
                      value={currentItem.color}
                      onChange={(e) =>
                        setCurrentItemWithTracking({
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
                        setCurrentItemWithTracking({
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
                        setCurrentItemWithTracking({
                          ...currentItem,
                          price: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value);
                        setCurrentItemWithTracking({
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
                      <div style={{ position: "relative", width: "auto" }}>
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
                            position: "absolute",
                            top: "-15px",
                            right: "0",
                            fontSize: "30px",
                            color: "red",
                          }}
                          onClick={() =>
                            setCurrentItemWithTracking({
                              ...currentItem,
                              imageUrl: "",
                            })
                          }
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
                            onClick={(e) => handleUrlSubmit(e, "content")}
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
                    <Dropdown
                      configs={DROPDOWN_CONFIGS}
                      config_type={"description"}
                      contents={null}
                      setContents={null}
                      index={null}
                      setUnsavedChanges={setUnsavedChanges}
                      refresh={refresh}
                      currentItem={currentItem}
                      setCurrentItem={setCurrentItem}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Style Code</label>
                  <div className={styles.mobileValue}>
                    <input
                      value={currentItem.style}
                      onChange={(e) =>
                        setCurrentItemWithTracking({
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
                    <Dropdown
                      configs={DROPDOWN_CONFIGS}
                      config_type={"brand"}
                      contents={null}
                      setContents={null}
                      index={null}
                      setUnsavedChanges={setUnsavedChanges}
                      refresh={refresh}
                      currentItem={currentItem}
                      setCurrentItem={setCurrentItem}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Size</label>
                  <div className={styles.mobileValue}>
                    <Dropdown
                      configs={DROPDOWN_CONFIGS}
                      config_type={"size"}
                      contents={null}
                      setContents={null}
                      index={null}
                      setUnsavedChanges={setUnsavedChanges}
                      refresh={refresh}
                      currentItem={currentItem}
                      setCurrentItem={setCurrentItem}
                    />
                  </div>
                </div>

                <div className={styles.mobileField}>
                  <label className={styles.mobileLabel}>Color</label>
                  <div className={styles.mobileValue}>
                    <input
                      value={currentItem.color}
                      onChange={(e) =>
                        setCurrentItemWithTracking({
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
                        setCurrentItemWithTracking({
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
                        setCurrentItemWithTracking({
                          ...currentItem,
                          price: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value);
                        setCurrentItemWithTracking({
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

          <div className={styles.formInput} style={{ zIndex: 0 }}>
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
                      setVisibilityWithTracking([...visibility, "public"]);
                    } else {
                      setVisibilityWithTracking(
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
                      setVisibilityWithTracking([...visibility, "sale"]);
                    } else {
                      setVisibilityWithTracking(
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
          {visibility.includes("sale") && !box && (
            <div className={styles.horizontal}>
              <div className={styles.formInput}>
                <label>Discount</label>
                <input
                  className={styles.input}
                  onChange={(e) =>
                    setDiscountWithTracking(
                      e.target.value.replace(/[^0-9.]/g, "")
                    )
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
                    setMinimumPriceWithTracking(
                      e.target.value.replace(/[^0-9.]/g, "")
                    )
                  }
                  value={`${minimumPrice}`}
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
              type="button"
            >
              Delete
            </button>
            <button
              type="submit"
              className={styles.button}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
