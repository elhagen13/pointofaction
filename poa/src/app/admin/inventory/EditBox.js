"use client";
import styles from "./inventory.module.css";
import { useState, useEffect } from "react";
import {
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaRegCopy,
  FaBoxOpen,
  FaSearch,
} from "react-icons/fa";
import { IoIosAddCircle, IoIosCheckmarkCircle } from "react-icons/io";
import { RiSwapBoxLine, RiSwapBoxFill } from "react-icons/ri";

import jsPDF from "jspdf";

export default function EditItem({
  box,
  onClose,
  refresh,
  selectedItem,
  setSelectedItem,
  boxes,
}) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      refresh();
      setSelectedItem(null);
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
        <AddBox
          box={box}
          onClose={onClose}
          refresh={refresh}
          selectedItem={selectedItem}
          boxes={boxes}
        />
      </div>
    </div>
  );
}

const AddBox = ({ box, onClose, refresh, selectedItem, boxes }) => {
  const [boxDescription, setBoxDescription] = useState(box.description);
  const [boxLocation, setBoxLocation] = useState(box.location);
  const [contents, setContents] = useState([]);
  const [originalContents, setOriginalContents] = useState([]);
  const [imageUrl, setImageUrl] = useState(box.image);
  const [minimumPrice, setMinimumPrice] = useState(box.minPrice);
  /*admin (always clicked), public inventory, sale*/
  const [visibility, setVisibility] = useState(["admin"]);
  const [boxDiscount, setBoxDiscount] = useState(box.discount ?? 20);
  const [currentItem, setCurrentItem] = useState({
    image: "",
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(null);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");
  let acknowledgement = false;
  const [boxDict, setBoxDict] = useState({});

  useEffect(() => {
    const getContent = async () => {
      const response = await fetch("/api/inventory/item", {
        method: "GET",
      });
      const result = await response.json();

      const matchingItems = result.data.filter(
        (item) => item.boxId === box._id
      );
      setContents(matchingItems);
      setOriginalContents(matchingItems);

      const newBoxDict = {};
      for (const item of result.data) {
        if (item.boxId && !newBoxDict[item.boxId]) {
          newBoxDict[item.boxId] = {};
          newBoxDict[item.boxId].public = item.public;
          newBoxDict[item.boxId].sale = item.sale;
        }
      }
      setBoxDict(newBoxDict);
    };
    getContent();
  }, []);

  useEffect(() => {
    const newVisibility = [];
    if (contents[0]?.public) newVisibility.push("public");
    if (contents[0]?.sale) newVisibility.push("sale");
    setVisibility(newVisibility);
  }, [contents]);

  // Filter boxes based on search term
  const filteredBoxes = boxes.filter(b => 
    b.boxId.toLowerCase().includes(dropdownSearchTerm.toLowerCase()) ||
    b.description?.toLowerCase().includes(dropdownSearchTerm.toLowerCase()) ||
    b.location?.toLowerCase().includes(dropdownSearchTerm.toLowerCase())
  );

  const downloadBoxPDF = async () => {
    try {
      const pdf = new jsPDF({
  orientation: "portrait",
  unit: "in",
  format: [4, 6],
  putOnlyUsedFonts: true,
  compress: true
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
    e.preventDefault()
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
      console.log(contents);
      setContents((prevContents) =>
        prevContents.map((item, index) =>
          index === itemIndex ? { ...item, image: imageUrlInput } : item
        )
      );
    } else if (type === "content") {
      // Update current item being added
      setCurrentItem({
        ...currentItem,
        image: imageUrlInput,
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

  const removeItem = async (indexToRemove) => {
    setContents((prevContents) =>
      prevContents.filter((_, index) => index !== indexToRemove)
    );
  };

  const copyItem = async (indexToCopy) => {
    const { _id, ...itemToCopy } = contents[indexToCopy];
    setContents([...contents, itemToCopy]);
  };

  const removeItemDB = async (id) => {
    const itemResponse = await fetch(`/api/inventory/item/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await itemResponse.json();

    if (!data.success) {
      console.error("Error deleting item:", data.error);
      console.error("Details:", data.details);
      alert("Error creating item: " + (data.error || "Unknown error"));
      return false;
    }

    console.log("Box created successfully:", data.data);
    console.log("Message:", data.message);
  };

  const addNewItem = () => {
    if (currentItem.description.trim() === "") {
      setUploadError("Please enter a description for the item");
      return;
    }
    console.log("contents", contents);
    console.log("current", currentItem);

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
        currentItem.image ||
        currentItem.price ||
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
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      refresh();
      onClose();
    }
  };

  useEffect(() => {
    console.log(visibility);
  }, [visibility]);

  async function uploadBox() {
    try {
      /*Go through original contents, if there is an id that exists
      that is not in the current contents, then it needs to be deleted*/
      for (const original of originalContents) {
        let match = false;
        for (const item of contents) {
          if (!item._id) break;
          if (item._id == original._id) {
            match = true;
            break;
          }
        }
        if (!match) {
          removeItemDB(original._id);
        }
      }

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

      const boxResponse = await fetch(`/api/inventory/box/${box._id}`, {
        method: "PATCH",
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

      const boxId = data.data._id;

      for (const content of contents) {
        if (content.removed) {
          //if a removed tag has been added to the item meaning that it has
          //been taken out of the box
          removeFromBox(content);
        } else {
          const itemData = {
            box_id: content.boxId ? content.boxId : boxId,
            image: content.image,
            description: content.description,
            style: content.style,
            size: content.size,
            color: content.color,
            quantity: content.quantity,
            price: content.price,
            sale:
              content.boxId === boxId
                ? visibility.includes("sale")
                : boxDict[content.boxId].sale,
            public:
              content.boxId === boxId
                ? visibility.includes("public")
                : boxDict[content.boxId].public,
          };
          console.log(itemData);

          let itemResponse;
          if (!content._id) {
            itemResponse = await fetch(`/api/inventory/item`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(itemData),
            });
          } else {
            itemResponse = await fetch(`/api/inventory/item/${content._id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(itemData),
            });
          }

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
      }

      alert("Box and all items updated successfully!");
      return true;
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  async function handleDelete(opt, e) {
    e.preventDefault();
    try {
      if (opt === "all") {
        // Delete all items in the box
        for (const item of contents) {
          if (item._id) {
            const itemResponse = await fetch(
              `/api/inventory/item/${item._id}`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const itemResult = await itemResponse.json();

            if (!itemResult.success) {
              console.error("Error deleting item:", itemResult.error);
              // Continue deleting other items even if one fails
            }
          }
        }
      } else {
        for (const content of contents) {
          removeFromBox(content);
        }
      }

      const boxResponse = await fetch(`/api/inventory/box/${box._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const deleteResult = await boxResponse.json();

      if (!deleteResult.success) {
        console.error("Error deleting box:", deleteResult.error);
        alert("Error deleting box: " + (deleteResult.error || "Unknown error"));
        return;
      }

      if (opt === "all") alert("Box and all items deleted successfully!");
      else alert("Box and all items deleted successfully!");

      // Refresh the inventory and close the modal
      refresh();
      onClose();
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
    }
  }

  const removeFromBox = async (content) => {
    const itemData = {
      image: content.image,
      description: content.description,
      style: content.style,
      size: content.size,
      color: content.color,
      quantity: content.quantity,
      price: content.price,
      sale: visibility.includes("sale"),
      public: visibility.includes("public"),
      location: boxLocation,
    };

    if (visibility.includes("sale")) {
      itemData.discount = boxDiscount;
      itemData.minPrice = minimumPrice;
    }

    let itemResponse;
    if (!content._id) {
      itemResponse = await fetch(`/api/inventory/item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });
    } else {
      itemResponse = await fetch(`/api/inventory/item/${content._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });
    }

    const itemResult = await itemResponse.json();

    if (itemResult.success) {
      console.log("Items successfully removed from box:", itemResult.data);
      console.log("Message:", itemResult.message);
    } else {
      console.error("Error creating item:", itemResult.error);
      console.error("Details:", itemResult.details);
      alert(
        "Error removing from box: " + (itemResult.error || "Unknown error")
      );
      return false;
    }
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen !== null && !event.target.closest("[data-dropdown]")) {
        setIsDropdownOpen(null);
        setDropdownSearchTerm(""); // Clear search when closing dropdown
      }
    };

    if (isDropdownOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleDropdownToggle = (index) => {
    if (isDropdownOpen === index) {
      setIsDropdownOpen(null);
      setDropdownSearchTerm("");
    } else {
      setIsDropdownOpen(index);
      setDropdownSearchTerm("");
    }
  };

  return (
    <div style={{ overflowX: "scroll", color: "black" }}>
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <h2>Edit Box {box.boxId}</h2>
          <button className={styles.button} onClick={downloadBoxPDF}>
            Download QR{" "}
          </button>
        </div>
        <form
          className={styles.form}
          style={{ marginTop: "30px" }}
          onSubmit={handleSubmitBox}
        >
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
                        selectedItem === item._id
                          ? "#466fb3"
                          : index % 2 === 0
                            ? "#dae2eb"
                            : "#ccd5e0",
                    }}
                  >
                    <td
                      className={styles.tableSm}
                      style={{ position: "relative" }}
                    >
                      <img
                        src={item.image}
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
                    <td style={{display:"flex", flexDirection:"row", height:"60px", alignItems:"center"}}>
                    <div
                        className={styles.trash}
                        onClick={() => handleDropdownToggle(index)}
                        style={{
                          cursor: "pointer",
                          color: selectedItem === item._id ? "white" : "black",
                        }}
                        data-dropdown
                      >
                        {item.removed ? 
                          <FaBoxOpen/>
                         :
                        item.boxId === box._id || !item.boxId ? 
                          <RiSwapBoxLine />
                         : 
                          <RiSwapBoxFill />
                        }
                      </div>

                      {isDropdownOpen === index && (
                        <div className={styles.dropdown} data-dropdown>
                          {/* Search input */}
                          <div 
                            className={styles.dropdownSearchContainer}
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #ccc",
                              position: "sticky",
                              top: 0,
                              backgroundColor: "white",
                              zIndex: 1
                            }}
                            data-dropdown
                          >
                            <div style={{ position: "relative" }} data-dropdown>
                              <FaSearch 
                                style={{
                                  position: "absolute",
                                  left: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: "#666",
                                  fontSize: "12px"
                                }}
                              />
                              <input
                                type="text"
                                placeholder="Search boxes..."
                                value={dropdownSearchTerm}
                                onChange={(e) => setDropdownSearchTerm(e.target.value)}
                                className={styles.input}
                                style={{
                                  margin: 0,
                                  padding: "4px 4px 4px 24px",
                                  fontSize: "12px",
                                  minHeight: "auto",
                                  width: "100%",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px"
                                }}
                                data-dropdown
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          
                          {/* Remove from box option */}
                          <div
                            key="removed"
                            className={`${styles.dropdownItem} ${item.removed ? styles.selected : ""}`}
                            onClick={() => {
                              updateExistingContent(index, "removed", true);
                              updateExistingContent(index, "boxId", null);
                              setIsDropdownOpen(null);
                              setDropdownSearchTerm("");
                            }}
                            data-dropdown
                          >
                            Remove from Box
                          </div>
                          {filteredBoxes.length > 0 ? (
                            filteredBoxes.map((b, boxIndex) => (
                              <div
                                key={boxIndex}
                                className={`${styles.dropdownItem} ${
                                  !item.removed && ((!item.boxId && b.boxId === box.boxId) || item.boxId === b._id)
                                    ? styles.selected
                                    : ""
                                }`}
                                onClick={() => {
                                  updateExistingContent(index, "removed", false);
                                  updateExistingContent(index, "boxId", b._id);
                                  setIsDropdownOpen(null);
                                  setDropdownSearchTerm("");
                                }}
                                data-dropdown
                                title={`${b.boxId} - ${b.description || ''} (${b.location || ''})`}
                              >
                                <div data-dropdown>
                                  <strong>{b.boxId}</strong>
                                </div>
                              </div>
                            ))
                          ) : dropdownSearchTerm ? (
                            <div 
                              className={styles.dropdownItem} 
                              style={{ color: "#999", fontStyle: "italic" }}
                              data-dropdown
                            >
                              No boxes found matching "{dropdownSearchTerm}"
                            </div>
                          ) : null}
                        </div>
                      )}
                      <div
                        className={styles.trash}
                        onClick={() => copyItem(index)}
                        style={{
                          cursor: "pointer",
                          color: selectedItem === item._id ? "white" : "black",
                        }}
                      >
                        <FaRegCopy />
                      </div>
                      <div
                        className={styles.trash}
                        onClick={() => removeItem(index)}
                        style={{
                          cursor: "pointer",
                          color: selectedItem === item._id ? "white" : "black",
                        }}
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
                <table style={{ width: "100%", textAlign: "left" }}
                className={`${styles.boxTable} ${styles.desktopTable}`}>
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
                          width: currentItem.image !== "" ? "50px" : "150px",
                        }}
                      >
                        {currentItem.image !== "" ? (
                          <img
                            src={currentItem.image}
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
                {/*Mobile Styles*/}
                <div className={`${styles.mobileTable}`}>
                  <div className={styles.mobileRow}>
                    <div className={styles.mobileField}>
                      <label className={styles.mobileLabel}>Image</label>
                      <div className={styles.mobileValue}>
                        {currentItem.image !== "" ? (
                          <img
                            src={currentItem.image}
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
                  value={`${minimumPrice || "0"}`}
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
            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              <button
                className={styles.button}
                style={{ backgroundColor: "#a83a32" }}
                onClick={(e) => handleDelete("all", e)}
              >
                Delete All
              </button>
              <button
                className={styles.button}
                style={{
                  backgroundColor: "white",
                  color: "#a83a32",
                  border: "2px solid #a83a32",
                }}
                onClick={(e) => handleDelete("box", e)}
              >
                Delete Box
              </button>
            </div>
            <button className={styles.button} type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};