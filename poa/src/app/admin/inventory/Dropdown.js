import { useState, useRef, useEffect } from "react";
import styles from "./inventory.module.css";
import { FaBookmark, FaPlus } from "react-icons/fa";

export default function Dropdown({
  configs,
  config_type,
  contents,
  setContents,
  index,
  setUnsavedChanges,
  refresh,
  currentItem,
  setCurrentItem,
  disabledInput = false,
  onDropdownStateChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [exiting, setExiting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const configDict = configs[config_type]?.dictionary || {};

  // Notify parent when dropdown state changes
  useEffect(() => {
    onDropdownStateChange?.(isOpen);
  }, [isOpen, onDropdownStateChange]);

  const getCurrentValue = () => {
    if (index !== undefined && index !== null && contents) {
      return contents[index]?.[config_type] || "";
    }
    return currentItem?.[config_type] || "";
  };

  const getCurrentIdValue = () => {
    if (index !== undefined && index !== null && contents) {
      return contents[index]?.[`${config_type}Id`];
    }
    return currentItem?.[`${config_type}Id`];
  };

  const updateValue = (newValue, newId = null) => {
    setUnsavedChanges?.(true);
    
    if (index !== undefined && index !== null && contents && setContents) {
      setContents(prevContents => 
        prevContents.map((item, i) => 
          i === index 
            ? { 
                ...item, 
                [config_type]: newValue,
                [`${config_type}Id`]: newId 
              }
            : item
        )
      );
    } else if (setCurrentItem) {
      setCurrentItem(prev => ({
        ...prev,
        [config_type]: newValue,
        [`${config_type}Id`]: newId
      }));
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // Revert to original value if search is empty
        if (configs[config_type]?.searchState === "") {
          configs[config_type]?.setSearchState?.(getCurrentValue());
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, configs, config_type]);

  const onExit = (e, exitType) => {
    e.preventDefault();
    if (exiting) return;
    setExiting(true);

    if (exitType === "click") {
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      const { searchState } = configs[config_type] || {};
      setIsOpen(false);
      setHighlightedIndex(-1);

      // If search is empty, revert to original value
      if (!searchState || searchState === "") {
        configs[config_type]?.setSearchState?.(getCurrentValue());
        setExiting(false);
        return;
      }

      let match = configDict[searchState.toLowerCase()];
      
      if (match) {
        updateValue(match[config_type], match._id);
      } else {
        updateValue(searchState, null);
      }
    }
    setExiting(false);
  };

  const addOptDb = async (selectedOption, newItem) => {
    if (submitting || !newItem) return;
    setSubmitting(true);
    
    try {
      const response = await addOption(selectedOption, newItem);
      
      if (response) {
        updateValue(response[config_type], response._id);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error adding option:", error);
    } finally {
      setSubmitting(false);
    }
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
        default:
          console.error("Unknown option type:", selectedOption);
          return null;
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
        return null;
      }
      
      console.log("Item created successfully:", data.data);
      console.log("Message:", data.message);
      
      refresh?.();
      return data.data;
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return null;
    }
  };

  const selectFromDropdown = (e, optionIndex) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event from bubbling up
    const filteredOptions = configs[config_type]?.filteredOptions || [];
    const selectedOption = filteredOptions[optionIndex];
    
    if (!selectedOption) return;
    
    updateValue(selectedOption[config_type], selectedOption._id);
    
    // Clear the search state to match the selected value
    configs[config_type]?.setSearchState?.(selectedOption[config_type]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    const filteredOptions = configs[config_type]?.filteredOptions || [];

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        e.stopPropagation(); // Prevent parent form submission
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          selectFromDropdown(e, highlightedIndex);
        }
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setHighlightedIndex(-1);
        // Revert to original value
        const originalValue = index !== undefined && index !== null 
          ? contents[index]?.[config_type] || ""
          : currentItem?.[config_type] || "";
        configs[config_type]?.setSearchState?.(originalValue);
        break;
    }
  };

  const currentValue = getCurrentValue();
  const currentIdValue = getCurrentIdValue();
  const searchState = configs[config_type]?.searchState || "";
  const filteredOptions = configs[config_type]?.filteredOptions || [];
  const dictValue = configDict[currentIdValue]?.[config_type];

  return (
    <div ref={dropdownRef} style={{ position: "relative", width:"100%"}}>
      <input
        disabled={disabledInput}
        style={{width:"100%"}}
        className={styles.input}
        onFocus={() => setIsOpen(true)}
        onClick={(e) => onExit(e, "click")}
        onBlur={(e) => onExit(e, "blur")}
        onChange={(e) => configs[config_type]?.setSearchState?.(e.target.value)}
        onKeyDown={handleKeyDown}
        value={
          isOpen
            ? searchState
            : currentValue || (dictValue || "N/A")
        }
      />
      {isOpen && (
        <div className={styles.dropdown} style={{ maxWidth: "250px" }}>
          {filteredOptions.map((opt, i) => (
            <div
              key={opt._id || i}
              className={`${styles.dropdownItem} ${i === highlightedIndex ? styles.highlighted : ""}`}
              style={{
                fontWeight: "bold",
                backgroundColor:
                  i === highlightedIndex ? "#e6f3ff" : "transparent",
              }}
              onMouseDown={(e) => selectFromDropdown(e, i)}
              onMouseEnter={() => setHighlightedIndex(i)}
            >
              {opt[config_type]}
            </div>
          ))}
          
          {/* Add to inventory option */}
          <div
            className={styles.dropdownItem}
            style={{
              color: "#999",
              padding: "8px 12px",
              textAlign: "center",
              cursor: "pointer",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addOptDb(config_type, searchState);
            }}
          >
            <div>
              Add to inventory? <FaBookmark />
            </div>
          </div>
          
          {/* Add only to item option */}
          <div
            className={styles.dropdownItem}
            style={{
              color: "#999",
              padding: "8px 12px",
              textAlign: "center",
              cursor: "pointer",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updateValue(searchState, null);
              setIsOpen(false);
            }}
          >
            <div>
              Add only to item? <FaPlus />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}