"use client";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo } from "react";
import {
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaBookmark,
  FaDownload,
  FaRegCopy,
  FaPlus,
} from "react-icons/fa";
import {
  IoIosAddCircle,
  IoIosRemoveCircle,
  IoIosCheckmarkCircle,
} from "react-icons/io";
import jsPDF from "jspdf";

import AddOption from "@/app/components/admin/addOptions/AddOption";
import EditPresets from "@/app/components/admin/editPresets/EditPresets";

export default function AddItem({
  onClose,
  refresh,
  options,
  savedInfo,
  setSavedInfo,
}) {
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
        {page === "box" && (
          <AddBox
            setPage={setPage}
            setBox={setBox}
            options={options}
            savedInfo={savedInfo}
            setSavedInfo={setSavedInfo}
            refresh={refresh}
          />
        )}
        {page === "qr" && <QrPopup setPage={setPage} box={box} />}
        {page === "option" && (
          <AddOption
            options={options}
            prevPage="box"
            setPage={setPage}
            refresh={refresh}
          />
        )}
        {page === "edit" && (
          <EditPresets
            options={options}
            prevPage="box"
            setPage={setPage}
            refresh={refresh}
          />
        )}
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

const AddBox = ({
  setPage,
  setBox,
  options,
  savedInfo,
  setSavedInfo,
  refresh,
}) => {
  const [boxDescription, setBoxDescription] = useState(
    savedInfo.addBox.boxDescription || ""
  );
  const [boxLocation, setBoxLocation] = useState(
    savedInfo.addBox.boxLocation || ""
  );
  const [contents, setContents] = useState(savedInfo.addBox.contents || []);
  const [imageUrl, setImageUrl] = useState(
    savedInfo.addBox.imageUrl ||
      "https://companystores.s3.us-east-1.amazonaws.com/sale-items/corrugated-cube_52a4bb18-a30d-468d-baa7-61b0c7a2f842.jpg.webp"
  );
  const [minimumPrice, setMinimumPrice] = useState(
    savedInfo.addBox.minimumPrice || 0
  );
  /*admin (always clicked), public inventory, sale*/
  const [visibility, setVisibility] = useState(
    savedInfo.addBox.visibility || ["admin"]
  );
  const [boxDiscount, setBoxDiscount] = useState(
    savedInfo.addBox.boxDiscount || 20
  );
  const [currentItem, setCurrentItem] = useState({
    imageUrl:
      "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
    description: "",
    descriptionOpen: false,
    descriptionId: null,
    style: "",
    brand: "",
    brandOpen: false,
    brandId: null,
    sizesStandard: true,
    sizeId: null,
    size: "",
    sizeOpen: false,
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

  // New state for description search
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");

  let acknowledgement = false;

  const [showImageOptions, setShowImageOptions] = useState(null);

  // Filter descriptions based on search
  const filteredDescriptions = useMemo(() => {
    if (!options?.descriptions) return [];

    if (!descriptionSearch.trim()) {
      return options.descriptions;
    }

    return options.descriptions.filter((desc) =>
      desc.description.toLowerCase().includes(descriptionSearch.toLowerCase())
    );
  }, [options?.descriptions, descriptionSearch]);

  const filteredBrands = useMemo(() => {
    if (!options?.brands) return [];

    if (!brandSearch.trim()) {
      return options.brands;
    }

    return options.brands.filter((desc) =>
      desc.brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [options?.brands, brandSearch]);

  const filteredSizes = useMemo(() => {
    if (!options?.sizes) return [];

    if (!sizeSearch.trim()) {
      return options.sizes;
    }

    return options.sizes.filter((desc) =>
      desc.size.toLowerCase().includes(sizeSearch.toLowerCase())
    );
  }, [options?.sizes, sizeSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close description/brand/size dropdowns
      if (!event.target.closest("[data-description-dropdown]")) {
        setContents((prevContents) =>
          prevContents.map((item) => ({ ...item, descriptionOpen: false }))
        );
        setCurrentItem((prevItem) => ({ ...prevItem, descriptionOpen: false }));
        setDescriptionSearch("");
      }

      if (!event.target.closest("[data-size-dropdown]")) {
        setContents((prevContents) =>
          prevContents.map((item) => ({ ...item, sizeOpen: false }))
        );
        setCurrentItem((prevItem) => ({ ...prevItem, sizeOpen: false }));
        setSizeSearch("");
      }

      if (!event.target.closest("[data-brand-dropdown]")) {
        setContents((prevContents) =>
          prevContents.map((item) => ({ ...item, brandOpen: false }))
        );
        setCurrentItem((prevItem) => ({ ...prevItem, brandOpen: false }));
        setBrandSearch("");
      }

      // Close image options dropdown
      if (
        showImageOptions !== null &&
        !event.target.closest("[data-image-options]")
      ) {
        setShowImageOptions(null);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showImageOptions]);

  /**
   * Save information the user puts in
   */
  useEffect(() => {
    setSavedInfo({
      ...savedInfo,
      addBox: {
        boxDescription: boxDescription,
        boxLocation: boxLocation,
        contents: contents,
        imageUrl: imageUrl,
        visibility: visibility,
        boxDiscount: boxDiscount,
        minimumPrice: minimumPrice,
      },
    });
  }, [
    boxDescription,
    boxLocation,
    contents,
    imageUrl,
    visibility,
    boxDiscount,
    minimumPrice,
  ]);

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

  const handleUrlSubmit = (e, type, itemIndex = null) => {
    e.preventDefault();
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
    console.log("hello 1", index);
    setSelectedItemIndex(index);
    setShowImageOptions(index);
  };

  // Handle file upload option for existing items
  const handleFileUploadOption = (index) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => handleFileSelect(e, "content", index);
    fileInput.click();
  };

  // Handle URL input option for existing items
  const handleUrlOption = (index) => {
    console.log("hello");
    setShowImageOptions(null);
    setShowUrlInput(index);
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
      imageUrl:
        "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
      description: "",
      descriptionId: null,
      style: "",
      brand: "",
      brandOpen: false,
      brandId: null,
      size: "",
      sizeId: null,
      sizeOpen: false,
      color: "",
      quantity: 0,
      price: 0.0,
    });
    setNewItemOpen(false);
    acknowledgement = false;
  };

  const cancelNewItem = () => {
    setCurrentItem({
      imageUrl:
        "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
      description: "",
      descriptionId: null,
      descriptionOpen: false,
      style: "",
      brand: "",
      brandId: null,
      brandOpen: false,
      size: "",
      sizeId: null,
      sizeOpen: false,
      color: "",
      quantity: 0,
      price: 0.0,
    });
    setNewItemOpen(false);
  };

  // Handle description selection
  const handleDescriptionSelect = (d) => {
    console.log(d);
    setCurrentItem({
      ...currentItem,
      description: d.description,
      descriptionOpen: false,
      descriptionId: d._id,
    });
    setDescriptionSearch("");
  };

  const handleSizeSelect = (s) => {
    setCurrentItem({
      ...currentItem,
      size: s.size,
      sizeOpen: false,
      sizeId: s._id,
    });
    setSizeSearch("");
  };

  const handleBrandSelect = (b) => {
    setCurrentItem({
      ...currentItem,
      brand: b.brand,
      brandOpen: false,
      brandId: b._id,
    });
    setSizeSearch("");
  };

  const handleSubmitBox = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }
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
        (!item.description && !item.descriptionId) ||
        !item.style ||
        (!item.size && !item.sizeId) ||
        (!item.brand && !item.brandId) ||
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
        currentItem.size ||
        currentItem.brand ||
        currentItem.quantity ||
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
        setBoxDescription("");
        setBoxDiscount(20);
        setBoxLocation("");
        setImageUrl("");
        setContents([]);
        setVisibility(["admin"]);
        setMinimumPrice(0);

        setPage("qr");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOptDb = async (selectedOption, newItem, index) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const response = await addOption(selectedOption, newItem);

    if (index) {
      if (selectedOption === "description") {
        updateExistingContent(index, "description", response.description);
        updateExistingContent(index, "descriptionId", response._id);
        updateExistingContent(index, "descriptionOpen", false);
      } else if (selectedOption === "brand") {
        updateExistingContent(index, "brand", response.brand);
        updateExistingContent(index, "brandId", response._id);
        updateExistingContent(index, "brandOpen", false);
      } else if (selectedOption === "size") {
        updateExistingContent(index, "size", response.size);
        updateExistingContent(index, "sizeId", response._id);
        updateExistingContent(index, "sizeOpen", false);
      }
    } else {
      if (selectedOption === "description") {
        setCurrentItem({
          ...currentItem,
          description: response.description,
          descriptionId: response._id,
          descriptionOpen: false,
        });
      }
      else if (selectedOption === "brand") {
        setCurrentItem({
          ...currentItem,
          brand: response.brand,
          brandId: response._id,
          brandOpen: false,
        });
      }
      else if (selectedOption === "size") {
        setCurrentItem({
          ...currentItem,
          size: response.size,
          sizeId: response._id,
          sizeOpen: false,
        });
      }
    }

    setIsSubmitting(false);
  };

  const addOption = async (selectedOption, newItem) => {
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
        console.error("Details:", data.details);
        alert("Error creating item: " + (data.error || "Unknown error"));
        return false;
      }

      console.log("Item created successfully:", data.data);
      console.log("Message:", data.message);

      // Clear form after successful submission
      refresh();
      return data.data;
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
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
        throw new Error(data.error || "Unknown error creating box");
      }

      console.log("Box created successfully:", data.data);
      console.log("Message:", data.message);

      setBox(data.data);

      const boxId = data.data._id;

      console.log("contents-", contents);
      // Create all items with proper error handling
      for (const content of contents) {
        try {
          const itemData = {
            box_id: boxId,
            image: content.imageUrl,
            style: content.style,
            color: content.color,
            quantity: content.quantity,
            price: content.price,
            sale: visibility.includes("sale"),
            public: visibility.includes("public"),
          };

          /**
           * If there is a description, brand, or size Id, then that will be what is
           * uploaded, so a change to one of these fields will affect all that have
           * that same id
           */
          if (content.descriptionId)
            itemData.descriptionId = content.descriptionId;
          else itemData.description = content.description;

          if (content.brandId) itemData.brandId = content.brandId;
          else itemData.brand = content.brand;

          if (content.sizeId) itemData.sizeId = content.sizeId;
          else itemData.size = content.size;

          const itemResponse = await fetch("/api/inventory/item", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemData),
          });

          const itemResult = await itemResponse.json();

          if (!itemResult.success) {
            console.error("Error creating item:", itemResult.error);
            console.error("Details:", itemResult.details);
            throw new Error(itemResult.error || "Unknown error creating item");
          }

          console.log("Item created successfully:", itemResult.data);
          console.log("Message:", itemResult.message);
        } catch (itemError) {
          console.error(`Error processing item:`, itemError);
          throw itemError;
        }
      }

      // Clear saved info only after successful submission
      setSavedInfo({
        ...savedInfo,
        addBox: {},
      });

      return true;
    } catch (error) {
      console.error("Network error:", error);
      throw error;
    }
  }

  const generateDescription = (e) => {
    e.preventDefault();

    let retString = "";

    contents.forEach((item) => {
      retString =
        retString +
        "• " +
        (item.size || sizeDict[item.sizeId].size) +
        " " +
        item.color +
        " " +
        (item.description || descriptionDict[item.descriptionId].description) +
        " (" +
        item.style +
        ")\n";
    });

    setBoxDescription(retString);
  };

  const getDescription = (desc) => {
    for (const description of options.descriptions) {
      if (description.description == desc) {
        return description;
      }
    }
  };

  const sizeDict = useMemo(() => {
    const dict = {};
    if(!options.sizes) return {}
    options.sizes.forEach((item) => {
     dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

  const descriptionDict = useMemo(() => {
    if(!options.descriptions) return {}
    const dict = {};
    options.descriptions.forEach((item) => {
     dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

  const brandDict = useMemo(() => {
    if(!options.brands) return {}
    const dict = {};
    options.brands.forEach((item) => {
     dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

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
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <label>Box Inventory</label>
            <label style={{cursor:"pointer"}}onClick={() => setPage("edit")}>Edit presets →</label>
            </div>
            <div style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
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

                        {/* Image upload options dropdown */}
                        {showImageOptions === index && (
                          <div className={styles.dropdown} data-image-options>
                            <div
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                              onClick={() => handleFileUploadOption(index)}
                              onMouseEnter={(e) =>
                                (e.target.style.backgroundColor = "#f5f5f5")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = "white")
                              }
                              data-image-options
                            >
                              <FaUpload style={{ fontSize: "14px" }} />
                              Upload from Computer
                            </div>
                            <div
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                              onClick={() => handleUrlOption(index)}
                              onMouseEnter={(e) =>
                                (e.target.style.backgroundColor = "#f5f5f5")
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = "white")
                              }
                              data-image-options
                            >
                              <FaLink style={{ fontSize: "14px" }} />
                              Enter Image URL
                            </div>
                          </div>
                        )}

                        {/* URL input for existing items */}
                        {showUrlInput === index && (
                          <div
                            className={styles.dropdown}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              padding: "8px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              zIndex: 9999,
                              minWidth: "200px",
                            }}
                            data-image-options
                          >
                            <input
                              type="text"
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              placeholder="Enter image URL..."
                              className={styles.input}
                              style={{
                                margin: 0,
                                width: "100%",
                                marginBottom: "8px",
                              }}
                              data-image-options
                            />
                            <div
                              style={{ display: "flex", gap: "4px" }}
                              data-image-options
                            >
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleUrlSubmit(e, "content", index)
                                }
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  backgroundColor: "#007bff",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                }}
                                data-image-options
                              >
                                Use
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowUrlInput(false);
                                  setImageUrlInput("");
                                  setShowImageOptions(null);
                                }}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  backgroundColor: "#6c757d",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                }}
                                data-image-options
                              >
                                Cancel
                              </button>
                            </div>
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
                              item.descriptionOpen
                                ? descriptionSearch
                                : item.description
                            }
                            onClick={() => {
                              updateExistingContent(
                                index,
                                "descriptionOpen",
                                true
                              );
                              setDescriptionSearch(item.description);
                            }}
                            onChange={(e) => {
                              if (item.descriptionOpen) {
                                setDescriptionSearch(e.target.value);
                              }
                            }}
                            onFocus={() => {
                              updateExistingContent(
                                index,
                                "descriptionOpen",
                                true
                              );
                              setDescriptionSearch(item.description);
                            }}
                            placeholder={
                              item.descriptionOpen
                                ? "Search descriptions..."
                                : ""
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                              caretColor: item.descriptionOpen
                                ? "auto"
                                : "transparent",
                            }}
                            data-description-dropdown
                          />
                          {item.descriptionOpen && (
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
                                        updateExistingContent(
                                          index,
                                          "description",
                                          opt.description
                                        );
                                        updateExistingContent(
                                          index,
                                          "descriptionId",
                                          opt._id
                                        );
                                        updateExistingContent(
                                          index,
                                          "descriptionOpen",
                                          false
                                        );
                                        setDescriptionSearch("");
                                      }}
                                      style={{
                                        padding: "8px 12px",
                                        cursor: "pointer",
                                        borderBottom:
                                          oIndex <
                                          filteredDescriptions.length - 1
                                            ? "1px solid #eee"
                                            : "none",
                                      }}
                                      onMouseEnter={(e) =>
                                        (e.target.style.backgroundColor =
                                          "#f5f5f5")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.backgroundColor =
                                          "white")
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
                                    onClick={() => setPage("option")}
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
                                    addOptDb(
                                      "description",
                                      descriptionSearch,
                                      index
                                    );
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
                                    updateExistingContent(
                                      index,
                                      "description",
                                      descriptionSearch
                                    );
                                    updateExistingContent(
                                      index,
                                      "descriptionId",
                                      null
                                    );
                                    updateExistingContent(
                                      index,
                                      "descriptionOpen",
                                      false
                                    );
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
                        <div
                          style={{ position: "relative" }}
                          data-brand-dropdown
                        >
                          <input
                            value={item.brandOpen ? brandSearch : item.brand}
                            onClick={() => {
                              updateExistingContent(index, "brandOpen", true);
                              setBrandSearch(item.brand);
                            }}
                            onChange={(e) => {
                              if (item.brandOpen) {
                                setBrandSearch(e.target.value);
                              }
                            }}
                            onFocus={() => {
                              updateExistingContent(index, "brandOpen", true);
                              setBrandSearch(item.brand);
                            }}
                            placeholder={
                              item.brandOpen ? "Search brands..." : ""
                            }
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                              caretColor: item.brandOpen
                                ? "auto"
                                : "transparent",
                            }}
                            data-brand-dropdown
                          />
                          {item.brandOpen && (
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
                                        updateExistingContent(
                                          index,
                                          "brand",
                                          opt.brand
                                        );
                                        updateExistingContent(
                                          index,
                                          "brandId",
                                          opt._id
                                        );
                                        updateExistingContent(
                                          index,
                                          "brandOpen",
                                          false
                                        );
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
                                        (e.target.style.backgroundColor =
                                          "#f5f5f5")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.backgroundColor =
                                          "white")
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
                                    onClick={() => setPage("option")}
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
                                    addOptDb("brand", brandSearch, index);
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
                                    updateExistingContent(
                                      index,
                                      "brand",
                                      brandSearch
                                    );
                                    updateExistingContent(
                                      index,
                                      "brandId",
                                      null
                                    );
                                    updateExistingContent(
                                      index,
                                      "brandOpen",
                                      false
                                    );
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
                            value={item.sizeOpen ? sizeSearch : item.size}
                            onClick={() => {
                              updateExistingContent(index, "sizeOpen", true);
                              setSizeSearch(item.size);
                            }}
                            onChange={(e) => {
                              if (item.sizeOpen) {
                                setSizeSearch(e.target.value);
                              }
                            }}
                            onFocus={() => {
                              updateExistingContent(index, "sizeOpen", true);
                              setSizeSearch(item.size);
                            }}
                            placeholder={item.sizeOpen ? "Search sizes..." : ""}
                            className={styles.input}
                            style={{
                              margin: 0,
                              minHeight: "auto",
                              width: "100%",
                              caretColor: item.sizeOpen
                                ? "auto"
                                : "transparent",
                            }}
                            data-size-dropdown
                          />
                          {item.sizeOpen && (
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
                                        updateExistingContent(
                                          index,
                                          "size",
                                          opt.size
                                        );
                                        updateExistingContent(
                                          index,
                                          "sizeId",
                                          opt._id
                                        );
                                        updateExistingContent(
                                          index,
                                          "sizeOpen",
                                          false
                                        );
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
                                        (e.target.style.backgroundColor =
                                          "#f5f5f5")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.backgroundColor =
                                          "white")
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
                                    onClick={() => setPage("option")}
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
                                    addOptDb("size", sizeSearch, index);
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
                                    updateExistingContent(
                                      index,
                                      "size",
                                      sizeSearch
                                    );
                                    updateExistingContent(
                                      index,
                                      "sizeId",
                                      null
                                    );
                                    updateExistingContent(
                                      index,
                                      "sizeOpen",
                                      false
                                    );
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
                            updateExistingContent(
                              index,
                              "price",
                              e.target.value
                            )
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
                      <td
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "100%",
                          height: "60px",
                          gap: "20px",
                        }}
                      >
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
                                setCurrentItem({ ...currentItem, imageUrl: "" })
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
                                          oIndex <
                                          filteredDescriptions.length - 1
                                            ? "1px solid #eee"
                                            : "none",
                                      }}
                                      onMouseEnter={(e) =>
                                        (e.target.style.backgroundColor =
                                          "#f5f5f5")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.backgroundColor =
                                          "white")
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
                                    onClick={() => setPage("option")}
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
                                    addOptDb(
                                      "description",
                                      descriptionSearch,
                                      null
                                    );
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
                                        (e.target.style.backgroundColor =
                                          "#f5f5f5")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.backgroundColor =
                                          "white")
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
                                    onClick={() => setPage("option")}
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
                                    addOptDb(
                                      "brand",
                                      brandSearch,
                                      null
                                    );
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
                                        (e.target.style.backgroundColor =
                                          "#f5f5f5")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.backgroundColor =
                                          "white")
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
                                    onClick={() => setPage("option")}
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
                                    addOptDb(
                                      "size",
                                      sizeSearch,
                                      null
                                    );
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
                                right: "-15px",
                                fontSize: "30px",
                                color: "red",
                              }}
                              onClick={() =>
                                setCurrentItem({ ...currentItem, imageUrl: "" })
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
                      <div
                        className={styles.mobileValue}
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
                          placeholder={
                            currentItem.descriptionOpen
                              ? "Search brands..."
                              : ""
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            width: "100%",
                            caretColor: currentItem.descriptionOpen
                              ? "auto"
                              : "transparent",
                          }}
                          data-description-dropdown
                        />
                        {currentItem.descriptionOpen && (
                          <div
                            className={styles.dropdownAlt}
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              zIndex: 1000,
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              maxHeight: "300px",
                              overflowY: "auto",
                            }}
                            data-description-dropdown
                          >
                            {/* Brand options */}
                            <div data-description-dropdown>
                              {filteredDescriptions.length > 0 ? (
                                filteredDescriptions.map((opt, oIndex) => (
                                  <div
                                    key={oIndex}
                                    className={styles.dropdownItem}
                                    onClick={() => handleDescriptionSelect(opt)}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom:
                                        oIndex < filteredDescriptions.length - 1
                                          ? "1px solid #eee"
                                          : "none",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.target.style.backgroundColor =
                                        "#f5f5f5")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.target.style.backgroundColor = "white")
                                    }
                                    data-description-dropdown
                                  >
                                    <strong>{opt.description}</strong>
                                  </div>
                                ))
                              ) : descriptionSearch ? (
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
                                  No descriptions available
                                  <div
                                    onClick={() => setPage("option")}
                                    style={{
                                      color: "#007bff",
                                      cursor: "pointer",
                                      marginTop: "4px",
                                      textDecoration: "underline",
                                    }}
                                    data-description-dropdown
                                  >
                                    Add new description?
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
                      <div
                        className={styles.mobileValue}
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
                          placeholder={
                            currentItem.brandOpen ? "Search brands..." : ""
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            width: "100%",
                            caretColor: currentItem.brandOpen
                              ? "auto"
                              : "transparent",
                          }}
                          data-brand-dropdown
                        />
                        {currentItem.brandOpen && (
                          <div
                            className={styles.dropdownAlt}
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              zIndex: 1000,
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              maxHeight: "300px",
                              overflowY: "auto",
                            }}
                            data-brand-dropdown
                          >
                            {/* Brand options */}
                            <div data-brand-dropdown>
                              {filteredBrands.length > 0 ? (
                                filteredBrands.map((opt, oIndex) => (
                                  <div
                                    key={oIndex}
                                    className={styles.dropdownItem}
                                    onClick={() => handleBrandSelect(opt)}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom:
                                        oIndex < filteredBrands.length - 1
                                          ? "1px solid #eee"
                                          : "none",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.target.style.backgroundColor =
                                        "#f5f5f5")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.target.style.backgroundColor = "white")
                                    }
                                    data-brand-dropdown
                                  >
                                    <strong>{opt.brand}</strong>
                                  </div>
                                ))
                              ) : brandSearch ? (
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
                                  No brands available
                                  <div
                                    onClick={() => setPage("option")}
                                    style={{
                                      color: "#007bff",
                                      cursor: "pointer",
                                      marginTop: "4px",
                                      textDecoration: "underline",
                                    }}
                                    data-brand-dropdown
                                  >
                                    Add new brand?
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.mobileField}>
                      <label className={styles.mobileLabel}>Size</label>
                      <div
                        className={styles.mobileValue}
                        style={{ position: "relative" }}
                        data-size-dropdown
                      >
                        <input
                          value={
                            currentItem.sizeOpen ? sizeSearch : currentItem.size
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
                          placeholder={
                            currentItem.sizeOpen ? "Search sizes..." : ""
                          }
                          className={styles.input}
                          style={{
                            margin: 0,
                            width: "100%",
                            caretColor: currentItem.sizeOpen
                              ? "auto"
                              : "transparent",
                          }}
                          data-size-dropdown
                        />
                        {currentItem.sizeOpen && (
                          <div
                            className={styles.dropdownAlt}
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              zIndex: 1000,
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              maxHeight: "300px",
                              overflowY: "auto",
                            }}
                            data-size-dropdown
                          >
                            {/* Size options */}
                            <div data-size-dropdown>
                              {filteredSizes.length > 0 ? (
                                filteredSizes.map((opt, oIndex) => (
                                  <div
                                    key={oIndex}
                                    className={styles.dropdownItem}
                                    onClick={() => handleSizeSelect(opt)}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom:
                                        oIndex < filteredSizes.length - 1
                                          ? "1px solid #eee"
                                          : "none",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.target.style.backgroundColor =
                                        "#f5f5f5")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.target.style.backgroundColor = "white")
                                    }
                                    data-size-dropdown
                                  >
                                    <strong>{opt.size}</strong>
                                  </div>
                                ))
                              ) : sizeSearch ? (
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
                                  No sizes available
                                  <div
                                    onClick={() => setPage("option")}
                                    style={{
                                      color: "#007bff",
                                      cursor: "pointer",
                                      marginTop: "4px",
                                      textDecoration: "underline",
                                    }}
                                    data-size-dropdown
                                  >
                                    Add new size?
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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

          <div>
            <label style={{ fontWeight: "bold" }}>Visibility</label>
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
                  value={`${minimumPrice}`}
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
