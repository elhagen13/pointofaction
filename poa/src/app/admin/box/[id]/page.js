"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { FaUpload, FaTimes } from "react-icons/fa";
import { CiCirclePlus, CiCircleMinus } from "react-icons/ci";

import styles from "./page.module.css";
import { useUser } from "@clerk/nextjs";
export default function Box() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [boxId, setBoxId] = useState("");
  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [size, setSize] = useState("");
  const [style, setStyle] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  const [changes, setChanges] = useState([]);
  const [negatives, setNegatives] = useState([]);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [movedIndex, setMovedIndex] = useState(null);

  const [options, setOptions] = useState({});

  const { user } = useUser();

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    e.preventDefault();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = (e, index) => {
    e.preventDefault();
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isRightSwipe) setMovedIndex(null);
    if (isLeftSwipe) setMovedIndex(index);
  };

  useEffect(() => {
    const getBoxId = async () => {
      const response = await fetch("/api/inventory/box", {
        method: "GET",
      });
      const result = await response.json();
      console.log(result);

      const boxId = result.data.find((item) => item.boxId == id)._id;
      setBoxId(boxId);
    };

    getBoxId();
  }, []);

  useEffect(() => {
    getItems();
  }, [boxId]);

  const getItems = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });
    const result = await response.json();

    setItems(result.data.filter((item) => item.boxId == boxId));
    setOriginalItems(result.data.filter((item) => item.boxId == boxId));
  };

  const getItemOptions = async () => {
    let response = await fetch("/api/details/brands", {
      method: "GET",
    });
    let resultBrands = await response.json();

    response = await fetch("/api/details/sizes", {
      method: "GET",
    });
    let resultSizes = await response.json();

    response = await fetch("/api/details/descriptions", {
      method: "GET",
    });
    let resultDescriptions = await response.json();
    console.log(resultDescriptions);

    setOptions({
      ...options,
      brands: resultBrands.data,
      sizes: resultSizes.data,
      descriptions: resultDescriptions.data,
    });
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

  useEffect(() => {
    getItemOptions();
  }, []);

  const itemDescriptor = (item) => {
    return `${
      item.brand || brandDict[item.brandId]?.brand || "No brand"
    } ${item.style || "No style"} ${
      item.description ||
      descriptionDict[item.descriptionId]?.description ||
      "No description"
    } ${
      item.size || sizeDict[item.sizeId]?.size || "No size"
    } ${item.color || "No color"}`;
  };

  const handleChanges = async () => {
    const change = {
      user: user.fullName,
      editedOn: new Date(),
      changes: [],
    };

    for (const item of items) {
      if (!item.quantity) {
        alert("Item quantity not valid");
        return;
      }
    }

    for (const [index, item] of items.entries()) {
      try {
        const newData = {
          ...item,
          quantity:
            item.quantity + (negatives[index] ? 1 : -1) * changes[index],
        };

        if (changes[index] && changes[index] !== 0) {
          change.changes.push(
            `Item (${itemDescriptor(item)}) quantity changed: ${item.quantity} -> ${item.quantity + (negatives[index] ? 1 : -1) * changes[index]}`
          );
        }

        // Create the box first
        const response = await fetch(`/api/inventory/item/${item._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newData),
        });
      } catch {
        alert("Error encountered while updating quantities, please try again");
        return false;
      }
    }
    try {
      const boxResponse = await fetch(`/api/inventory/box/${boxId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: change,
        }),
      });
      const data = await boxResponse.json();
      if (!data.success) {
        console.error("Error updating box:", data.error);
        console.error("Details:", data.details);
        throw new Error(data.error || "Unknown error updating box");
      }
      console.log("Box updated successfully:", data.data);
      console.log(change);
    } catch {
      console.error("Error updating box");
      throw new Error("Unknown error updating box");
    }
    console.log(change);

    getItems();
    setChanges([]);
    setNegatives([]);
    setEdit(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return;
      }

      handleUploadImage(file);
    }
  };

  const handleUploadImage = async (file) => {
    console.log(file);
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
        setImage(result.url);
        console.log(result.url);
      } else {
        console.log(result.error || "Upload failed");
      }
    } catch (error) {
      console.log("Network error: " + error.message);
    }
  };

  const cancel = () => {
    setAdd(false);
    setDescription("");
    setImage("");
    setImageUrl("");
    setSize("");
    setStyle("");
    setColor("");
    setQuantity(0);
    setPrice(0);
    setPublic("");
    setSale("");
  };

  const addItem = async () => {
    const itemData = {
      box_id: boxId,
      image: image || imageUrl,
      description: description,
      style: style,
      size: size,
      color: color,
      quantity: parseInt(quantity),
      price: parseInt(price),
      sale: items.length > 0 ? items[0].sale : false,
      public: items.length > 0 ? items[0].public : false,
    };

    const itemResponse = await fetch("/api/inventory/item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
    });

    const itemResult = await itemResponse.json();

    if (itemResult.success) {
      console.log("Item created successfully:", itemResult.data);
      console.log("Message:", itemResult.message);
    } else {
      console.error("Error creating item:", itemResult.error);
      console.error("Details:", itemResult.details);
      alert("Error creating item: " + (itemResult.error || "Unknown error"));
      return false;
    }
    getItems();
    setAdd(false);
  };

  const onChanges = (e, index) => {
    const newChanges = [...changes];
    newChanges[index] = e.target.value;
    setChanges(newChanges);
  };

  const onPosNeg = (index) => {
    const newNegatives = [...negatives];
    newNegatives[index] = !newNegatives[index];
    setNegatives(newNegatives);
  };

  useEffect(() => {
    setChanges(Array(items.length).fill(0));
    setNegatives(Array(items.length).fill(false));
  }, [items]);

  return (
    <>
      {!add ? (
        <div className={styles.scanPage}>
          <h2 className={styles.separateRow}>
            Box #{id} Contents
            <IoAddCircleOutline
              fontSize="32px"
              style={{ marginRight: "15px" }}
              onClick={() => setAdd(!add)}
            />
          </h2>
          <div className={styles.saveChanges} onClick={handleChanges}>
            Save Changes
          </div>
          <div
            style={{ fontWeight: "bold", fontSize: "20px", color: "#c4413f" }}
          >
            Swipe to edit quantity
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              style={{ position: "relative", marginBottom: "10px" }}
            >
              <div
                className={`${styles.separateRow} ${styles.box} ${index === movedIndex ? styles.moved : ""}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={(e) => onTouchEnd(e, index)}
                onClick={() =>
                  movedIndex === index
                    ? setMovedIndex(null)
                    : setMovedIndex(index)
                }
                style={{
                  position: "relative",
                  zIndex: 1,
                  transform:
                    index === movedIndex ? "translateX(-50%)" : "translateX(0)",
                  transition: "transform 0.3s ease",
                }}
              >
                <div className={styles.inventoryRow}>
                  <div className={styles.imagePreview}>
                    <img src={item.image} className={styles.previewImage} />
                  </div>
                  <div className={styles.rowObjectInfo}>
                    <div>
                      <span style={{ fontWeight: "bold" }}>Description:</span>{" "}
                      {item.description ||
                        (descriptionDict[item.descriptionId]
                          ? descriptionDict[item.descriptionId].description
                          : "N/A")}{" "}
                    </div>
                    <div>
                      <span style={{ fontWeight: "bold" }}>Color:</span>{" "}
                      {item.color}
                    </div>
                    <div>
                      <span style={{ fontWeight: "bold" }}>Size:</span>{" "}
                      {console.log(item)}
                      {item.size ||
                        (sizeDict[item.sizeId]
                          ? sizeDict[item.sizeId].size
                          : "N/A")}{" "}
                    </div>
                    <div>
                      <span style={{ fontWeight: "bold" }}>Style:</span>{" "}
                      {item.style}
                    </div>
                  </div>
                </div>
                <h1 style={{ color: "#c2c2c2", minWidth: "15%" }}>
                  <span
                    style={{
                      textDecoration:
                        changes[index] !== 0 && changes[index] !== ""
                          ? "line-through"
                          : "none",
                    }}
                  >
                    {item.quantity}
                  </span>{" "}
                  {changes[index] && changes[index] !== 0 && changes[index] !== ""
                    ? item.quantity +
                      (negatives[index] ? 1 : -1) * changes[index]
                    : ""}{" "}
                  left
                </h1>
              </div>

              <div
                className={styles.mobileEdit}
                style={{
                  width: index === movedIndex ? "50%" : "0%",
                }}
              >
                <div
                  className={styles.mobileEditContents}
                  style={{
                    display: index === movedIndex ? "flex" : "none",
                  }}
                >
                  {negatives[index] ? (
                    <CiCirclePlus
                      fontSize="32px"
                      color="#c2c2c2"
                      onClick={() => onPosNeg(index)}
                    />
                  ) : (
                    <CiCircleMinus
                      fontSize="32px"
                      color="#c2c2c2"
                      onClick={() => onPosNeg(index)}
                    />
                  )}
                  <input
                    className={styles.numberInput}
                    value={changes[index] || ""}
                    onChange={(e) => onChanges(e, index)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.page}>
          <div className={styles.gridLg}>
            <div className={styles.formInput}>
              <label>Description</label>
              <textarea
                className={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: "vertical" }}
                required
              />
            </div>
          </div>
          <div className={styles.gridMd}>
            {image || imageUrl ? (
              <div
                className={styles.imagePreview}
                style={{
                  width: "min(100%, 250px)",
                  maxWidth: "none",
                  aspectRatio: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <img
                    src={image || imageUrl}
                    alt="Uploaded"
                    className={styles.previewImage}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => {
                      setImage("");
                      setImageUrl("");
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
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
                <span style={{ color: "black", fontWeight: "bold" }}>or</span>
                <div className={styles.formInput}>
                  <label>Image URL</label>
                  <input
                    className={styles.input}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>
          <div
            className={styles.gridMd}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div className={styles.formInput}>
              <label>Style</label>
              <input
                className={styles.input}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                required
              />
            </div>
            <div className={styles.formInput}>
              <label>Color</label>
              <input
                className={styles.input}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
            </div>
            <div className={styles.formInput}>
              <label>Size</label>
              <input
                className={styles.input}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.gridMd}>
            <div className={styles.formInput}>
              <label>Quantity</label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                className={styles.input}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.gridMd}>
            <div className={styles.formInput}>
              <label>Unit Price</label>
              <input
                type="text"
                pattern="^\d*\.?\d*$"
                inputMode="decimal"
                className={styles.input}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <div
            style={{
              gridColumn: "span 12",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              onClick={() => cancel()}
              className={styles.saveChanges}
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                minHeight: "32px",
                backgroundColor: "#964242",
              }}
            >
              Cancel
            </div>
            <div
              onClick={addItem}
              className={styles.saveChanges}
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                minHeight: "32px",
              }}
            >
              Add
            </div>
          </div>
        </div>
      )}
    </>
  );
}
