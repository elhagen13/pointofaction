"use client";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BeatLoader } from "react-spinners";
import {
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaRegCopy,
  FaBoxOpen,
  FaSearch,
} from "react-icons/fa";
import {
  IoIosAddCircle,
  IoIosCheckmarkCircle,
  IoIosRemoveCircle,
} from "react-icons/io";
import {IoSearch, IoWarningSharp } from "react-icons/io5";
import { FiMinimize2, FiMaximize2} from "react-icons/fi";
import { RiSwapBoxLine, RiSwapBoxFill } from "react-icons/ri";
import EditPresets from "@/app/components/admin/editPresets/EditPresets";
import Overlay from "@/app/components/popups/Overlay";
import { useUser } from "@clerk/nextjs";
import jsPDF from "jspdf";
import Dropdown from "./Dropdown";
import FlagPopup from "./components/FlagPopup";
export default function EditItem({
  box,
  onClose,
  refresh,
  selectedItem,
  boxes,
  options,
  deletePopup,
  getBox,
}) {
  const [page, setPage] = useState("add");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [popup, setPopup] = useState(null);

  return (
    <Overlay
      onClose={onClose}
      isVisible={true}
      popup={popup}
      setPopup={setPopup}
      unsavedChanges={unsavedChanges}
      setUnsavedChanges={setUnsavedChanges}
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
          setUnsavedChanges={setUnsavedChanges}
          unsavedChanges={unsavedChanges}
          popup={popup}
          setPopup={setPopup}
          deletePopup={deletePopup}
          getBox={getBox}
        />
      )}
      {page === "edit" && (
        <EditPresets
          options={options}
          prevPage="add"
          setPage={setPage}
          refresh={refresh}
          popup={popup}
          setPopup={setPopup}
        />
      )}
    </Overlay>
  );
}

const AddBox = ({
  box,
  onClose,
  refresh,
  selectedItem,
  boxes,
  setPage,
  options,
  unsavedChanges,
  setUnsavedChanges,
  popup,
  setPopup,
  deletePopup,
  getBox,
}) => {
  const [boxDescription, setBoxDescription] = useState(box?.description || "");
  const [origDescription, setOrigDescription] = useState(
    box?.description || ""
  );
  const [boxLocation, setBoxLocation] = useState(box?.location);
  const [origLocation, setOrigLocation] = useState(box?.location);
  const [contents, setContents] = useState([]);
  const [originalContents, setOriginalContents] = useState([]);
  const [imageUrl, setImageUrl] = useState(box?.image);
  const [origImageUrl, setOrigImageUrl] = useState(box?.image);
  const [minimumPrice, setMinimumPrice] = useState(box?.minPrice);
  /*admin (always clicked), public inventory, sale*/
  const [visibility, setVisibility] = useState(["admin"]);
  const [boxDiscount, setBoxDiscount] = useState(box?.discount ?? 20);
  const [originalBoxData, setOriginalBoxData] = useState({});
  const [originalVisibility, setOriginalVisibility] = useState([]);

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
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(null);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");
  const [boxDict, setBoxDict] = useState({});

  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");

  const { user } = useUser();

  const [acknowledged, setAcknowledged] = useState(false);


  const [history, setHistory] = useState(box?.history || []);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [reload, setReload] = useState(0);

  const dropdownRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");

  const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);
  const [openDropdownCount, setOpenDropdownCount] = useState(0);

  const contentsRef = useRef(contents);

  const [submitAttempted, setSubmitAttempted] = useState(false)


  const handleDropdownStateChange = useCallback((isOpen) => {
    setOpenDropdownCount(prev => {
      const newCount = isOpen ? prev + 1 : Math.max(0, prev - 1);
      setAnyDropdownOpen(newCount > 0);
      return newCount;
    });
  }, []);

  useEffect(() => {
    contentsRef.current = contents;
  }, [contents]);

  const checkCurrent = useCallback(() => {
    // Check if user has entered any meaningful data for the current item
    const hasData =
      (currentItem.description && currentItem.description.trim()) ||
      (currentItem.style && currentItem.style.trim()) ||
      (currentItem.brand && currentItem.brand.trim()) ||
      (currentItem.size && currentItem.size.trim()) ||
      (currentItem.color && currentItem.color.trim()) ||
      (currentItem.quantity && parseInt(currentItem.quantity) > 0) ||
      (currentItem.price && parseFloat(currentItem.price) > 0);

    console.log("Current Item Data:", {
      description: currentItem.description,
      style: currentItem.style,
      brand: currentItem.brand,
      size: currentItem.size,
      color: currentItem.color,
      quantity: currentItem.quantity,
      price: currentItem.price,
    });

    console.log("hasData", hasData);

    if (!acknowledged && hasData) {
      setPopup("itemNotAdded");
      setAcknowledged(true);
      return false; // There is unsaved item data
    }

    return true; // No unsaved item data, safe to proceed
  }, [currentItem, acknowledged, setPopup, setAcknowledged]);

  /**
   * Enter: if there is a popup it with save unsaved changes it will save it,
   * if there is a popup saying changes were successful it will exit
   * Escape: if there are unsaved changes it will alert user of unsaved changes,
   * if there are no unsaved changes it will exit
   */
  const handleKeyDown = useCallback(
    (event) => {
      if ((event.metaKey || event.shiftKey) && event.code === 'KeyQ') {
        downloadBoxPDF();
      }

      if (event.key === "Enter") {
        // Check if any dropdown is currently open
        if (anyDropdownOpen || searchDropdownOpen || isDropdownOpen !== null) {
          // Let the dropdown handle the Enter key
          return;
        }

        if (popup === "success") {
          onClose();
        } else {
          if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
          
          // Give time for blur handlers to update state
          setTimeout(() => {
            handleSubmitBox();
          }, 50);
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if ((popup === "success" || !unsavedChanges) && checkCurrent()) {
          onClose();
        } else if (unsavedChanges) {
          setPopup("unsaved");
          setUnsavedChanges(false);
        }
      }
    },
    [popup, onClose, unsavedChanges, checkCurrent, anyDropdownOpen, searchDropdownOpen, isDropdownOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Enhanced setters with edit tracking
  const setBoxDescriptionWithTracking = (newValue) => {
    setUnsavedChanges(true);
    setBoxDescription(newValue);
  };

  const setBoxLocationWithTracking = (newValue) => {
    setUnsavedChanges(true);
    setBoxLocation(newValue);
  };

  const setImageUrlWithTracking = (newValue) => {
    setUnsavedChanges(true);
    setImageUrl(newValue);
  };
  const setMinimumPriceWithTracking = (newValue) => {
    setUnsavedChanges(true);
    setMinimumPrice(newValue);
  };

  const setBoxDiscountWithTracking = (newValue) => {
    setUnsavedChanges(true);
    setBoxDiscount(newValue);
  };

  const setVisibilityWithTracking = (newVisibility) => {
    console.log("inside", newVisibility);
    setUnsavedChanges(true);
    setVisibility(newVisibility);
  };

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

      const newItems = [];
      if (matchingItems.every((item) => item.public)) {
        newItems.push("public");
      }
      if (matchingItems.every((item) => item.sale)) {
        newItems.push("sale");
      }

      setVisibility([...visibility, ...newItems]);

      setContents(matchingItems.filter((item) => item.quantity > 0 && !item.archived));
      setOriginalContents(matchingItems);

      // Store original box data for comparison
      setOriginalBoxData({
        description: box.description || "",
        location: box.location,
        image: box.image,
        minPrice: box.minPrice,
        discount: box.discount ?? 20,
        history: box.history || [],
      });

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
  }, [reload]);

  useEffect(() => {
    const initialVisibility = ["admin"];

    if (boxDict[box._id]?.public) initialVisibility.push("public")
    if (boxDict[box._id]?.sale) initialVisibility.push("sale")
    setVisibility(initialVisibility);
    setOriginalVisibility(initialVisibility);
  }, [box, boxDict]);

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

  const filteredCombos = useMemo(() => {
    if (!options?.combos) return [];
    if (!searchValue.trim()) {
      return options.combos;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    console.log(searchTerm);
    return options.combos.filter((combo) => {
      // Create a searchable string from all combo properties
      const searchableString = [
        combo.style.toLowerCase(),
        combo.color.toLowerCase(),
        combo.price?.toString(),
        (
          combo.description || descriptionDict[combo.descriptionId].description
        ).toLowerCase(),
        (combo.size || sizeDict[combo.sizeId].size).toLowerCase(),
        (combo.brand || brandDict[combo.brandId].brand).toLowerCase(),
      ]
        .filter(Boolean) // Remove null/undefined values
        .join(" ")
        .toLowerCase();

      return searchTerm
        .split(" ")
        .every((word) => searchableString.includes(word));
    });
  }, [options?.combos, searchValue, descriptionDict, sizeDict, brandDict]);


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
      const topMargin = 0.3;

      // Box Location in top right corner
      pdf.setFontSize(20);
      pdf.setFont(undefined, "bold");
      const locationWidth = pdf.getTextWidth(boxLocation);
      pdf.text(boxLocation, pageWidth - locationWidth - 0.2, topMargin);

      // Title
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text(`Box ${box?.boxId}`, 2, 1, { align: "center" });

      const maxQrY = pageHeight - qrSize - bottomMargin;
      pdf.setFontSize(12);
      pdf.setFont(undefined, "normal");

      let description = boxDescription;
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
      pdf.addImage(box.qrCode, "PNG", qrX, currentQrY, qrSize, qrSize);

      pdf.save(`box-${box.boxId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleFileSelect = (e, type, itemIndex = null) => {
    setUnsavedChanges(true);
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
    setUnsavedChanges(true);
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
        prevContents.map((item, index) => {
          if (index === itemIndex) {
            return { ...item, image: imageUrlInput };
          }
          return item;
        })
      );
    } else if (type === "content") {
      // Update current item being added
      setCurrentItem({
        ...currentItem,
        image: imageUrlInput,
      });
    } else {
      // Update box image
      setImageUrlWithTracking(imageUrlInput);
    }
    setImageUrlInput("");
    setShowUrlInput(false);
    setShowImageOptions(null); // Hide options after URL submission
    setUploadError("");
  };

  const handleUploadImage = async (file, type, itemIndex = null) => {
    setUnsavedChanges(true);
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
            prevContents.map((item, index) => {
              if (index === itemIndex) {
                return { ...item, image: result.url };
              }
              return item;
            })
          );
        } else if (type === "content") {
          // Update current item being added
          setCurrentItem({
            ...currentItem,
            image: result.url,
          });
        } else {
          // Update box image
          setImageUrlWithTracking(result.url);
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
    setImageUrlWithTracking("");
  };

  const updateExistingContent = (idToUpdate, field, newValue) => {
    setUnsavedChanges(true);
    setContents((prevContents) =>
      prevContents.map((item, index) => {
        if (index === idToUpdate) {
          return { ...item, [field]: newValue };
        }
        return item;
      })
    );
  };

  const removeItem = async (indexToRemove) => {
    setUnsavedChanges(true);
    setContents((prevContents) =>
      prevContents.filter((_, index) => index !== indexToRemove)
    );
  };

  const copyItem = async (indexToCopy) => {
    setUnsavedChanges(true);
    const { _id, ...itemToCopy } = contents[indexToCopy];
    setContents([...contents, itemToCopy]);
  };

  const removeItemDB = async (id, content) => {
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
    setUnsavedChanges(true);
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
    if (e) e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setSubmitAttempted(true)

    // Use the ref for the current contents throughout the function
    const currentContents = contentsRef.current;

    if (
      !boxDescription ||
      !boxLocation ||
      !imageUrl ||
      currentContents.length < 1 ||
      (visibility.includes("sale") && !(boxDiscount && minimumPrice))
    ) {
      alert("Please fill in all fields and upload an image");
      return;
    }

    for (const item of currentContents) {
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

    if (!checkCurrent()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass the current contents to uploadBox
      const success = await uploadBox(currentContents);
      if (success) {
        setUnsavedChanges(false);
        setPopup("success");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form: " + error.message);
    } finally {
      setIsSubmitting(false);
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

  const itemDescriptor = (item) => {
    return `${item.brand || brandDict[item.brandId]?.brand || "No brand"
      } ${item.style || "No style"} ${item.description ||
      descriptionDict[item.descriptionId]?.description ||
      "No description"
      } ${item.size || sizeDict[item.sizeId]?.size || "No size"
      } ${item.color || "No color"}`;
  };

  const contentChanged = (content, origContentsDict) => {
    const original = origContentsDict[content._id];
    for (const [key, value] of Object.entries(content)) {
      if (value !== original[key]) {
        return true;
      }
    }
    return false;
  };

  async function uploadBox(currentContents = contents) {
    let change = {
      user: user.fullName,
      editedOn: new Date(),
      changes: [],
    };

    if (origDescription.trim() !== boxDescription.trim()) {
      change.changes.push(
        `Box description changed: ${box?.description.trim()} -> ${boxDescription.trim()}`
      );
    }
    if (origLocation.trim() !== boxLocation.trim()) {
      change.changes.push(
        `Box location changed: ${box?.location.trim()} -> ${boxLocation.trim()}`
      );
    }
    if (origImageUrl.trim() !== imageUrl.trim()) {
      change.changes.push(
        `Box image changed: ${box?.image.trim()} -> ${imageUrl.trim()}`
      );
    }

    if (
      originalVisibility.includes("public") !== visibility.includes("public")
    ) {
      change.changes.push(
        `Box privacy changed: ${originalVisibility.includes("public") ? "public" : "private"} -> ${visibility.includes("public") ? "public" : "private"}`
      );
    }

    if (originalVisibility.includes("sale") !== visibility.includes("sale")) {
      change.changes.push(
        `Box sale status changed: ${originalVisibility.includes("sale") ? "on sale" : "not on sale"} -> ${visibility.includes("sale") ? "on sale" : "not on sale"}`
      );
    }

    let origContentsDict = {};
    for (const content of originalContents) {
      origContentsDict[content._id] = content;
    }

    function getFieldValue(content, field) {
      if (field === "description" && content.descriptionId) {
        return descriptionDict[content.descriptionId]?.description;
      } else if (field === "brand" && content.brandId) {
        return brandDict[content.brandId]?.brand;
      } else if (field === "size" && content.sizeId) {
        return sizeDict[content.sizeId]?.size;
      }
      return content[field];
    }

    for (const newContent of currentContents) {
      /**if there is an id it's an item that was already there pre-edit */
      if (newContent._id) {
        const origContent = origContentsDict[newContent._id];
        const fields = [
          "image",
          "description",
          "style",
          "size",
          "quantity",
          "color",
          "brand",
          "price",
        ];
        fields.forEach((field) => {
          const newValue = getFieldValue(newContent, field);
          const origValue = getFieldValue(origContent, field);
          if (newValue && newValue !== origValue) {
            change.changes.push(
              `Item (${itemDescriptor(newContent)}) ${field} changed: ${origValue} -> ${newValue}`
            );
          }
        });
      }
    }

    try {
      const itemsToDelete = originalContents.filter((original) => {
        return !currentContents.some(
          (current) => current._id && current._id === original._id
        );
      });
      for (const itemToDelete of itemsToDelete) {
        const key = `${itemToDelete.style || "No style"}-${itemToDelete.color || "No color"}-${itemToDelete.size || sizeDict[itemToDelete.sizeId]?.size || "No size"
          }-${itemToDelete.brand || brandDict[itemToDelete.brandId]?.brand || "No brand"}-${itemToDelete.description ||
          descriptionDict[itemToDelete.descriptionId]?.description ||
          "No description"
          }`;

        try {
          change.changes.push(
            `Item (${itemDescriptor(itemToDelete)}) removed from box.`
          );
          await removeItemDB(itemToDelete._id, itemToDelete);
        } catch (error) {
          console.error(`Failed to delete item ${itemToDelete._id}:`, error);
        }
      }
      for (const content of currentContents) {
        if (content.removed) {
          change.changes.push(
            `Item (${itemDescriptor(content)}) removed from box`
          );
        } else if (content.boxId && content.boxId !== box._id) {
          change.changes.push(
            `Item (${itemDescriptor(content)}) moved from box ${getBox[box._id].boxId} -> ${getBox[content.boxId].boxId}`
          );
        }
        if (!content._id) {
          change.changes.push(`Item (${itemDescriptor(content)}) created.`);
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
        contents: currentContents,
      };
      if (change.changes.length >= 1) boxData.history = change;

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
      console.log(change);
      const boxId = data.data._id;

      const changeVisibility = await fetch(
        `/api/inventory/box/${box._id}/items`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sale: visibility.includes("sale"),
            pub: visibility.includes("public"),
          }),
        }
      );

      for (const content of currentContents) {
        try {
          //STEP 1: if it is taken out of the box, then change
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
            } else if (contentChanged(content, origContentsDict)) {
              itemResponse = await fetch(`/api/inventory/item/${content._id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(itemData),
              });
              const itemResult = await itemResponse.json();
              if (!itemResult.success) {
                console.error("Error with item:", itemResult.error);
                throw new Error(itemResult.error || "Unknown error with item");
              }
              console.log("continue");
            }
          }
        } catch (error) {
          console.error(`Error processing item:`, error);
          throw error;
        }
      }
      setOrigDescription(boxDescription);
      setOrigLocation(boxLocation);
      setOrigImageUrl(imageUrl);
      setOriginalContents(currentContents);
      setHistory([...history, change]);
      return true;
    } catch (error) {
      console.error("Network error:", error);
      throw error;
    }
  }

  async function handleDelete(opt, e) {
    console.log("deleting");
    e.preventDefault();
    try {
      if (opt === "all") {
        for (const item of originalContents) {
          console.log(item);
          if (item._id) {
            console.log(`deleting ${item._id}`);
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
      deletePopup();

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

    const key = `${content.style || "No style"}-${content.color || "No color"}-${content.size || sizeDict[content.sizeId]?.size || "No size"
      }-${currentItem.brand || brandDict[content.brandId]?.brand || "No brand"}-${content.description ||
      descriptionDict[content.descriptionId]?.description ||
      "No description"
      }`;

    const itemToPush = {
      inventoryId: itemResult.data._id,
      style: content.style || "No style",
      color: content.color || "No color",
      descriptionId: content.descriptionId || null,
      description: content.description || null,
      brandId: content.brandId || null,
      brand: content.brand || null,
      sizeId: content.sizeId || null,
      size: content.size || null,
      totalQuant: content.quantity,
      totalReserved: 0,
      items: [
        {
          inventoryId: itemResult.data._id,
          quantAvailable: content.quantity,
          reserved: [],
        },
      ],
    };
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
        (item.brand || brandDict[item.brandId].brand) +
        " " + 
        item.color +
        " " +
        (item.description || descriptionDict[item.descriptionId].description) +
        " (" +
        item.style +
        ")\n";
    });
    setBoxDescriptionWithTracking(retString);
  };

  function stringToOrangeHex(str) {
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Make hash positive
    hash = Math.abs(hash);

    // Orange spectrum ranges:
    // Hue: 15-45 degrees (red-orange to yellow-orange)
    // Saturation: 70-100% (vibrant oranges)
    // Lightness: 45-65% (not too dark, not too light)

    const hue = 15 + (hash % 31); // 15-45 range
    const saturation = 70 + (hash % 31); // 70-100 range
    const lightness = 45 + (hash % 21); // 45-65 range

    // Convert HSL to RGB
    const hslToRgb = (h, s, l) => {
      h /= 360;
      s /= 100;
      l /= 100;

      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      if (s === 0) {
        return [l, l, l]; // achromatic
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      const r = hue2rgb(p, q, h + 1 / 3);
      const g = hue2rgb(p, q, h);
      const b = hue2rgb(p, q, h - 1 / 3);

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    const [r, g, b] = hslToRgb(hue, saturation, lightness);

    // Create darker red version
    // Shift hue towards red (0-15 degrees) and reduce lightness
    const redHue = hash % 16; // 0-15 range (red spectrum)
    const redSaturation = Math.max(80, saturation); // Keep high saturation
    const redLightness = Math.max(25, lightness - 20); // Make it darker

    const [redR, redG, redB] = hslToRgb(redHue, redSaturation, redLightness);

    // Convert to hex
    const toHex = (n) => n.toString(16).padStart(2, "0");
    return [
      `#${toHex(r)}${toHex(g)}${toHex(b)}`,
      `#${toHex(redR)}${toHex(redG)}${toHex(redB)}`,
    ];
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close box-swapping dropdown
      if (isDropdownOpen !== null && !event.target.closest("[data-dropdown]")) {
        setIsDropdownOpen(null);
        setDropdownSearchTerm("");
      }

      //search dropdwon
      if (
        searchDropdownOpen &&
        !event.target.closest("[data-dropdown]") &&
        !event.target.classList.contains("searchInput")
      ) {
        setSearchDropdownOpen(false);
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
  }, [isDropdownOpen, showImageOptions, searchDropdownOpen]);

  const handleDropdownToggle = (index) => {
    if (isDropdownOpen === index) {
      setIsDropdownOpen(null);
      setSearchDropdownOpen(false);
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

  const handleOptionSelect = (option) => {
    setCurrentItem({
      ...currentItem,
      description:
        option.description ||
        descriptionDict[option.descriptionId]?.description ||
        "",
      descriptionId: option.descriptionId || null,
      style: option.style || "",
      brand: option.brand || brandDict[option.brandId]?.brand || "",
      brandId: option.brandId || null,
      size: option.size || sizeDict[option.sizeId]?.size || "",
      sizeId: option.sizeId || null,
      color: option.color || "",
      quantity: option.quantity || 0,
      price: option.price || 0.0,
      // Keep the current image unless the option has one
      image: option.image || currentItem.image,
    });

    // Clear search and close dropdown
    setSearchValue("");
    setSearchDropdownOpen(false);
  };

  const getCommonDescription = (preset) => {
    return `${preset.color} ${preset.size || sizeDict[preset.sizeId]?.size || "N/A"} ${preset.brand || brandDict[preset.brandId]?.brand || "N/A"
      } ${preset.style} ${preset.description ||
      descriptionDict[preset.descriptionId]?.description ||
      "N/A"
      } $${preset.price}`;
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

  const getPrice = () => {
    return contents.reduce((a, b) => a + b.quantity * b.price, 0)
  }
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
                type="button"
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
              className={`${styles.input} ${submitAttempted && !boxDescription && styles.inputError}`}
              style={{ resize: "vertical", minHeight: "90px" }}
              value={boxDescription}
              onChange={(e) => setBoxDescription(e.target.value)}
              onBlur={(e) => setBoxDescriptionWithTracking(e.target.value)}
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
                <label htmlFor="file-upload" className={`${styles.fileLabel} ${submitAttempted && !imageUrl && styles.inputError}`}
>
                  <FaUpload /> Choose Image File
                </label>
              </div>
            </div>
            <div className={styles.formInput}>
              <label>Box Location</label>
              <input
                className={`${styles.input} ${submitAttempted && !boxLocation && styles.inputError}`}
                value={boxLocation}
                onChange={(e) => setBoxLocation(e.target.value)}
                onBlur={(e) => setBoxLocationWithTracking(e.target.value)}
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
                  style={{ objectFit: "contain" }}
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
                  overflow: "scroll",
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
                            objectFit: "contain",
                            backgroundColor: "white",
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
                        <Dropdown
                          configs={DROPDOWN_CONFIGS}
                          config_type={"description"}
                          contents={contents}
                          setContents={setContents}
                          index={index}
                          setUnsavedChanges={setUnsavedChanges}
                          refresh={refresh}
                          currentItem={currentItem}
                          setCurrentItem={setCurrentItem}
                          onDropdownStateChange={handleDropdownStateChange}
                        />
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
                          className={`${styles.input} ${submitAttempted && !item.style && styles.inputError}`}

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
                          contents={contents}
                          setContents={setContents}
                          index={index}
                          setUnsavedChanges={setUnsavedChanges}
                          refresh={refresh}
                          currentItem={currentItem}
                          setCurrentItem={setCurrentItem}
                          onDropdownStateChange={handleDropdownStateChange}

                        />
                      </td>
                      <td className={styles.tableReg}>
                        <Dropdown
                          configs={DROPDOWN_CONFIGS}
                          config_type={"size"}
                          contents={contents}
                          setContents={setContents}
                          index={index}
                          setUnsavedChanges={setUnsavedChanges}
                          refresh={refresh}
                          currentItem={currentItem}
                          setCurrentItem={setCurrentItem}
                          onDropdownStateChange={handleDropdownStateChange}

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
                          className={`${styles.input} ${submitAttempted && !item.color && styles.inputError}`}

                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                      </td>
                      <td className={styles.tableReg} style={{ position: "relative" }}>
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

                          className={`${styles.input} ${submitAttempted && item.quantity == "" && styles.inputError}`}

                          style={{
                            margin: 0,
                            minHeight: "auto",
                            width: "100%",
                          }}
                        />
                        {item.reserved > 0 &&
                          <div style={{ position: "absolute", top: "0", right: "20px", height: "100%", display: "flex", alignItems: "center" }}>
                            <IoWarningSharp size={20} color="#dc6f57ff" />
                          </div>
                        }

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
                            const finalValue = isNaN(numValue)
                              ? 0
                              : numValue.toFixed(2);
                            updateExistingContent(index, "price", finalValue);
                          }}
                          className={`${styles.input} ${submitAttempted && item.price < 0 && styles.inputError}`}

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
                          style={{
                            cursor: "pointer",
                            color:
                              selectedItem === item._id ? "white" : "black",
                          }}
                        >
                          <FlagPopup item={item}/>
                        </div>
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
                                  className={`${styles.dropdownItem} ${!item.removed &&
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
              <div className={styles.total}>Box Total: ${getPrice()}</div>
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
                <div
                  className={styles.searchContainer}
                  ref={dropdownRef}
                  style={{ zIndex: "9999", marginBottom: "30px" }}
                >
                  <IoSearch className={styles.search} />
                  <input
                    className={styles.searchInput}
                    value={searchValue}
                    onFocus={() => {
                      // Always open dropdown on focus
                      setSearchDropdownOpen(true);
                    }}
                    onClick={(e) => {
                      // Prevent event bubbling and ensure dropdown opens
                      e.stopPropagation();
                      setSearchDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      // Keep dropdown open when typing
                      setSearchDropdownOpen(true);
                    }}
                    placeholder={`Search...`}
                    style={{ width: "50%" }}
                    data-dropdown
                  />
                  {searchDropdownOpen && (
                    <div
                      className={`${styles.dropdown} ${styles.presetDropdown}`}
                      data-dropdown
                    >
                      {filteredCombos.length > 0 ? (
                        filteredCombos.map((option, index) => (
                          <div
                            key={index}
                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                            className={`${styles.dropdownItem}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOptionSelect(option);
                            }}
                            data-dropdown
                          >
                            <div style={{ width: "30px", height: "30px", overflow: "hidden" }}>
                              <img style={{ width: "100%", height: "100%", objectFit: "contain" }} src={option.image} />
                            </div>
                            {getCommonDescription(option)}
                          </div>
                        ))
                      ) : searchValue ? (
                        <>
                          <div
                            className={styles.dropdownItem}
                            style={{
                              color: "#999",
                              fontStyle: "italic",
                              textAlign: "center",
                            }}
                            data-dropdown
                          >
                            No matching presets found
                          </div>
                          <div
                            className={styles.dropdownItem}
                            onClick={() => setPage("edit")}
                          >
                            Add Preset?
                          </div>
                        </>
                      ) : (
                        <div
                          className={styles.dropdownItem}
                          style={{
                            color: "#999",
                            fontStyle: "italic",
                            textAlign: "center",
                          }}
                          data-dropdown
                        >
                          Start typing to search presets...
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                                backgroundColor: "white",
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
                        <Dropdown
                          configs={DROPDOWN_CONFIGS}
                          config_type={"description"}
                          contents={contents}
                          setContents={setContents}
                          index={null}
                          setUnsavedChanges={setUnsavedChanges}
                          refresh={refresh}
                          currentItem={currentItem}
                          setCurrentItem={setCurrentItem}
                          onDropdownStateChange={handleDropdownStateChange}

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
                        <Dropdown
                          configs={DROPDOWN_CONFIGS}
                          config_type={"brand"}
                          contents={contents}
                          setContents={setContents}
                          index={null}
                          setUnsavedChanges={setUnsavedChanges}
                          refresh={refresh}
                          currentItem={currentItem}
                          setCurrentItem={setCurrentItem}
                          onDropdownStateChange={handleDropdownStateChange}

                        />
                      </td>
                      <td className={styles.tableReg}>
                        <Dropdown
                          configs={DROPDOWN_CONFIGS}
                          config_type={"size"}
                          contents={contents}
                          setContents={setContents}
                          index={null}
                          setUnsavedChanges={setUnsavedChanges}
                          refresh={refresh}
                          currentItem={currentItem}
                          setCurrentItem={setCurrentItem}
                          onDropdownStateChange={handleDropdownStateChange}

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
                          onDropdownStateChange={handleDropdownStateChange}

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
                          onDropdownStateChange={handleDropdownStateChange}

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
                          onDropdownStateChange={handleDropdownStateChange}

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
            <div style={{ display: "flex", flexDirection: "row", gap: "20px", alignItems:"center" }}>
              <div style={{display:"flex", alignItems:"center"}}>
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
              <div style={{display:"flex", alignItems:"center"}}>
                <input
                  type="checkbox"
                  id="checkbox1"
                  name="public"
                  value="public"
                  checked={visibility.includes("public")}
                  onChange={(e) => {
                    let newVisibility = [...visibility];
                    if (e.target.checked) {
                      if (!newVisibility.includes("public")) {
                        newVisibility.push("public");
                      }
                    } else {
                      newVisibility = newVisibility.filter(
                        (item) => item !== "public"
                      );
                    }
                    console.log(newVisibility);
                    setVisibilityWithTracking(newVisibility); // Use tracking function
                  }}
                />
                <label htmlFor="checkbox1" style={{ marginLeft: "5px" }}>
                  Public
                </label>
                <br />
              </div>

              <div style={{display:"flex", alignItems:"center"}}>
                <input
                  type="checkbox"
                  id="checkbox2"
                  name="sale"
                  value="sale"
                  checked={visibility.includes("sale")}
                  onChange={(e) => {
                    let newVisibility = [...visibility];
                    if (e.target.checked) {
                      if (!newVisibility.includes("sale")) {
                        newVisibility.push("sale");
                      }
                    } else {
                      newVisibility = newVisibility.filter(
                        (item) => item !== "sale"
                      );
                    }
                    setVisibilityWithTracking(newVisibility);
                  }}
                />

                <label htmlFor="checkbox2" style={{ marginLeft: "5px" }}>
                  Sale
                </label>
              </div>
            </div>
          </div>
          {visibility.includes("sale") && (
            <div className={styles.horizontal} style={{ zIndex: 0 }}>
              <div className={styles.formInput}>
                <label>Discount</label>
                <div style={{position:"relative", width: "100%"}}>
                <input
                  className={styles.input}
                  onChange={(e) => {
                    const newValue = e.target.value.replace(/[^0-9.]/g, "");
                    setBoxDiscountWithTracking(newValue);
                  }}
                  value={`${boxDiscount}%`}
                  required
                />
                 <div className={styles.priceResult}>- ${getPrice() * boxDiscount * 0.01}</div>
                </div>
              </div>
              <div className={styles.formInput}>
                <label>Minimum Purchase</label>
                <input
                  className={styles.input}
                  onChange={(e) => {
                    const newValue = e.target.value.replace(/[^0-9.]/g, "");
                    setMinimumPriceWithTracking(newValue);
                  }}
                  value={`${minimumPrice || "0"}`}
                  required
                />
              </div>
            </div>
          )}
          {history.length >= 1 && (
            <div>
              <div
                className={styles.discreetButton}
                onClick={() => setHistoryOpen(!historyOpen)}
              >
                View History{" "}
                {historyOpen ? (
                  <FiMinimize2 strokeWidth="2" />
                ) : (
                  <FiMaximize2 strokeWidth="2" />
                )}
              </div>
              <div
                className={`${styles.history} ${historyOpen ? styles.visible : ""}`}
              >
                <div style={{ padding: "10px", paddingTop: "0" }}>
                  {[...history].reverse().map((entry, index) => (
                    <div>
                      <div
                        className={styles.historyRow}
                        onClick={() =>
                          selectedHistory === index
                            ? setSelectedHistory(null)
                            : setSelectedHistory(index)
                        }
                        data-selected={index === selectedHistory}
                      >
                        <div
                          className={styles.profile}
                          style={{
                            backgroundColor: stringToOrangeHex(entry.user)[0],
                            color: stringToOrangeHex(entry.user)[1],
                          }}
                        >
                          {entry.user
                            .split(" ")
                            .map((name) => name[0])
                            .join("")}
                        </div>
                        <div>
                          {entry.createdOn ? `Created by ${entry.user}` : ""}
                          {entry.editedOn ? `Edited by ${entry.user}` : ""}
                        </div>
                        <div>
                          Date:{" "}
                          {entry.createdOn
                            ? new Date(entry.createdOn).toLocaleString()
                            : ""}
                          {entry.editedOn
                            ? `${new Date(entry.editedOn).toLocaleString()}`
                            : ""}
                        </div>
                      </div>
                      {entry.changes?.length >= 1 && (
                        <div
                          className={`${styles.historyEntriesContainer} ${index === selectedHistory ? styles.visible : ""}`}
                        >
                          <div className={styles.historyEntries}>
                            {entry.changes?.map((change) => (
                              <div className={styles.historyEntry}>
                                • {change}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
                type="button"
                className={styles.button}
                style={{ backgroundColor: "#a83a32" }}
                onClick={(e) => handleDelete("all", e)}
              >
                Delete All
              </button>
              <button
                type="button"
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
            <button
              className={styles.button}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <BeatLoader color="white" size={8} /> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
