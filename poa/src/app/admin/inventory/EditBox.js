"use client";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo } from "react";
import {
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaBookmark,
  FaPlus,
  FaRegCopy,
  FaBoxOpen,
  FaSearch,
} from "react-icons/fa";
import {
  IoIosAddCircle,
  IoIosCheckmarkCircle,
  IoIosRemoveCircle,
} from "react-icons/io";
import { RiSwapBoxLine, RiSwapBoxFill } from "react-icons/ri";
import EditPresets from "@/app/components/admin/editPresets/EditPresets";

import jsPDF from "jspdf";

export default function EditItem({
  box,
  onClose,
  refresh,
  selectedItem,
  setSelectedItem,
  boxes,
  options,
}) {
  const [page, setPage] = useState("add");

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
      <div
        className={styles.addItem}
        onClick={handleModalClick}
        style={{ width: page == "success" && "auto" }}
      >
        {page === "add" && (
          <AddBox
            box={box}
            onClose={onClose}
            refresh={refresh}
            selectedItem={selectedItem}
            boxes={boxes}
            setPage={setPage}
            options={options}
          />
        )}
        {page === "success" && <Success />}
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

const Success = () => {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <IoIosCheckmarkCircle style={{ fontSize: "64px", color: "green" }} />
      <div style={{ fontSize: "2rem" }}>Item successfully edited!</div>
    </div>
  );
};

const AddBox = ({
  box,
  onClose,
  refresh,
  selectedItem,
  boxes,
  setPage,
  options,
}) => {
  const [boxDescription, setBoxDescription] = useState(box.description || "");
  const [boxLocation, setBoxLocation] = useState(box.location);
  const [contents, setContents] = useState([]);
  const [originalContents, setOriginalContents] = useState([]);
  const [imageUrl, setImageUrl] = useState(box.image);
  const [minimumPrice, setMinimumPrice] = useState(box.minPrice);
  /*admin (always clicked), public inventory, sale*/
  const [visibility, setVisibility] = useState(["admin"]);
  const [boxDiscount, setBoxDiscount] = useState(box.discount ?? 20);
  const [currentItem, setCurrentItem] = useState({
    image:
      "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
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
  const [showImageOptions, setShowImageOptions] = useState(null);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(null);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");
  const [acknowledgement, setAcknowledgement] = useState(false);
  const [boxDict, setBoxDict] = useState({});

  // New state for description search
  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");

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

    return options.brands.filter((desc) =>
      desc.brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [options?.brands, brandSearch]);

  const filteredSizes = useMemo(() => {
    if (!options?.sizes) return [];

    if (!sizeSearch || !sizeSearch.trim()) {
      return options.sizes;
    }

    return options.sizes.filter((desc) =>
      desc.size.toLowerCase().includes(sizeSearch.toLowerCase())
    );
  }, [options?.sizes, sizeSearch]);

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
  const filteredBoxes = boxes.filter(
    (b) =>
      b.boxId.toLowerCase().includes(dropdownSearchTerm.toLowerCase()) ||
      b.description?.toLowerCase().includes(dropdownSearchTerm.toLowerCase()) ||
      b.location?.toLowerCase().includes(dropdownSearchTerm.toLowerCase())
  );

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.size.toLowerCase().trim()] = item;

    });
    return dict;
  }, [options]);

  const descriptionDict = useMemo(() => {
    const dict = {};
    if (!options.descriptions) return {};

    options.descriptions.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.description.toLowerCase().trim()] = item;
    });
    return dict;
  }, [options]);



  const brandDict = useMemo(() => {
    if (!options.brands) return {};
    const dict = {};
    options.brands.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.brand.toLowerCase().trim()] = item;

    });
    return dict;
  }, [options]);

  const getDescription = (item) => {
    let des = "";
    if (item.descriptionId && descriptionDict[item.descriptionId.toString()])
      des = descriptionDict[item.descriptionId.toString()].description;
    else if (item.description) des = item.description;
    else return "N/A";
    return des.length > 50 ? des.slice(0, 50) + "..." : des;
  };

  const getBrand = (item) => {
    let brand = "";
    if (item.brandId && brandDict[item.brandId.toString()])
      brand = brandDict[item.brandId.toString()].brand;
    else if (item.brand) brand = item.brand;
    else return "N/A";
    return brand;
  };

  const getSize = (item) => {
    let size = "";
    if (item.sizeId && sizeDict[item.sizeId.toString()])
      size = sizeDict[item.sizeId.toString()].size;
    else if (item.size) size = item.size;
    else return "N/A";
    return size;
  };

  const downloadBoxPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: [4, 6],
        putOnlyUsedFonts: true,
        compress: true,
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
    // Hide image options after selection
    setShowImageOptions(null);
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
    setShowImageOptions(null); // Hide options after URL submission
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
              index === itemIndex ? { ...item, image: result.url } : item
            )
          );
        } else if (type === "content") {
          // Update current item being added
          setCurrentItem({
            ...currentItem,
            image: result.url,
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

  // Handle clicking on thumbnail to show options
  const handleThumbnailClick = (index) => {
    setSelectedItemIndex(index);
    setShowImageOptions(index);
  };

  useEffect(() => {
    console.log(selectedItemIndex, showImageOptions);
  }, [selectedItemIndex, showImageOptions]);

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
      throw new Error(data.error || "Unknown error deleting item");
    }

    console.log("Item deleted successfully:", data.data);
    console.log("Message:", data.message);
    return data;
  };

  const addNewItem = () => {
    if (currentItem.description.trim() === "") {
      setUploadError("Please enter a description for the item");
      return;
    }

    setContents((prevContents) => [...prevContents, { ...currentItem }]);
    setCurrentItem({
      image:
        "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
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

  const cancelNewItem = () => {
    setCurrentItem({
      image:
        "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp",
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

    if (isSubmitting) {
      return;
    }

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
        currentItem.quantity ||
        currentItem.size ||
        currentItem.style)
    ) {
      alert(
        "Warning: New item not finalized, click the checkmark to the right of the item to add."
      );
      setAcknowledgement(true);
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
      alert("Error submitting form: " + error.message);
    } finally {
      setIsSubmitting(false); // Always reset, even on error
      refresh();
    }
  };

  const positionDropdown = (dropdownElement, triggerElement) => {
    if (!dropdownElement || !triggerElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const dropdownRect = dropdownElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Check if there's enough space below
    const spaceBelow = viewport.height - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const dropdownHeight = dropdownRect.height || 200; // fallback height

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      // Position above
      dropdownElement.classList.add("dropdown-up");
      dropdownElement.style.top = "auto";
      dropdownElement.style.bottom = "100%";
      dropdownElement.style.marginTop = "0";
      dropdownElement.style.marginBottom = "5px";
    } else {
      // Position below (default)
      dropdownElement.classList.remove("dropdown-up");
      dropdownElement.style.top = "100%";
      dropdownElement.style.bottom = "auto";
      dropdownElement.style.marginTop = "5px";
      dropdownElement.style.marginBottom = "0";
    }
  };

  async function uploadBox() {
    try {
      const itemsToDelete = originalContents.filter((original) => {
        return !contents.some(
          (current) => current._id && current._id === original._id
        );
      });

      for (const itemToDelete of itemsToDelete) {
        try {
          await removeItemDB(itemToDelete._id);
        } catch (error) {
          console.error(`Failed to delete item ${itemToDelete._id}:`, error);
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
        console.error("Error updating box:", data.error);
        console.error("Details:", data.details);
        throw new Error(data.error || "Unknown error updating box");
      }

      console.log("Box updated successfully:", data.data);
      const boxId = data.data._id;

      for (const content of contents) {
        console.log("content", content);
        try {
          if (content.removed) {
            await removeFromBox(content);
          } else {
            const itemData = {
              box_id: content.boxId ? content.boxId : boxId,
              image: content.image,
              style: content.style,
              color: content.color,
              quantity: content.quantity,
              price: content.price,
              sale:
                content.boxId === boxId
                  ? visibility.includes("sale")
                  : boxDict[content.boxId]
                    ? boxDict[content.boxId].sale
                    : false,
              public:
                content.boxId === boxId
                  ? visibility.includes("public")
                  : boxDict[content.boxId]
                    ? boxDict[content.boxId].public
                    : false,
            };

            if (content.descriptionId)
              itemData.descriptionId = content.descriptionId;
            else itemData.description = content.description;

            if (content.sizeId) itemData.sizeId = content.sizeId;
            else itemData.size = content.size;

            if (content.brandId) itemData.brandId = content.brandId;
            else itemData.brand = content.brand;

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

            if (!itemResult.success) {
              console.error("Error with item:", itemResult.error);
              throw new Error(itemResult.error || "Unknown error with item");
            }

            console.log("Item processed successfully:", itemResult.data);
          }
        } catch (error) {
          console.error(`Error processing item:`, error);
          throw error;
        }
      }

      setPage("success");
      return true;
    } catch (error) {
      console.error("Network error:", error);
      throw error;
    }
  }

  async function handleDelete(opt, e) {
    e.preventDefault();
    try {
      if (opt === "all") {
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
      style: content.style,
      color: content.color,
      quantity: content.quantity,
      price: content.price,
      sale: visibility.includes("sale"),
      public: visibility.includes("public"),
      location: boxLocation,
    };

    if (content.descriptionId) itemData.descriptionId = content.descriptionId;
    else itemData.description = content.description;
    if (content.brandId) itemData.brandId = content.brandId;
    else itemData.brand = content.brand;
    if (content.sizeId) itemData.sizeId = content.sizeId;
    else itemData.size = content.size;

    if (visibility.includes("sale")) {
      itemData.discount = boxDiscount;
      itemData.minPrice = minimumPrice;
    }

    let itemResponse;
    //if it doesn't have an id, its an added item
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close description dropdown
      if (!event.target.closest("[data-description-dropdown]")) {
        // Close existing item dropdowns and apply search value if any were open
        setContents((prevContents) =>
          prevContents.map((item) => {
            if (item.descriptionOpen) {
              const searchTerm = descriptionSearch || "";
              const matchedItem = descriptionDict[searchTerm.toLowerCase().trim()];
              if (!matchedItem) {
                // No match found - use the raw search text
                return {
                  ...item,
                  description: searchTerm,
                  descriptionId: null,
                  descriptionOpen: false,
                };
              } else {
                // Match found - use the description from the dictionary
                return {
                  ...item,
                  description: matchedItem.description,
                  descriptionId: matchedItem._id,
                  descriptionOpen: false,
                };
              }
            }
            return { ...item, descriptionOpen: false };
          })
        );
  
        // Close current item dropdown and apply search value if it was open
        if (currentItem.descriptionOpen) {
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
        }
        
        setDescriptionSearch("");
      }
  
      // Close size dropdown
      if (!event.target.closest("[data-size-dropdown]")) {
       setContents((prevContents) =>
          prevContents.map((item) => {
            if (item.sizeOpen) {
              const searchTerm = sizeSearch || "";
              const matchedItem = sizeDict[searchTerm.toLowerCase().trim()];
              if (!matchedItem) {
                return {
                  ...item,
                  size: searchTerm,
                  sizeId: null,
                  sizeOpen: false,
                };
              } else {
                return {
                  ...item,
                  size: matchedItem.size,
                  sizeId: matchedItem._id,
                  sizeOpen: false,
                };
              }
            }
            return { ...item, sizeOpen: false };
          })
        );
  
        // Close current item dropdown and apply search value if it was open
        if (currentItem.sizeOpen) {
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
        }
        
        setSizeSearch("");
      }
  
      // Close brand dropdown
      if (!event.target.closest("[data-brand-dropdown]")) {
        setContents((prevContents) =>
          prevContents.map((item) => {
            if (item.brandOpen) {
              const searchTerm = brandSearch || "";
              const matchedItem = brandDict[searchTerm.toLowerCase().trim()];
              if (!matchedItem) {
                return {
                  ...item,
                  brand: searchTerm,
                  brandId: null,
                  brandOpen: false,
                };
              } else {
                return {
                  ...item,
                  brand: matchedItem.brand,
                  brandId: matchedItem._id,
                  brandOpen: false,
                };
              }
            }
            return { ...item, brandOpen: false };
          })
        );
  
        // Close current item dropdown and apply search value if it was open
        if (currentItem.brandOpen) {
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
        }
        
        setBrandSearch("");
      }
  
      // Close box-swapping dropdown
      if (isDropdownOpen !== null && !event.target.closest("[data-dropdown]")) {
        setIsDropdownOpen(null);
        setDropdownSearchTerm("");
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
  }, [
    isDropdownOpen, 
    showImageOptions, 
    currentItem.descriptionOpen,
    currentItem.sizeOpen, 
    currentItem.brandOpen,
    descriptionSearch,
    brandSearch,
    sizeSearch,
    descriptionDict,
    sizeDict,
    brandDict
  ]);


  const handleDropdownToggle = (index) => {
    if (isDropdownOpen === index) {
      setIsDropdownOpen(null);
      setDropdownSearchTerm("");
    } else {
      setIsDropdownOpen(index);
      setDropdownSearchTerm("");

      // Position the dropdown after it renders
      setTimeout(() => {
        const dropdown = document.querySelector(
          `[data-dropdown-index="${index}"] .dropdown`
        );
        const trigger = document.querySelector(
          `[data-dropdown-index="${index}"]`
        );
        positionDropdown(dropdown, trigger);
      }, 0);
    }
  };
  const handleDescriptionKeyDown = (e, index = null) => {
    if (e.key === "Tab" || e.key === "Enter") {
      // Prevent default behavior
      e.preventDefault();
  
      const matchedItem = descriptionDict[descriptionSearch.toLowerCase().trim()];
  
      // Handle dropdown logic first
      if (index !== null && !matchedItem) {
        // No match found - use the raw search text
        updateExistingContent(index, "description", descriptionSearch);
        updateExistingContent(index, "descriptionId", null);
        updateExistingContent(index, "descriptionOpen", false);
      } else if (index !== null && matchedItem) {
        // Match found - use the description from the dictionary
        updateExistingContent(index, "description", matchedItem.description);
        updateExistingContent(index, "descriptionId", matchedItem._id);
        updateExistingContent(index, "descriptionOpen", false);
      } else if (!matchedItem) {
        // Handle current item - no match
        setCurrentItem({
          ...currentItem,
          description: descriptionSearch,
          descriptionId: null,
          descriptionOpen: false,
        });
      } else {
        // Handle current item - match found
        setCurrentItem({
          ...currentItem,
          description: matchedItem.description,
          descriptionId: matchedItem._id,
          descriptionOpen: false,
        });
      }
      setDescriptionSearch("");
  
      // Move to next input after state updates are processed
      setTimeout(() => {
        const focusableElements = document.querySelectorAll(
          'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(e.target);
  
        if (currentIndex !== -1) {
          const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
  
          if (nextIndex >= 0 && nextIndex < focusableElements.length) {
            focusableElements[nextIndex].focus();
          }
        }
      }, 50);
    }
  };
  
  const handleBrandKeyDown = (e, index = null) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
  
      const matchedItem = brandDict[brandSearch.toLowerCase().trim()];
  
      // Handle dropdown logic first
      if (index !== null && !matchedItem) {
        // No match found - use the raw search text
        updateExistingContent(index, "brand", brandSearch);
        updateExistingContent(index, "brandId", null);
        updateExistingContent(index, "brandOpen", false);
      } else if (index !== null && matchedItem) {
        // Match found - use the brand from the dictionary
        updateExistingContent(index, "brand", matchedItem.brand);
        updateExistingContent(index, "brandId", matchedItem._id);
        updateExistingContent(index, "brandOpen", false);
      } else if (!matchedItem) {
        // Handle current item - no match
        setCurrentItem({
          ...currentItem,
          brand: brandSearch,
          brandId: null,
          brandOpen: false,
        });
      } else {
        // Handle current item - match found
        setCurrentItem({
          ...currentItem,
          brand: matchedItem.brand,
          brandId: matchedItem._id,
          brandOpen: false,
        });
      }
      setBrandSearch("");
  
      setTimeout(() => {
        const focusableElements = document.querySelectorAll(
          'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(e.target);
  
        if (currentIndex !== -1) {
          const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
  
          if (nextIndex >= 0 && nextIndex < focusableElements.length) {
            focusableElements[nextIndex].focus();
          }
        }
      }, 50);
    }
  };
  

  const handleSizeKeyDown = (e, index = null) => {
    if (e.key === "Tab" || e.key === "Enter") {
      console.log("hmm")
      e.preventDefault();
  
      const matchedItem = sizeDict[sizeSearch.toLowerCase().trim()];
  
      // Handle dropdown logic first
      if (index !== null && !matchedItem) {
        // No match found - use the raw search text
        updateExistingContent(index, "size", sizeSearch);
        updateExistingContent(index, "sizeId", null);
        updateExistingContent(index, "sizeOpen", false);
      } else if (index !== null && matchedItem) {
        // Match found - use the size from the dictionary
        updateExistingContent(index, "size", matchedItem.size);
        updateExistingContent(index, "sizeId", matchedItem._id);
        updateExistingContent(index, "sizeOpen", false);
      } else if (!matchedItem) {
        // Handle current item - no match
        setCurrentItem({
          ...currentItem,
          size: sizeSearch,
          sizeId: null,
          sizeOpen: false,
        });
      } else {
        // Handle current item - match found
        setCurrentItem({
          ...currentItem,
          size: matchedItem.size,
          sizeId: matchedItem._id,
          sizeOpen: false,
        });
      }
      setSizeSearch("");
  
      setTimeout(() => {
        const focusableElements = document.querySelectorAll(
          'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(e.target);
  
        if (currentIndex !== -1) {
          const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
  
          if (nextIndex >= 0 && nextIndex < focusableElements.length) {
            focusableElements[nextIndex].focus();
          }
        }
      }, 50);
    }
  };
  const addOptDb = async (selectedOption, newItem, index) => {
    console.log(selectedOption, newItem, index);
    if (isSubmitting) return;
    setIsSubmitting(true);
    const response = await addOption(selectedOption, newItem);

    if (index !== null) {
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
      } else if (selectedOption === "brand") {
        setCurrentItem({
          ...currentItem,
          brand: response.brand,
          brandId: response._id,
          brandOpen: false,
        });
      } else if (selectedOption === "size") {
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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label>Box Inventory</label>
              <label
                style={{ cursor: "pointer" }}
                onClick={() => setPage("edit")}
              >
                Edit presets →
              </label>
            </div>{" "}
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
                                : getDescription(item)
                            }
                            onClick={() => {
                              setContents((prevContents) =>
                                prevContents.map((item) => ({
                                  ...item,
                                  descriptionOpen: false,
                                }))
                              );
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
                            onKeyDown={(e) => handleDescriptionKeyDown(e, index)}
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
                                          "descriptionOpen"
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
                            value={
                              item.brandOpen ? brandSearch : getBrand(item)
                            }
                            
                            onClick={() => {
                              setContents((prevContents) =>
                              prevContents.map((item) => ({
                                ...item,
                                brandOpen: false,
                              }))
                            );
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
                            onKeyDown={(e) => handleBrandKeyDown(e, index)}
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
                            value={item.sizeOpen ? sizeSearch : getSize(item)}
                            onClick={() => {
                              setContents((prevContents) =>
                              prevContents.map((item) => ({
                                ...item,
                                sizeOpen: false,
                              }))
                            );
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
                            onKeyDown={(e) => handleSizeKeyDown(e, index)}
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
                        className={styles.tableReg}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          height: "60px",
                          alignItems: "center",
                        }}
                      >
                        <div
                          className={styles.trash}
                          onClick={() => handleDropdownToggle(index)}
                          style={{
                            cursor: "pointer",
                            color:
                              selectedItem === item._id ? "white" : "black",
                          }}
                          data-dropdown
                        >
                          {item.removed ? (
                            <FaBoxOpen />
                          ) : item.boxId === box._id || !item.boxId ? (
                            <RiSwapBoxLine />
                          ) : (
                            <RiSwapBoxFill />
                          )}
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
                                zIndex: 1,
                              }}
                              data-dropdown
                            >
                              <div
                                style={{ position: "relative" }}
                                data-dropdown
                              >
                                <FaSearch
                                  style={{
                                    position: "absolute",
                                    left: "8px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#666",
                                    fontSize: "12px",
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Search boxes..."
                                  value={dropdownSearchTerm}
                                  onChange={(e) =>
                                    setDropdownSearchTerm(e.target.value)
                                  }
                                  className={styles.input}
                                  style={{
                                    margin: 0,
                                    padding: "4px 4px 4px 24px",
                                    fontSize: "12px",
                                    minHeight: "auto",
                                    width: "100%",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
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
                                    !item.removed &&
                                    ((!item.boxId && b.boxId === box.boxId) ||
                                      item.boxId === b._id)
                                      ? styles.selected
                                      : ""
                                  }`}
                                  onClick={() => {
                                    updateExistingContent(
                                      index,
                                      "removed",
                                      false
                                    );
                                    updateExistingContent(
                                      index,
                                      "boxId",
                                      b._id
                                    );
                                    setIsDropdownOpen(null);
                                    setDropdownSearchTerm("");
                                  }}
                                  data-dropdown
                                  title={`${b.boxId} - ${b.description || ""} (${b.location || ""})`}
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
                            color:
                              selectedItem === item._id ? "white" : "black",
                          }}
                        >
                          <FaRegCopy />
                        </div>
                        <div
                          className={styles.trash}
                          onClick={() => removeItem(index)}
                          style={{
                            cursor: "pointer",
                            color:
                              selectedItem === item._id ? "white" : "black",
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
                          width: currentItem.image !== "" ? "50px" : "150px",
                        }}
                      >
                        {currentItem.image !== "" ? (
                          <div style={{ position: "relative" }}>
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
                            <IoIosRemoveCircle
                              style={{
                                position: "absolute",
                                top: "-15px",
                                right: "0px",
                                fontSize: "30px",
                                color: "red",
                              }}
                              onClick={() =>
                                setCurrentItem({ ...currentItem, image: "" })
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
                            onKeyDown={(e) => handleDescriptionKeyDown(e)}
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
                            onKeyDown={(e) => handleBrandKeyDown(e)}
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
                                    addOptDb("brand", brandSearch, null);
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
                            onKeyDown={(e) => handleSizeKeyDown(e)}
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
                                    addOptDb("size", sizeSearch, null);
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
                {/*Mobile Styles*/}
                <div className={`${styles.mobileTable}`}>
                  <div className={styles.mobileRow}>
                    <div className={styles.mobileField}>
                      <label className={styles.mobileLabel}>Image</label>
                      <div className={styles.mobileValue}>
                        {currentItem.image !== "" ? (
                          <div style={{ position: "relative", width: "auto" }}>
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
                            <IoIosRemoveCircle
                              style={{
                                position: "absolute",
                                top: "-15px",
                                right: "-15px",
                                fontSize: "30px",
                                color: "red",
                              }}
                              onClick={() =>
                                setCurrentItem({ ...currentItem, image: "" })
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
