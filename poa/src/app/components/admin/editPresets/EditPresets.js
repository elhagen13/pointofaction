import { useState, useEffect, useMemo } from "react";
import styles from "./editPresets.module.css";
import { FaSearch, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { TfiExchangeVertical } from "react-icons/tfi";
import { MdAdd, MdAddCircle, MdOutlineSwapVert } from "react-icons/md";

/**
 * Add, Edit, or Remove Presets
 * Adding and editing are pretty straight forward,
 * since items are connected with ids, if an item is edited it will then edit every
 * item that has that description/brand/... id
 * Removing a preset will find every item that has that description/brand/... id and
 * replace it with what the description/brand/... id used to represent
 */

const EditPresets = ({ options, prevPage, setPage, refresh }) => {
  const [inventory, setInventory] = useState([]);
  const editTypes = ["add", "edit", "delete"];
  const colors = ["#007f4e", "#f37324", "#e12729"];
  const [editType, setEditType] = useState("add");
  const [addType, setAddType] = useState("descriptions");
  const [newField, setNewField] = useState("");
  const [submitting, isSubmitting] = useState(false);

  const [descriptionSearch, setDescriptionSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [sizeSearch, setSizeSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
  };

  useEffect(() => {
    getInventory();
  }, []);

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

    return options.brands.filter((desc) =>
      desc.brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [options?.brands, brandSearch]);

  const filteredSizes = useMemo(() => {
    if (!options?.sizes) return [];

    if (!sizeSearch.trim()) {
      return options.sizes;
    }

    return options.sizes.filter((desc) =>
      desc.size.toLowerCase().includes(sizeSearch.toLowerCase())
    );
  }, [options?.sizes, sizeSearch]);

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
  const editPreset = async (e) => {
    console.log("1");
    e.preventDefault();
    if (submitting) return;
    isSubmitting(true);

    /**
     * If edit, make a new description/size/brand.
     * Go through all inventory, if they have a matching description/size/brand id
     * then replace it with the new one;
     * Finally delete the old one
     */
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

      const newId = data.data._id;

      //go through every item and if they have a matching
      //description/brand/size id replace it with the new id
      for (const item of inventory) {
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

          // Refresh inventory after each update
          await getInventory();
        }
      }
      for (const id of selectedIds) {
        const response = await fetch(`${url}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!data.success) {
          console.error("Error creating item:", data.error);
          console.error("Details:", data.details);
          alert("Error creating item: " + (data.error || "Unknown error"));
          return false;
        }
      }
      refresh();
      setSelectedIds([]);
      setNewField("");
      isSubmitting(false);
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  };

  //go through all inventory, if it has the id under that descriptor, then remove
  //the id and replace it with description: instead of descriptionId
  const handleDelete = async (e, id) => {
    if (submitting) return;
    isSubmitting(true);
    e.preventDefault();

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

    await refresh();
    isSubmitting(false);
    return;
  };

  const editSelectedIds = (id) => {
    console.log(selectedIds);
    if (!selectedIds) return;
    selectedIds.includes(id)
      ? setSelectedIds(selectedIds.filter((x) => x !== id))
      : setSelectedIds([...selectedIds, id]);
  };

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

  const descriptionDict = useMemo(() => {
    if (!options.descriptions) return {};
    const dict = {};
    options.descriptions.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

  const brandDict = useMemo(() => {
    if (!options.brands) return {};
    const dict = {};
    options.brands.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

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
            onClick={(e) => addPreset(e)}
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
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("descriptions");
                }}
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
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("brands");
                }}
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
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("sizes");
                }}
              />
              <label for="sizes">Sizes</label>
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
                        : setSizeSearch(e.target.value);
                  }}
                />
              </div>
              {(addType === "descriptions"
                ? filteredDescriptions
                : addType === "brands"
                  ? filteredBrands
                  : filteredSizes
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
                  {preset.description || preset.brand || preset.size}
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
                        : sizeDict[id]?.size)
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
              <textarea
                className={styles.input}
                style={{ resize: "vertical" }}
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
              />
              <button
                className={styles.button}
                disabled={submitting || !newField.trim()}
                onClick={(e) => editPreset(e)}
              >
                Submit
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
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("brands");
                }}
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
                onClick={() => {
                  setSelectedIds([]);
                  setAddType("sizes");
                }}
              />
              <label for="sizes">Sizes</label>
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
                      : setSizeSearch(e.target.value);
                }}
              />
            </div>
            {(addType === "descriptions"
              ? filteredDescriptions
              : addType === "brands"
                ? filteredBrands
                : filteredSizes
            ).map((preset, index) => (
              <div
                className={styles.rowItem}
                style={{
                  backgroundColor:
                    index % 2 === 0
                        ? "#dae2eb"
                        : "#ccd5e0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {preset.description || preset.brand || preset.size}
                <div>
                  {submitting && preset._id === selectedId ? (
                    "loading..."
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
};

export default EditPresets;
