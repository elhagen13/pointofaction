import { useState, useEffect } from "react";
import styles from "./addOptions.module.css";

const AddOption = ({ options, prevPage, setPage }) => {
  const viableOptions = ["description", "brand", "size"];
  const [selectedOption, setSelectedOption] = useState("description");
  const [newItem, setNewItem] = useState("");
  const [potentialMatches, setPotentialMatches] = useState([])

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

      // Create the box first
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
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  };

  useEffect(() => {

  }, [potentialMatches])

  return (
    <div className={styles.vertStack}>
      <div onClick={() => setPage(prevPage)} style={{cursor: "pointer"}}>← Return
      </div>
      <h2>Add Preset Option</h2>
      <div>
      <select
        className={styles.input}
        onChange={(e) => setSelectedOption(e.target.value)}
      >
        {viableOptions.map((opt) => (
          <option value={opt}>{opt}</option>
        ))}
      </select>
      </div>
      <div>
      <textarea
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        style={{resize:"vertical", width:"100%"}}
        className={styles.input}
      />
      </div>
      {
        potentialMatches.map((match) => (
          <div>{match}</div>
        ))
      }
      <button className={styles.button} onClick={addOption}>Submit</button>
    </div>
  );
};

export default AddOption;
