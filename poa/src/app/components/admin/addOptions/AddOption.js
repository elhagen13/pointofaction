import { useState, useEffect, useMemo } from "react";
import styles from "./addOptions.module.css";

const AddOption = ({ options, prevPage, setPage, refresh }) => {
  console.log(options);
  const viableOptions = ["description", "brand", "size"];
  const [selectedOption, setSelectedOption] = useState("description");
  const [newItem, setNewItem] = useState("");

  const addOption = async () => {
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
      setNewItem("");
      refresh();
      setPage(prevPage)
      
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  };
  const filteredMatches = useMemo(() => {
    let items;
    
    switch (selectedOption) {
      case "description":
        items = options.descriptions || [];
        break;
      case "size":
        items = options.sizes || [];
        break;
      case "brand":
        items = options.brands || [];
        break;
      default:
        items = options.descriptions || [];
    }
  
    // Apply search filter
    if (newItem.trim() === "") {
      return items;
    }
  
    const searchTerm = newItem.toLowerCase().trim();
    
    return items.filter((item) => {
      // Get the item text and normalize it (remove hyphens, etc.)
      let itemText;
      if (typeof item === 'string') {
        itemText = item.toLowerCase();
      } else {
        itemText = [
          item.description || "",
          item.brand || "",
          item.size || "",
        ]
        .join(" ")
        .toLowerCase();
      }
  
      // Normalize item text (remove hyphens for matching)
      const normalizedItemText = itemText.replace(/-/g, "");
  
      // Split search term into words
      let searchWords = searchTerm
        .split(/\s+/)
        .filter((word) => word.length > 0);
      
      if (searchWords.length === 0) return true;
  
      // Define synonym groups - these will match if ANY part contains the search
      const synonymGroups = [
        ["tshirt", "tee", "t-shirt", "teeshirt"], // All variations of t-shirt
      ];
  
      // Check each search word
      return searchWords.every((searchWord) => {
        const normalizedSearchWord = searchWord.replace(/-/g, "");
        
        // First, check direct partial match in normalized text
        if (normalizedItemText.includes(normalizedSearchWord)) {
          return true;
        }
        
        // Then check if this search word should trigger synonym matching
        for (const synonymGroup of synonymGroups) {
          // Check if any synonym in the group partially matches our search word
          // OR if our search word partially matches any synonym
          const isRelated = synonymGroup.some(synonym => {
            const normalizedSynonym = synonym.replace(/-/g, "");
            return normalizedSynonym.includes(normalizedSearchWord) || 
                   normalizedSearchWord.includes(normalizedSynonym);
          });
          
          if (isRelated) {
            // Check if the item contains any of the synonyms
            return synonymGroup.some(synonym => {
              const normalizedSynonym = synonym.replace(/-/g, "");
              return normalizedItemText.includes(normalizedSynonym);
            });
          }
        }
        
        // If no synonym group matched, fall back to original partial match
        return itemText.includes(searchWord);
      });
    });
  }, [newItem, selectedOption, options]);

  return (
    <div className={styles.vertStack}>
      <div onClick={() => setPage(prevPage)} style={{ cursor: "pointer" }}>
        ← Return
      </div>
      <h2>Add Preset Option</h2>
      
      <div>
        <select
          className={styles.input}
          value={selectedOption} // Add controlled value
          onChange={(e) => setSelectedOption(e.target.value)}
        >
          {viableOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option> // Add key
          ))}
        </select>
      </div>
      
      <div>
        <textarea
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          style={{ resize: "vertical", width: "100%" }}
          className={styles.input}
          placeholder={`Enter new ${selectedOption}...`}
        />
      </div>
      { newItem.length >= 1 && <div>
      <h3>Similar</h3>
      {filteredMatches.map((match, index) => (
        <div key={index} style={{backgroundColor: index % 2 === 0 ? "#dae2eb" : "#ccd5e0", padding: "10px"}}>
          {typeof match === 'string' ? match : match[selectedOption] || JSON.stringify(match)}
        </div>
      ))}</div>}
      
      <button 
        className={styles.button} 
        onClick={addOption}
        disabled={!newItem.trim()} // Disable if empty
      >
        Submit
      </button>
    </div>
  );
};

export default AddOption;