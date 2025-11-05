import {useState, useEffect, useRef} from 'react'
import styles from "./companyInventory.module.css"

export default function Dropdown({ currentItem = null, options = [], placeholder = "Search...", onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchState, setSearchState] = useState(currentItem?.company || "");
  const [selectedValue, setSelectedValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Normalize options to always be strings
  const normalizedOptions = options ? options.map((opt) => {
    if (typeof opt === "string") {
      return opt;
    }
    return opt?.value || opt?.company || String(opt);
  }) : []

  // Filter options based on search
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.toLowerCase().includes(searchState.toLowerCase())
  );

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, selectedValue]);

  const selectOption = (e, optionIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const selectedOption = filteredOptions[optionIndex];
    if (!selectedOption) return;

    setSelectedValue(selectedOption);
    setSearchState(selectedOption);
    onChange?.(selectedOption);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
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
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          selectOption(e, highlightedIndex);
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
        onChange={(e) => {setSearchState(e.target.value);onChange?.(e.target.value);}}
        onKeyDown={handleKeyDown}
        value={searchState}
        className={styles.input}
        style={{position: "relative"}}
      />
      {isOpen && (
        <div style={{position: "relative"}}>
        <div className={styles.dropdown}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div
                className={styles.dropdownItem}
                key={i}
                style={{
                  ...(i === highlightedIndex ? styles.highlighted : {}),
                }}
                onMouseDown={(e) => selectOption(e, i)}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                {opt}
              </div>
            ))
          ) : (
            <div
              style={{ ...styles.dropdownItem, color: "#999", fontStyle: "italic" }}
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