import { useState, useEffect, useRef } from "react";
import styles from "./companyInventory.module.css";

export default function Dropdown({
  currentItem = null,
  options = [],
  placeholder = "Search...",
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchState, setSearchState] = useState(currentItem?.company || "");
  const [selectedValue, setSelectedValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Normalize options to always be strings
  const normalizedOptions = Array.isArray(options)
    ? options.map((opt) => {
        if (typeof opt === "string") {
          return opt;
        }
        return opt?.value || opt?.company || String(opt);
      })
    : [];

  // Filter options based on search
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.toLowerCase().includes(searchState.toLowerCase())
  );

  // Handle typing - debounce the onChange call
  useEffect(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to call onChange after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      if (searchState && !isOpen) {
        // User has typed something and closed the dropdown
        onChange?.(searchState);
      }
    }, 500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [searchState, isOpen]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // Commit the typed value when clicking outside
        if (searchState && searchState !== selectedValue) {
          onChange?.(searchState);
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, searchState, selectedValue]);

  const selectOption = (e, optionIndex) => {
    e.preventDefault();
    e.stopPropagation();

    const selectedOption = filteredOptions[optionIndex];
    if (!selectedOption) return;

    const newValue = String(selectedOption);
    setSelectedValue(newValue);
    setSearchState(newValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    // Immediately call onChange when option is selected
    onChange?.(newValue);
  };

  const handleKeyDown = (e) => {
    // Handle Tab key
    if (e.key === "Tab") {
      setIsOpen(false);
      if (searchState && searchState !== selectedValue) {
        onChange?.(searchState);
      }
      // Don't prevent default - let Tab do its normal navigation
      return;
    }

    if (!isOpen && e.key !== "Enter") {
      setIsOpen(true);
      return;
    }

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
        e.stopPropagation();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          selectOption(e, highlightedIndex);
        } else {
          // User pressed Enter without selecting - commit typed value
          setIsOpen(false);
          onChange?.(searchState);
        }
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (!selectedValue) {
          setSearchState("");
        }
        break;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <input
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onChange={(e) => setSearchState(e.target.value)}
        onKeyDown={handleKeyDown}
        value={searchState}
        className={styles.input}
        style={{ position: "relative" }}
      />
      {isOpen && (
        <div style={{ position: "relative" }}>
          <div className={styles.dropdown}>
            {filteredOptions?.length > 0 ? (
              filteredOptions?.map((opt, i) => (
                <div
                  className={styles.dropdownItem}
                  key={i}
                  style={{
                    backgroundColor:
                      i === highlightedIndex ? "#e0e0e0" : "transparent",
                  }}
                  onMouseDown={(e) => selectOption(e, i)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '8px 12px',
                  color: "#999",
                  fontStyle: "italic",
                }}
              >
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}