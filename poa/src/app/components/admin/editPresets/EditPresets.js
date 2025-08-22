import { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./editPresets.module.css";
import {
  FaSearch,
  FaTrash,
  FaUpload,
  FaLink,
  FaPlus,
} from "react-icons/fa";
import { MdOutlineSwapVert } from "react-icons/md";
import { BeatLoader } from "react-spinners";

/**
 * Add, Edit, or Remove Presets
 * Adding and editing are pretty straight forward,
 * since items are connected with ids, if an item is edited it will then edit every
 * item that has that description/brand/... id
 * Removing a preset will find every item that has that description/brand/... id and
 * replace it with what the description/brand/... id used to represent
 */

export default function EditPresets({
  options,
  prevPage,
  setPage,
  refresh,
  setPopup,
}) {
  const [inventory, setInventory] = useState([]);
  const [combos, setCombos] = useState([]);

  const editTypes = ["add", "edit", "delete"];
  const colors = ["#007f4e", "#f37324", "#e12729"];
  const [editType, setEditType] = useState("add");
  const [addType, setAddType] = useState("descriptions");
  const [newField, setNewField] = useState("");
  const [submitting, isSubmitting] = useState(false);

  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");
  const [comboSearch, setComboSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showImageOptions, setShowImageOptions] = useState(false);

  const [commonPreset, setCommonPreset] = useState({
    image: "",
    description: "",
    descriptionId: "",
    descriptionOpen: false,
    style: "",
    brand: "",
    brandId: "",
    brandOpen: false,
    size: "",
    sizeId: "",
    sizeOpen: false,
    color: "",
    price: 0.0,
  });

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPage(prevPage);
      }
    },
    [prevPage, setPage]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
  };

  const getPresetCombos = async () => {
    const response = await fetch("/api/details/common", {
      method: "GET",
    });

    const result = await response.json();

    setCombos(result.data);
  };

  useEffect(() => {
    getInventory();
    getPresetCombos();
  }, []);

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.size?.toLowerCase()] = item;
    });
    return dict;
  }, [options]);

  const descriptionDict = useMemo(() => {
    if (!options.descriptions) return {};
    const dict = {};
    options.descriptions.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.description?.toLowerCase()] = item;
    });
    return dict;
  }, [options]);

  const brandDict = useMemo(() => {
    if (!options.brands) return {};
    const dict = {};
    options.brands.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.brand?.toLowerCase()] = item;
    });
    return dict;
  }, [options]);

  const comboDict = useMemo(() => {
    if (!options.combos) return {};
    const dict = {};
    options.combos.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

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

    return options.brands.filter((brand) =>
      brand.brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [options?.brands, brandSearch]);

  const filteredSizes = useMemo(() => {
    if (!options?.sizes) return [];

    if (!sizeSearch.trim()) {
      return options.sizes;
    }

    return options.sizes.filter((size) =>
      size.size.toLowerCase().includes(sizeSearch.toLowerCase())
    );
  }, [options?.sizes, sizeSearch]);

  const filteredCombinations = useMemo(() => {
    if (!options?.combos) return [];
    if (!comboSearch.trim()) {
      return options.combos;
    }

    const searchTerm = comboSearch.toLowerCase().trim();

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

      return searchableString.includes(searchTerm);
    });
  }, [options?.combos, comboSearch, descriptionDict, sizeDict, brandDict]);

  const validateCommonFields = () => {
    if (
      (!commonPreset.description.trim() && !commonPreset.descriptionId) ||
      !commonPreset.image.trim() ||
      (!commonPreset.brand.trim() && !commonPreset.brandId) ||
      !commonPreset.style ||
      (!commonPreset.size.trim() && !commonPreset.sizeId) ||
      !commonPreset.color ||
      commonPreset.price <= 0
    ) {
      return true;
    }
    return false;
  };
  const addPreset = async (e) => {
    e.preventDefault();

    if (submitting) return;
    isSubmitting(true);

    try {
      const itemData = {};
      let url = "";
      switch (addType) {
        case "descriptions":
          itemData.description = newField;
          url = "/api/details/descriptions";
          break;
        case "brands":
          itemData.brand = newField;
          url = "/api/details/brands";
          break;
        case "sizes":
          itemData.size = newField;
          url = "/api/details/sizes";
          break;
        case "common":
          url = "/api/details/common";
          itemData.image = commonPreset.image;

          if (commonPreset.descriptionId)
            itemData.descriptionId = commonPreset.descriptionId;
          else if (commonPreset.description)
            itemData.description = commonPreset.description;

          itemData.style = commonPreset.style;

          if (commonPreset.brandId) itemData.brandId = commonPreset.brandId;
          else if (commonPreset.brand) itemData.brand = commonPreset.brand;

          if (commonPreset.sizeId) itemData.sizeId = commonPreset.sizeId;
          else if (commonPreset.size) itemData.size = commonPreset.size;

          itemData.color = commonPreset.color;
          itemData.price = commonPreset.price;
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
        isSubmitting(false);
        return false;
      }


      // Clear form after successful submission
      await refresh();
      setNewField("");
      isSubmitting(false);
      setPopup("success");
      return data.data;
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      isSubmitting(false);
      setPopup("unsuccessful")
      return false;
    }
  };

  const handleNewItemThumbnailClick = () => {
    setShowUrlInput(true);
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) {
      console.error("Invalid URL");
      return;
    }
    // Basic URL validation
    try {
      new URL(imageUrlInput);
    } catch (e) {
      console.error("error");
      setPopup("unsuccessful")
      return;
    }
    setCommonPreset({ ...commonPreset, image: imageUrlInput });
    setShowUrlInput(false);
    setShowImageOptions(false); // Hide options after URL submission
  };

  const handleFileUploadOption = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => handleFileSelect(e);
    fileInput.click();
  };

  const handleFileSelect = (e) => {
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
      handleUploadImage(file);
    }
    // Hide image options after selection
    setShowImageOptions(false);
  };

  const handleUploadImage = async (file) => {
    if (!file) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/inventory/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setCommonPreset({ ...commonPreset, image: result.url });
      } else {
        console.error(result.error || "Upload failed");
      }
    } catch (error) {
      setPopup("unsuccessful")
      console.error("Network error: " + error.message);
    }
  };
  const editPreset = async (e) => {
    e.preventDefault();
    if (submitting) return;
    isSubmitting(true);

    try {
      const itemData = {};
      let url = "";
      let values = [];
      switch (addType) {
        case "descriptions":
          itemData.description = newField;
          url = "/api/details/descriptions";
          values = options.descriptions;
          break;
        case "brands":
          itemData.brand = newField;
          url = "/api/details/brands";
          values = options.brands;
          break;
        case "sizes":
          itemData.size = newField;
          url = "/api/details/sizes";
          values = options.sizes;
          break;
        case "common":
          url = "/api/details/common";
          values = options.combos;

          itemData.image = commonPreset.image;

          if (commonPreset.descriptionId)
            itemData.descriptionId = commonPreset.descriptionId;
          else if (commonPreset.description)
            itemData.description = commonPreset.description;

          itemData.style = commonPreset.style;

          if (commonPreset.brandId) itemData.brandId = commonPreset.brandId;
          else if (commonPreset.brand) itemData.brand = commonPreset.brand;

          if (commonPreset.sizeId) itemData.sizeId = commonPreset.sizeId;
          else if (commonPreset.size) itemData.size = commonPreset.size;

          itemData.color = commonPreset.color;
          itemData.price = commonPreset.price;
          break;
      }

      // Create the new preset
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
        isSubmitting(false);
        return false;
      }

      console.log("Item created successfully:", data.data);
      console.log("Message:", data.message);

      const newId = data.data._id;

      await getPresetCombos(); 
      await getInventory(); 

      const freshCombosResponse = await fetch("/api/details/common", {
        method: "GET",
      });
      const freshCombosResult = await freshCombosResponse.json();
      const freshCombos = freshCombosResult.data;

      const comboUpdatePromises = [];
      for (const combo of freshCombos) {
        if (
          (addType === "descriptions" &&
            combo.descriptionId &&
            selectedIds.includes(combo.descriptionId)) ||
          (addType === "brands" &&
            combo.brandId &&
            selectedIds.includes(combo.brandId)) ||
          (addType === "sizes" &&
            combo.sizeId &&
            selectedIds.includes(combo.sizeId))
        ) {
          console.log("Updating combo:", combo._id);
          const comboData = { ...combo };
          if (addType === "descriptions") comboData.descriptionId = newId;
          if (addType === "brands") comboData.brandId = newId;
          if (addType === "sizes") comboData.sizeId = newId;

          const updatePromise = fetch(`/api/details/common/${combo._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comboData),
          }).then(async (response) => {
            const data = await response.json();
            if (!data.success) {
              throw new Error(
                `Error updating combo ${combo._id}: ${data.error}`
              );
            }
            return data;
          });

          comboUpdatePromises.push(updatePromise);
        }
      }

      try {
        await Promise.all(comboUpdatePromises);
        console.log("All combo updates completed successfully");
      } catch (error) {
        console.error("Error updating combos:", error);
        alert("Error updating combos: " + error.message);
        isSubmitting(false);
        setPopup("unsuccessful")
        return false;
      }

      const freshInventoryResponse = await fetch("/api/inventory/item", {
        method: "GET",
      });
      const freshInventoryResult = await freshInventoryResponse.json();
      const freshInventory = freshInventoryResult.data;

      const inventoryUpdatePromises = [];
      for (const item of freshInventory) {
        if (
          (addType === "descriptions" &&
            item.descriptionId &&
            selectedIds.includes(item.descriptionId)) ||
          (addType === "brands" &&
            item.brandId &&
            selectedIds.includes(item.brandId)) ||
          (addType === "sizes" &&
            item.sizeId &&
            selectedIds.includes(item.sizeId))
        ) {
          const itemData = { ...item };
          if (addType === "descriptions") itemData.descriptionId = newId;
          if (addType === "brands") itemData.brandId = newId;
          if (addType === "sizes") itemData.sizeId = newId;

          const updatePromise = fetch(`/api/inventory/item/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemData),
          }).then(async (response) => {
            const data = await response.json();
            if (!data.success) {
              throw new Error(
                `Error updating inventory item ${item._id}: ${data.error}`
              );
            }
            return data;
          });

          inventoryUpdatePromises.push(updatePromise);
        }
      }

      try {
        await Promise.all(inventoryUpdatePromises);
        console.log("All inventory updates completed successfully");
      } catch (error) {
        console.error("Error updating inventory:", error);
        alert("Error updating inventory: " + error.message);
        isSubmitting(false);
        setPopup("unsuccessful")
        return false;
      }

      const deletePromises = [];
      for (const id of selectedIds) {
        const deletePromise = fetch(`${url}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }).then(async (response) => {
          const data = await response.json();
          if (!data.success) {
            throw new Error(`Error deleting preset ${id}: ${data.error}`);
          }
          return data;
        });

        deletePromises.push(deletePromise);
      }

      try {
        await Promise.all(deletePromises);
        console.log("All preset deletions completed successfully");
      } catch (error) {
        console.error("Error deleting presets:", error);
        alert("Error deleting presets: " + error.message);
        isSubmitting(false);
        setPopup("unsuccessful")
        return false;
      }

      await refresh();

      setPopup("success")
      setSelectedIds([]);
      setNewField("");
      isSubmitting(false);

    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      isSubmitting(false);
      setPopup("unsuccessful")
      return false;
    }
  };

  //go through all inventory, if it has the id under that descriptor, then remove
  //the id and replace it with description: instead of descriptionId
  const handleDelete = async (e, id) => {
    if (submitting) return;
    isSubmitting(true);
    e.preventDefault();

    if (addType !== "common") {
      for (const item of inventory) {
        if (
          (addType === "descriptions" &&
            item.descriptionId &&
            item.descriptionId === id) ||
          (addType === "brands" && item.brandId && item.brandId === id) ||
          (addType === "sizes" && item.sizeId && item.sizeId === id)
        ) {
          const itemData = { ...item };
          if (addType === "descriptions") {
            itemData.description = descriptionDict[id].description;
            itemData.descriptionId = null;
          }
          if (addType === "brands") {
            itemData.brand = brandDict[id].brand;
            itemData.brandId = null;
          }
          if (addType === "sizes") {
            itemData.size = sizeDict[id].size;
            itemData.sizeId = null;
          }
          const response = await fetch(`/api/inventory/item/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemData),
          });

          const data = await response.json();
          if (!data.success) {
            console.error("Error updating item:", data.error);
            alert("Error updating item: " + (data.error || "Unknown error"));
            return false;
          }
          await getInventory();
        }
      }
    }
    const response = await fetch(`/api/details/${addType}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!data.success) {
      console.error("Error deleting item:", data.error);
      alert("Error updating item: " + (data.error || "Unknown error"));
      return false;
    }

    setPopup("success")
    await refresh();
    isSubmitting(false);
    return;
  };

  const editSelectedIds = (id) => {
    if (!selectedIds) return;
    selectedIds.includes(id)
      ? setSelectedIds(selectedIds.filter((x) => x !== id))
      : setSelectedIds([...selectedIds, id]);
  };

  const handleDropdownKeyDown = (e, type) => {
    if (e.key === "Tab" || e.key === "Enter") {
      // Prevent default behavior
      e.preventDefault();

      let matchedItem = "";
      let field = "description";
      let search = "";

      switch (type) {
        case "description":
          search = descriptionSearch;
          matchedItem = descriptionDict[descriptionSearch.toLowerCase().trim()];
          break;
        case "brand":
          field = "brand";
          search = brandSearch;
          matchedItem = brandDict[brandSearch.toLowerCase().trim()];
          break;
        case "size":
          field = "size";
          search = sizeSearch;
          matchedItem = sizeDict[sizeSearch.toLowerCase().trim()];
          break;
      }

      const fieldId = `${field}Id`;
      const dropdown = `${field}Open`;

      // Handle dropdown logic with computed property names
      if (!matchedItem) {
        // No match found - use the raw search text
        setCommonPreset((prevState) => ({
          ...prevState,
          [field]: search,
          [fieldId]: null,
          [dropdown]: false,
        }));
      } else {
        setCommonPreset((prevState) => ({
          ...prevState,
          [field]: matchedItem[field],
          [fieldId]: matchedItem._id,
          [dropdown]: false,
        }));
      }

      setDescriptionSearch("");
      setBrandSearch("");
      setSizeSearch("");

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
    return brand.length > 50 ? brand.slice(0, 50) + "..." : brand;
  };

  const getSize = (item) => {
    let size = "";
    if (item.sizeId && sizeDict[item.sizeId.toString()])
      size = sizeDict[item.sizeId.toString()].size;
    else if (item.size) size = item.size;
    else return "N/A";
    return size.length > 50 ? size.slice(0, 50) + "..." : size;
  };

  const getCommonDescription = (preset) => {
    return `${preset.color} ${preset.size || sizeDict[preset.sizeId]?.size || "N/A"} ${
      preset.brand || brandDict[preset.brandId]?.brand || "N/A"
    } ${preset.style} ${
      preset.description ||
      descriptionDict[preset.descriptionId]?.description ||
      "N/A"
    } $${preset.price}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close description dropdown
      if (!event.target.closest("[data-description-dropdown]")) {
        if (commonPreset.descriptionOpen) {
          const searchTerm = descriptionSearch || "";
          const matchedItem = options.descriptions?.find(
            (desc) =>
              desc.description.toLowerCase() === searchTerm.toLowerCase().trim()
          );

          if (!matchedItem) {
            setCommonPreset((prev) => ({
              ...prev,
              description: searchTerm,
              descriptionId: null,
              descriptionOpen: false,
            }));
          } else {
            setCommonPreset((prev) => ({
              ...prev,
              description: matchedItem.description,
              descriptionId: matchedItem._id,
              descriptionOpen: false,
            }));
          }
        }
        setDescriptionSearch("");
      }

      // Close size dropdown
      if (!event.target.closest("[data-size-dropdown]")) {
        if (commonPreset.sizeOpen) {
          const searchTerm = sizeSearch || "";
          const matchedItem = options.sizes?.find(
            (size) =>
              size.size.toLowerCase() === searchTerm.toLowerCase().trim()
          );

          if (!matchedItem) {
            setCommonPreset((prev) => ({
              ...prev,
              size: searchTerm,
              sizeId: null,
              sizeOpen: false,
            }));
          } else {
            setCommonPreset((prev) => ({
              ...prev,
              size: matchedItem.size,
              sizeId: matchedItem._id,
              sizeOpen: false,
            }));
          }
        }
        setSizeSearch("");
      }

      // Close brand dropdown
      if (!event.target.closest("[data-brand-dropdown]")) {
        if (commonPreset.brandOpen) {
          const searchTerm = brandSearch || "";
          const matchedItem = options.brands?.find(
            (brand) =>
              brand.brand.toLowerCase() === searchTerm.toLowerCase().trim()
          );

          if (!matchedItem) {
            setCommonPreset((prev) => ({
              ...prev,
              brand: searchTerm,
              brandId: null,
              brandOpen: false,
            }));
          } else {
            setCommonPreset((prev) => ({
              ...prev,
              brand: matchedItem.brand,
              brandId: matchedItem._id,
              brandOpen: false,
            }));
          }
        }
        setBrandSearch("");
      }

      // Close image options dropdown
      if (!event.target.closest("[data-image-options]")) {
        setShowImageOptions(false);
        setShowUrlInput(false);
        setImageUrlInput("");
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    commonPreset.descriptionOpen,
    commonPreset.sizeOpen,
    commonPreset.brandOpen,
    descriptionSearch,
    brandSearch,
    sizeSearch,
    options.descriptions,
    options.brands,
    options.sizes,
    showImageOptions,
  ]);

  return (
    <div className={styles.vertStack}>
      <div>
        <div
          onClick={() => setPage(prevPage)}
          style={{ cursor: "pointer", width: "fit-content" }}
        >
          ← Return
        </div>
      </div>
      <h2>Change Presets</h2>
      <div className={styles.horStack}>
        {editTypes.map((et, index) => (
          <div
            key={index}
            style={{
              border: `2px solid ${colors[index]}`,
              color: editType === et ? "white" : colors[index],
              backgroundColor: editType === et ? colors[index] : "white",
            }}
            className={styles.pageButton}
            onClick={() => {
              setEditType(et);
              setNewField("");
              setBrandSearch("");
              setDescriptionSearch("");
              setSizeSearch("");
            }}
          >
            {et}
          </div>
        ))}
      </div>
      {editType === "add" && (
        <div className={styles.vertStack}>
          <div className={styles.horStack}>
            <h3>Add a Preset to</h3>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="descriptions"
                name="options"
                value="descriptions"
                checked={addType === "descriptions"}
                onClick={() => {
                  setAddType("descriptions");
                }}
                readOnly
              />
              <label htmlFor="descriptions">Descriptions</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="brands"
                name="options"
                value="brands"
                checked={addType === "brands"}
                onClick={() => setAddType("brands")}
                readOnly
              />
              <label htmlFor="brands">Brands</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="sizes"
                name="options"
                value="sizes"
                checked={addType === "sizes"}
                onClick={() => setAddType("sizes")}
                readOnly
              />
              <label htmlFor="sizes">Sizes</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="common"
                name="common"
                value="common"
                checked={addType === "common"}
                onClick={() => setAddType("common")}
                readOnly
              />
              <label htmlFor="common">Commonly Used</label>
            </div>
          </div>
          {addType !== "common" ? (
            <textarea
              className={styles.input}
              style={{ resize: "vertical" }}
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
            />
          ) : (
            <div className={styles.commonInputs}>
              <div
                className={styles.inputContainer}
                style={{ flexGrow: "unset" }}
              >
                <label>Image</label>
                {commonPreset.image !== "" ? (
                  <div className={styles.imageContainer}>
                    <img
                      src={commonPreset.image}
                      alt={`Image`}
                      onClick={() => setShowImageOptions(true)}
                      style={{
                        cursor: "pointer",
                      }}
                      title="Click to change image"
                    />
                  </div>
                ) : (
                  <div
                    className={styles.input}
                    onClick={() => setShowImageOptions(true)}
                    style={{ position: "relative" }}
                  ></div>
                )}
                {/* Image upload options dropdown */}
                {showImageOptions && (
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
                      onClick={(e) => handleFileUploadOption(e)}
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
                      onClick={() => {
                        setShowImageOptions(false);
                        setShowUrlInput(true);
                      }}
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
                {showUrlInput && (
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
                        onClick={(e) => handleUrlSubmit(e)}
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
                          setShowImageOptions(false);
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
              </div>

              {/* Description dropdown */}
              <div className={styles.inputContainer}>
                <label>Description</label>
                <div style={{ position: "relative" }} data-description-dropdown>
                  <input
                    value={
                      commonPreset.descriptionOpen
                        ? descriptionSearch
                        : getDescription(commonPreset)
                    }
                    onClick={() => {
                      setCommonPreset((prev) => ({
                        ...prev,
                        descriptionOpen: true,
                      }));
                      setDescriptionSearch(commonPreset.description);
                    }}
                    onChange={(e) => {
                      if (commonPreset.descriptionOpen) {
                        setDescriptionSearch(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      setCommonPreset((prev) => ({
                        ...prev,
                        descriptionOpen: true,
                      }));
                      setDescriptionSearch(commonPreset.description);
                    }}
                    onKeyDown={(e) => handleDropdownKeyDown(e, "description")}
                    placeholder={
                      commonPreset.descriptionOpen
                        ? "Search descriptions..."
                        : ""
                    }
                    className={styles.input}
                    style={{
                      margin: 0,
                      minHeight: "auto",
                      width: "100%",
                      caretColor: commonPreset.descriptionOpen
                        ? "auto"
                        : "transparent",
                    }}
                    data-description-dropdown
                  />
                  {commonPreset.descriptionOpen && (
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
                        {filteredDescriptions.length > 0 &&
                          filteredDescriptions.map((opt, oIndex) => (
                            <div
                              key={oIndex}
                              className={styles.dropdownItem}
                              onClick={() => {
                                setCommonPreset((prev) => ({
                                  ...prev,
                                  description: opt.description,
                                  descriptionId: opt._id,
                                  descriptionOpen: false,
                                }));
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
                          ))}
                        <div
                          className={styles.dropdownItem}
                          style={{
                            color: "#999",
                            padding: "8px 12px",
                            textAlign: "center",
                          }}
                          onClick={() => {
                            setCommonPreset((prev) => ({
                              ...prev,
                              description: descriptionSearch,
                              descriptionId: null,
                              descriptionOpen: false,
                            }));
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
              </div>
              <div className={styles.inputContainer}>
                <label>Style</label>
                <input
                  className={styles.input}
                  value={commonPreset.style}
                  onChange={(e) =>
                    setCommonPreset((prev) => ({
                      ...prev,
                      style: e.target.value,
                    }))
                  }
                />
              </div>
              {/*Brand dropdown*/}
              <div className={styles.inputContainer}>
                <label>Brand</label>
                <div style={{ position: "relative" }} data-brand-dropdown>
                  <input
                    value={
                      commonPreset.brandOpen
                        ? brandSearch
                        : getBrand(commonPreset)
                    }
                    onClick={() => {
                      setCommonPreset((prev) => ({
                        ...prev,
                        brandOpen: true,
                      }));
                      setBrandSearch(commonPreset.brand);
                    }}
                    onChange={(e) => {
                      if (commonPreset.brandOpen) {
                        setBrandSearch(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      setCommonPreset((prev) => ({
                        ...prev,
                        brandOpen: true,
                      }));
                      setBrandSearch(commonPreset.brand);
                    }}
                    onKeyDown={(e) => handleDropdownKeyDown(e, "brand")}
                    placeholder={
                      commonPreset.brandOpen ? "Search brands..." : ""
                    }
                    className={styles.input}
                    style={{
                      margin: 0,
                      minHeight: "auto",
                      width: "100%",
                      caretColor: commonPreset.brandOpen
                        ? "auto"
                        : "transparent",
                    }}
                    data-brand-dropdown
                  />
                  {commonPreset.brandOpen && (
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
                        {filteredBrands.length > 0 &&
                          filteredBrands.map((opt, oIndex) => (
                            <div
                              key={oIndex}
                              className={styles.dropdownItem}
                              onClick={() => {
                                setCommonPreset((prev) => ({
                                  ...prev,
                                  brand: opt.brand,
                                  brandId: opt._id,
                                  brandOpen: false,
                                }));
                                setSizeSearch("");
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
                          ))}
                        <div
                          className={styles.dropdownItem}
                          style={{
                            color: "#999",
                            padding: "8px 12px",
                            textAlign: "center",
                          }}
                          onClick={() => {
                            setCommonPreset((prev) => ({
                              ...prev,
                              brand: brandSearch,
                              brandId: null,
                              brandOpen: false,
                            }));
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
              </div>

              {/* Size dropdown */}
              <div className={styles.inputContainer}>
                <label>Size</label>
                <div style={{ position: "relative" }} data-size-dropdown>
                  <input
                    value={
                      commonPreset.sizeOpen ? sizeSearch : getSize(commonPreset)
                    }
                    onClick={() => {
                      setCommonPreset((prev) => ({
                        ...prev,
                        sizeOpen: true,
                      }));
                      setSizeSearch(commonPreset.size);
                    }}
                    onChange={(e) => {
                      if (commonPreset.sizeOpen) {
                        setSizeSearch(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      setCommonPreset((prev) => ({
                        ...prev,
                        sizeOpen: true,
                      }));
                      setSizeSearch(commonPreset.size);
                    }}
                    onKeyDown={(e) => handleDropdownKeyDown(e, "size")}
                    placeholder={commonPreset.sizeOpen ? "Search sizes..." : ""}
                    className={styles.input}
                    style={{
                      margin: 0,
                      minHeight: "auto",
                      width: "100%",
                      caretColor: commonPreset.sizeOpen
                        ? "auto"
                        : "transparent",
                    }}
                    data-size-dropdown
                  />
                  {commonPreset.sizeOpen && (
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
                        {filteredSizes.length > 0 &&
                          filteredSizes.map((opt, oIndex) => (
                            <div
                              key={oIndex}
                              className={styles.dropdownItem}
                              onClick={() => {
                                setCommonPreset((prev) => ({
                                  ...prev,
                                  size: opt.size,
                                  sizeId: opt._id,
                                  sizeOpen: false,
                                }));
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
                          ))}
                        <div
                          className={styles.dropdownItem}
                          style={{
                            color: "#999",
                            padding: "8px 12px",
                            textAlign: "center",
                          }}
                          onClick={() => {
                            setCommonPreset((prev) => ({
                              ...prev,
                              size: sizeSearch,
                              sizeId: null,
                              sizeOpen: false,
                            }));
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
              </div>

              {/* Color and Price inputs */}
              <div className={styles.inputContainer}>
                <label>Color</label>
                <input
                  className={styles.input}
                  value={commonPreset.color}
                  onChange={(e) =>
                    setCommonPreset((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                />
              </div>
              <div className={styles.inputContainer}>
                <label>Price</label>
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  value={commonPreset.price}
                  onChange={(e) =>
                    setCommonPreset({
                      ...commonPreset,
                      price: e.target.value,
                    })
                  }
                  onBlur={(e) => {
                    const numValue = parseFloat(e.target.value);
                    setCommonPreset({
                      ...commonPreset,
                      price: isNaN(numValue) ? 0 : numValue.toFixed(2),
                    });
                  }}
                />
              </div>
            </div>
          )}
          <button
            className={styles.button}
            disabled={
              submitting || addType !== "common"
                ? !newField.trim()
                : validateCommonFields()
            }
            onClick={(e) => addPreset(e)}
          >
            {submitting ? (
              <div style={{ fontSize: "14px" }}>
                <BeatLoader color="gray" size={8} />
              </div>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      )}
      {editType === "edit" && (
        <div>
          <div className={styles.horStack}>
            <h3>Edit a Preset in</h3>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="descriptions"
                name="options"
                value="descriptions"
                checked={addType === "descriptions"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("descriptions");
                }}
                readOnly
              />
              <label htmlFor="descriptions">Descriptions</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="brands"
                name="options"
                value="brands"
                checked={addType === "brands"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("brands");
                }}
                readOnly
              />
              <label htmlFor="brands">Brands</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="sizes"
                name="options"
                value="sizes"
                checked={addType === "sizes"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("sizes");
                }}
                readOnly
              />
              <label htmlFor="sizes">Sizes</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="common"
                name="options"
                value="common"
                checked={addType === "common"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("common");
                }}
                readOnly
              />
              <label htmlFor="common">Commonly Used</label>
            </div>
          </div>
          <div
            className={styles.mobileFlex}
            style={{ display: "flex", gap: "20px" }}
          >
            <div
              style={{
                maxHeight: "70vh",
                flex: 1,
                overflow: "scroll",
                borderRadius: "10px",
              }}
            >
              <div style={{ position: "relative" }}>
                <FaSearch
                  style={{ position: "absolute", left: "5px", top: "5px" }}
                />
                <input
                  style={{
                    backgroundColor: "#ccd5e0",
                    width: "100%",
                    border: "none",
                    fontSize: "1rem",
                    paddingLeft: "30px",
                  }}
                  className={styles.rowItem}
                  onChange={(e) => {
                    addType === "descriptions"
                      ? setDescriptionSearch(e.target.value)
                      : addType === "brands"
                        ? setBrandSearch(e.target.value)
                        : addType === "sizes"
                          ? setSizeSearch(e.target.value)
                          : setComboSearch(e.target.value);
                  }}
                />
              </div>
              {(addType === "descriptions"
                ? filteredDescriptions
                : addType === "brands"
                  ? filteredBrands
                  : addType === "sizes"
                    ? filteredSizes
                    : filteredCombinations
              ).map((preset, index) => (
                <div
                  className={styles.rowItem}
                  style={{
                    backgroundColor:
                      selectedIds.length > 0 && selectedIds.includes(preset._id)
                        ? "#94a2b2"
                        : index % 2 === 0
                          ? "#dae2eb"
                          : "#ccd5e0",
                  }}
                  onClick={() => editSelectedIds(preset._id)}
                >
                  {addType !== "common"
                    ? preset.description || preset.brand || preset.size
                    : getCommonDescription(preset)}
                </div>
              ))}
            </div>
            <div
              style={{
                maxHeight: "70vh",
                flex: 1,
                overflow: "scroll",
                borderRadius: "10px",
                padding: "10px",
              }}
              className={styles.vertStack}
            >
              <h4>Editing {selectedIds.length} presets</h4>
              <input
                style={{ width: "100%" }}
                className={styles.input}
                value={selectedIds.map(
                  (id) =>
                    " " +
                    (addType === "descriptions"
                      ? descriptionDict[id]?.description
                      : addType === "brands"
                        ? brandDict[id]?.brand
                        : addType === "sizes"
                          ? sizeDict[id]?.size
                          : getCommonDescription(comboDict[id]))
                )}
                readOnly
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <MdOutlineSwapVert
                  style={{
                    fontSize: "32px",
                    color: "gray",
                    cursor: "pointer",
                  }}
                />
              </div>
              {addType !== "common" ? (
                <textarea
                  className={styles.input}
                  style={{ resize: "vertical" }}
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                />
              ) : (
                <div className={styles.commonInputs}>
                  <div
                    className={styles.inputContainer}
                    style={{ flexGrow: "unset" }}
                  >
                    <label>Image</label>
                    {commonPreset.image !== "" ? (
                      <div className={styles.imageContainer}>
                        <img
                          src={commonPreset.image}
                          alt={`Image`}
                          onClick={() => setShowImageOptions(true)}
                          style={{
                            cursor: "pointer",
                          }}
                          title="Click to change image"
                        />
                      </div>
                    ) : (
                      <div
                        className={styles.input}
                        onClick={() => setShowImageOptions(true)}
                        style={{ position: "relative" }}
                      ></div>
                    )}
                    {/* Image upload options dropdown */}
                    {showImageOptions && (
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
                          onClick={(e) => handleFileUploadOption(e)}
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
                          onClick={() => {
                            setShowImageOptions(false);
                            setShowUrlInput(true);
                          }}
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
                    {showUrlInput && (
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
                            onClick={(e) => handleUrlSubmit(e)}
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
                              setShowImageOptions(false);
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
                  </div>
                  {/* Description dropdown */}
                  <div className={styles.inputContainer}>
                    <label>Description</label>
                    <div
                      style={{ position: "relative" }}
                      data-description-dropdown
                    >
                      <input
                        value={
                          commonPreset.descriptionOpen
                            ? descriptionSearch
                            : getDescription(commonPreset)
                        }
                        onClick={() => {
                          setCommonPreset((prev) => ({
                            ...prev,
                            descriptionOpen: true,
                          }));
                          setDescriptionSearch(commonPreset.description);
                        }}
                        onChange={(e) => {
                          if (commonPreset.descriptionOpen) {
                            setDescriptionSearch(e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setCommonPreset((prev) => ({
                            ...prev,
                            descriptionOpen: true,
                          }));
                          setDescriptionSearch(commonPreset.description);
                        }}
                        onKeyDown={(e) =>
                          handleDropdownKeyDown(e, "description")
                        }
                        placeholder={
                          commonPreset.descriptionOpen
                            ? "Search descriptions..."
                            : ""
                        }
                        className={styles.input}
                        style={{
                          margin: 0,
                          minHeight: "auto",
                          width: "100%",
                          caretColor: commonPreset.descriptionOpen
                            ? "auto"
                            : "transparent",
                        }}
                        data-description-dropdown
                      />
                      {commonPreset.descriptionOpen && (
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
                            {filteredDescriptions.length > 0 &&
                              filteredDescriptions.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setCommonPreset((prev) => ({
                                      ...prev,
                                      description: opt.description,
                                      descriptionId: opt._id,
                                      descriptionOpen: false,
                                    }));
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
                              ))}
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                setCommonPreset((prev) => ({
                                  ...prev,
                                  description: descriptionSearch,
                                  descriptionId: null,
                                  descriptionOpen: false,
                                }));
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
                  </div>
                  <div className={styles.inputContainer}>
                    <label>Style</label>
                    <input
                      className={styles.input}
                      value={commonPreset.style}
                      onChange={(e) =>
                        setCommonPreset((prev) => ({
                          ...prev,
                          style: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {/*Brand dropdown*/}
                  <div className={styles.inputContainer}>
                    <label>Brand</label>
                    <div style={{ position: "relative" }} data-brand-dropdown>
                      <input
                        value={
                          commonPreset.brandOpen
                            ? brandSearch
                            : getBrand(commonPreset)
                        }
                        onClick={() => {
                          setCommonPreset((prev) => ({
                            ...prev,
                            brandOpen: true,
                          }));
                          setBrandSearch(commonPreset.brand);
                        }}
                        onChange={(e) => {
                          if (commonPreset.brandOpen) {
                            setBrandSearch(e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setCommonPreset((prev) => ({
                            ...prev,
                            brandOpen: true,
                          }));
                          setBrandSearch(commonPreset.brand);
                        }}
                        onKeyDown={(e) => handleDropdownKeyDown(e, "brand")}
                        placeholder={
                          commonPreset.brandOpen ? "Search brands..." : ""
                        }
                        className={styles.input}
                        style={{
                          margin: 0,
                          minHeight: "auto",
                          width: "100%",
                          caretColor: commonPreset.brandOpen
                            ? "auto"
                            : "transparent",
                        }}
                        data-brand-dropdown
                      />
                      {commonPreset.brandOpen && (
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
                            {filteredBrands.length > 0 &&
                              filteredBrands.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setCommonPreset((prev) => ({
                                      ...prev,
                                      brand: opt.brand,
                                      brandId: opt._id,
                                      brandOpen: false,
                                    }));
                                    setSizeSearch("");
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
                              ))}
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                setCommonPreset((prev) => ({
                                  ...prev,
                                  brand: brandSearch,
                                  brandId: null,
                                  brandOpen: false,
                                }));
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
                  </div>

                  {/* Size dropdown */}
                  <div className={styles.inputContainer}>
                    <label>Size</label>
                    <div style={{ position: "relative" }} data-size-dropdown>
                      <input
                        value={
                          commonPreset.sizeOpen
                            ? sizeSearch
                            : getSize(commonPreset)
                        }
                        onClick={() => {
                          setCommonPreset((prev) => ({
                            ...prev,
                            sizeOpen: true,
                          }));
                          setSizeSearch(commonPreset.size);
                        }}
                        onChange={(e) => {
                          if (commonPreset.sizeOpen) {
                            setSizeSearch(e.target.value);
                          }
                        }}
                        onFocus={() => {
                          setCommonPreset((prev) => ({
                            ...prev,
                            sizeOpen: true,
                          }));
                          setSizeSearch(commonPreset.size);
                        }}
                        onKeyDown={(e) => handleDropdownKeyDown(e, "size")}
                        placeholder={
                          commonPreset.sizeOpen ? "Search sizes..." : ""
                        }
                        className={styles.input}
                        style={{
                          margin: 0,
                          minHeight: "auto",
                          width: "100%",
                          caretColor: commonPreset.sizeOpen
                            ? "auto"
                            : "transparent",
                        }}
                        data-size-dropdown
                      />
                      {commonPreset.sizeOpen && (
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
                            {filteredSizes.length > 0 &&
                              filteredSizes.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    setCommonPreset((prev) => ({
                                      ...prev,
                                      size: opt.size,
                                      sizeId: opt._id,
                                      sizeOpen: false,
                                    }));
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
                              ))}
                            <div
                              className={styles.dropdownItem}
                              style={{
                                color: "#999",
                                padding: "8px 12px",
                                textAlign: "center",
                              }}
                              onClick={() => {
                                setCommonPreset((prev) => ({
                                  ...prev,
                                  size: sizeSearch,
                                  sizeId: null,
                                  sizeOpen: false,
                                }));
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
                  </div>

                  {/* Color and Price inputs */}
                  <div className={styles.inputContainer}>
                    <label>Color</label>
                    <input
                      className={styles.input}
                      value={commonPreset.color}
                      onChange={(e) =>
                        setCommonPreset((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className={styles.inputContainer}>
                    <label>Price</label>
                    <input
                      className={styles.input}
                      type="number"
                      step="0.01"
                      value={commonPreset.price}
                      onChange={(e) =>
                        setCommonPreset({
                          ...commonPreset,
                          price: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value);
                        setCommonPreset({
                          ...commonPreset,
                          price: isNaN(numValue) ? 0 : numValue.toFixed(2),
                        });
                      }}
                    />
                  </div>
                </div>
              )}
              <button
                className={styles.button}
                disabled={
                  selectedIds.length === 0 ||
                  submitting ||
                  (addType !== "common"
                    ? !newField.trim()
                    : validateCommonFields())
                }
                onClick={(e) => editPreset(e)}
              >
                {submitting ? (
                  <div style={{ fontSize: "14px" }}>
                    <BeatLoader color="gray" size={8} />
                  </div>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {editType === "delete" && (
        <div>
          <div className={styles.horStack}>
            <h3>Delete a Preset in</h3>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="descriptions"
                name="options"
                value="descriptions"
                checked={addType === "descriptions"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("descriptions");
                }}
                readOnly
              />
              <label htmlFor="descriptions">Descriptions</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="brands"
                name="options"
                value="brands"
                checked={addType === "brands"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("brands");
                }}
                readOnly
              />
              <label htmlFor="brands">Brands</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="sizes"
                name="options"
                value="sizes"
                checked={addType === "sizes"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("sizes");
                }}
                readOnly
              />
              <label htmlFor="sizes">Sizes</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="common"
                name="options"
                value="common"
                checked={addType === "common"}
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("common");
                }}
                readOnly
              />
              <label htmlFor="common">Commonly Used</label>
            </div>
          </div>

          <div
            style={{
              maxHeight: "70vh",
              flex: 1,
              overflow: "scroll",
              borderRadius: "10px",
            }}
          >
            <div style={{ position: "relative" }}>
              <FaSearch
                style={{ position: "absolute", left: "5px", top: "5px" }}
              />
              <input
                style={{
                  backgroundColor: "#ccd5e0",
                  width: "100%",
                  border: "none",
                  fontSize: "1rem",
                  paddingLeft: "30px",
                }}
                className={styles.rowItem}
                onChange={(e) => {
                  addType === "descriptions"
                    ? setDescriptionSearch(e.target.value)
                    : addType === "brands"
                      ? setBrandSearch(e.target.value)
                      : addType === "sizes"
                        ? setSizeSearch(e.target.value)
                        : setComboSearch(e.target.value);
                }}
              />
            </div>
            {(addType === "descriptions"
              ? filteredDescriptions
              : addType === "brands"
                ? filteredBrands
                : addType === "sizes"
                  ? filteredSizes
                  : filteredCombinations
            ).map((preset, index) => (
              <div
                className={styles.rowItem}
                style={{
                  backgroundColor: index % 2 === 0 ? "#dae2eb" : "#ccd5e0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {addType !== "common"
                  ? preset.description || preset.brand || preset.size
                  : getCommonDescription(preset)}
                <div>
                  {submitting && preset._id === selectedId ? (
                    <BeatLoader color={"black"} />
                  ) : (
                    <FaTrash
                      onClick={(e) => {
                        handleDelete(e, preset._id);
                        setSelectedId(preset._id);
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
