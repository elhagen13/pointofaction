import { useState, useEffect, useMemo } from "react";
import styles from "./editPresets.module.css";

/**
 * Add, Edit, or Remove Presets
 * Adding and editing are pretty straight forward,
 * since items are connected with ids, if an item is edited it will then edit every
 * item that has that description/brand/... id
 * Removing a preset will find every item that has that description/brand/... id and
 * replace it with what the description/brand/... id used to represent
 */

const EditPresets = ({ options, prevPage, setPage, refresh }) => {
  const editTypes = ["add", "edit", "delete"];
  const colors = ["#007f4e", "#f37324", "#e12729"];
  const [editType, setEditType] = useState("add");
  const [addType, setAddType] = useState("descriptions");
  const [newField, setNewField] = useState("");
  const [submitting, isSubmitting] = useState(false);
  const [descriptions, setDescriptions] = useState(options.descriptions)
  const [brands, setBrands] = useState(options.brands)
  const [sizes, setSizes] = useState(options.sizes)


  const addPreset = async () => {
    console.log("dfjks");
    if (submitting) return;
    isSubmitting(true);
    console.log("inside");
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
      setNewField("");
      isSubmitting(false);
      return data.data;
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  };

  return (
    <div className={styles.vertStack}>
      <div onClick={() => setPage(prevPage)} style={{ cursor: "pointer" }}>
        ← Return
      </div>
      <h2>Change Presets</h2>
      <div className={styles.horStack}>
        {editTypes.map((et, index) => (
          <div
            style={{
              border: `2px solid ${colors[index]}`,
              color: editType === et ? "white" : colors[index],
              backgroundColor: editType === et ? colors[index] : "white",
            }}
            className={styles.pageButton}
            onClick={() => setEditType(et)}
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
                onClick={() => setAddType("descriptions")}
              />
              <label for="descriptions">Descriptions</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="brands"
                name="options"
                value="brands"
                checked={addType === "brands"}
                onClick={() => setAddType("brands")}
              />
              <label for="brands">Brands</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="sizes"
                name="options"
                value="sizes"
                checked={addType === "sizes"}
                onClick={() => setAddType("sizes")}
              />
              <label for="sizes">Sizes</label>
            </div>
          </div>
          <textarea
            className={styles.input}
            style={{ resize: "vertical" }}
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
          />
          <button
            className={styles.button}
            disabled={!newField.trim()}
            onClick={addPreset}
          >
            Submit
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
                onClick={() => setAddType("descriptions")}
              />
              <label for="descriptions">Descriptions</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="brands"
                name="options"
                value="brands"
                checked={addType === "brands"}
                onClick={() => setAddType("brands")}
              />
              <label for="brands">Brands</label>
            </div>
            <div className={styles.horStack} style={{ gap: "3px" }}>
              <input
                type="radio"
                id="sizes"
                name="options"
                value="sizes"
                checked={addType === "sizes"}
                onClick={() => setAddType("sizes")}
              />
              <label for="sizes">Sizes</label>
            </div>
          </div>
          <div>
          <div style={{maxHeight:"70vh", width: "50%", overflow: "scroll", borderRadius:"10px"}}>
            <input style={{backgroundColor: "#ccd5e0", width: "100%", border : "none", fontSize: "1rem"}} className={styles.rowItem}/>
            {
                (addType === "descriptions" ? descriptions : addType === "brands" ? brands : sizes).map((preset, index) => 
                <div className={styles.rowItem} style={{backgroundColor:  index % 2 === 0 ? "#dae2eb" : "#ccd5e0",}}>
                    {preset.description || preset.brand || preset.size}
                </div>)
            }
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default EditPresets;
