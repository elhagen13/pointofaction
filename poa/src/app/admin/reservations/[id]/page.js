"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import React from "react";
import styles from "./reserve.module.css";
import { FaTrash } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import AddBox from "@/app/components/admin/AddBox";
import { BeatLoader } from "react-spinners";
import { useRouter } from "next/navigation";

export default function Reservation({ params }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState(null);
  const [options, setOptions] = useState({});
  const [newBox, setNewBox] = useState(null);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState("");
  const [boxes, setBoxes] = useState([]);
  const [displaced, setDisplaced] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);

  const [displacedPlacement, setDisplacedPlacement] = useState({});

  const [saveVersion, setSaveVersion] = useState(1);
  const [newBoxVersion, setNewBoxVersion] = useState(0);

  const [newBoxes, setNewBoxes] = useState([]);
  const [addBoxVisible, setAddBoxVisible] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getReservation();
    getInventory();
    getItemOptions();
    getBoxes();
  }, []);

  const refresh = () => {
    getReservation();
    getInventory();
  };

  const appendToBox = (itemData) => {
    setNewBoxes([
      ...newBoxes,
      {
        ...itemData,
        boxId: selectedBox._id,
      },
    ]);
    setAddBoxVisible(false);
    setDisplaced(displaced.filter((d) => !d.selected));
    setSelectedBox(null);
  };

  useEffect(() => {
    console.log(newBoxes);
  }, [newBoxes]);

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.size.toLowerCase()] = item;
    });
    return dict;
  }, [options]);

  const descriptionDict = useMemo(() => {
    if (!options.descriptions) return {};
    const dict = {};
    options.descriptions.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.description.toLowerCase()] = item;
    });
    return dict;
  }, [options]);

  const brandDict = useMemo(() => {
    if (!options.brands) return {};
    const dict = {};
    options.brands.forEach((item) => {
      dict[item._id.toString()] = item;
      dict[item.brand.toLowerCase()] = item;
    });
    return dict;
  }, [options]);

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

    setOptions({
      ...options,
      brands: resultBrands.data,
      sizes: resultSizes.data,
      descriptions: resultDescriptions.data,
    });
  };


  useEffect(() => {
    console.log(reservation);
  }, [reservation]);

  const contentDict = useMemo(() => {
    const dict = {};
    inventory.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [inventory]);

  useEffect(() => {
    if (!inventory || !reservation || Object.entries(contentDict).length <= 0)
      return;
    let cartList = [];

    for (const item of reservation.items) {
      if(contentDict[item.itemId]){
        cartList.push({
        ...contentDict[item.itemId],
        inOrder: item.quantReserved || 0,
        pulledAlready: item.pulled || 0,
      })
    }
    
      else{
        cartList.push({
          image: item.image,
          brand: item.brand,
          style: item.style,
          color: item.color,
          description: item.description,
          size: item.size,
          inOrder: item.quantReserved || 0,
          pulledAlready: item.pulled || 0,
        })
      }
      
    }
    console.log("Cart List", cartList);

    let cartDict = {};
  

    for (const item of cartList) {
      let brand =
        item.brand?.toLowerCase() ||
        brandDict[item.brandId]?.brand.toLowerCase() ||
        "N/A";
      let style = item.style?.toLowerCase() || "N/A";
      let color = item.color?.toLowerCase() || "N/A";
      let key = `${style},${brand},${color}`;

      let size =
        item.size?.toLowerCase() ||
        sizeDict[item.sizeId]?.size.toLowerCase() ||
        "N/A";

      if (!cartDict[key]) {
        cartDict[key] = {
          image: item.image,
          color: item.color,
          brand: item.brand || brandDict[item.brandId]?.brand || "N/A",
          description:
            item.description ||
            descriptionDict[item.descriptionId]?.description ||
            "N/A",
          style: item.style,
          price: item.price,
          sizes: {
            [size]: {
              inOrder: item.inOrder,
              pulled: item.pulledAlready,
              newQuantity: item.inOrder,
            },
          },
        };
      } else if (!cartDict[key].sizes[size]) {
        cartDict[key].sizes[size] = {
          inOrder: item.inOrder,
          pulled: item.pulledAlready,
          newQuantity: item.inOrder,
        };
      } else {
        cartDict[key].sizes[size].inOrder += item.inOrder;
        cartDict[key].sizes[size].pulled += item.pulledAlready;
        cartDict[key].sizes[size].newQuantity += item.inOrder;
      }
    }

    for (const item of inventory) {
      let brand =
        item.brand?.toLowerCase() ||
        brandDict[item.brandId]?.brand.toLowerCase() ||
        "N/A";
      let style = item.style?.toLowerCase() || "N/A";
      let color = item.color?.toLowerCase() || "N/A";
      let key = `${style},${brand},${color}`;

      let size =
        item.size?.toLowerCase() ||
        sizeDict[item.sizeId]?.size.toLowerCase() ||
        "N/A";
      if (cartDict[key]?.sizes[size]) {
        if (!cartDict[key].sizes[size].quantity)
          cartDict[key].sizes[size].quantity = 0;
        if (!cartDict[key].sizes[size].reserved)
          cartDict[key].sizes[size].reserved = 0;

        cartDict[key].sizes[size].quantity += item.quantity;
        cartDict[key].sizes[size].reserved += item.reserved;
      }
    }
    console.log("CARTDICT", cartDict)
    setItems(Object.values(cartDict));
  }, [
    inventory,
    reservation,
    contentDict,
    brandDict,
    sizeDict,
    descriptionDict,
  ]);

  useEffect(() => {
    console.log(items);
  }, [items]);

  const getReservation = async () => {
    const response = await fetch(`/api/catalog/reservation/${id}`, {
      method: "GET",
    });

    const result = await response.json();

    setReservation(result.data[0]);
  };

  const getInventory = async () => {
    const response = await fetch("/api/inventory/all", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
  };

  const validate = (e, value, index) => {
    console.log(value);
    let newValue = e.target.value;
    if (isNaN(newValue)) {
    } else if (newValue < value.pulled) {
      setNewBox({
        location: "",
      });
      console.log("Item displaced");
    }
  };

  useEffect(() => {
    console.log("brandDIct", brandDict);
    if (
      !items ||
      items.length <= 0 ||
      !brandDict ||
      !sizeDict ||
      !descriptionDict
    )
      return;
    console.log(items);
    let displacedItems = [];
    for (const item of items) {
      console.log(item);
      Object.entries(item.sizes).forEach(([key, val], index) => {
        if (val.pulled > val.newQuantity) {
          const newItem = {
            image: item.image,
            style: item.style,
            price: item.price,
            color: item.color,
            quantity: val.pulled - val.newQuantity,
            reserved: 0,
          };
          if (brandDict[item.brand.toLowerCase()])
            newItem.brandId = brandDict[item.brand.toLowerCase()]._id;
          else newItem.brand = item.brand;

          if (descriptionDict[item.description.toLowerCase()])
            newItem.descriptionId =
              descriptionDict[item.description.toLowerCase()]._id;
          else newItem.description = item.description;

          if (sizeDict[key.toLowerCase()])
            newItem.sizeId = sizeDict[key.toLowerCase()]._id;
          else newItem.size = key.toUpperCase();

          displacedItems.push(newItem);
        }
      });
    }

    setDisplaced(displacedItems);
  }, [items]);

  const setItemQuantities = (index) => {
    setItems((prevItems) =>
      prevItems.map((prevItem, i) => {
        if (i === index) {
          return {
            ...prevItem,
            sizes: Object.keys(prevItem.sizes).reduce((acc, size) => {
              acc[size] = {
                ...prevItem.sizes[size],
                newQuantity: 0,
              };
              return acc;
            }, {}),
          };
        }
        return prevItem;
      })
    );
  };

  const changeInput = (e, index, sizeKey) => {
    console.log(e.target.value, index, sizeKey);
    setItems((prevItems) =>
      prevItems.map((prevItem, i) => {
        if (i === index) {
          console.log(prevItem);
          return {
            ...prevItem,
            sizes: {
              ...prevItem.sizes,
              [sizeKey]: {
                ...prevItem.sizes[sizeKey],
                newQuantity: e.target.value,
              },
            },
          };
        }
        return prevItem;
      })
    );
  };

  const changeSelected = (index) => {
    setDisplaced((prevDisplaced) =>
      prevDisplaced.map((prevItem, i) => {
        if (i === index) {
          return {
            ...prevItem,
            selected: !prevItem.selected,
          };
        }
        return prevItem;
      })
    );
  };

  useEffect(() => {
    console.log("displaced", displaced);
  }, [displaced]);

  const getBoxes = async () => {
    const response = await fetch("/api/inventory/box", {
      method: "GET",
    });

    const result = await response.json();
    setBoxes(result.data);
  };

  const filteredBoxes = boxes.filter(
    (b) =>
      b.boxId.toLowerCase().includes(dropdownSearchTerm.toLowerCase()) ||
      b.description?.toLowerCase().includes(dropdownSearchTerm.toLowerCase()) ||
      b.location?.toLowerCase().includes(dropdownSearchTerm.toLowerCase())
  );

  const saveToBox = () => {
    if (!displacedPlacement[selectedBox._id]) {
      console.log("new box id");
      console.log(
        "matching",
        displaced.filter((d) => d.selected)
      );
      setDisplacedPlacement({
        ...displacedPlacement,
        [selectedBox._id]: displaced.filter((d) => d.selected),
      });
    } else {
      console.log("old box id");
      console.log(
        "matching",
        displaced.filter((d) => d.selected)
      );
      setDisplacedPlacement({
        ...displacedPlacement,
        [selectedBox._id]: displacedPlacement[selectedBox._id].concat(
          displaced.filter((d) => d.selected)
        ),
      });
    }

    if (selectedBox._id.includes("Box-")) {
      setAddBoxVisible(true);
    } else {
      setDisplaced(displaced.filter((d) => !d.selected));
      setSelectedBox(null);
    }
  };

  const reset = () => {
    refresh();
    setDisplaced([]);
    setDisplacedPlacement({});
    setSaveVersion(1);
    setSelectedBox(null);
  };

  const uploadBox = async (item) => {
    const boxData = {
      history: item.history,
      imageLink: item.imageLink,
      location: item.location,
      description: item.description,
      ...(item.visibilty &&
        item.visibility.includes("sale") && {
          discount: item.boxDiscount,
          minPrice: item.minimumPrice,
        }),
    };

    // Create the box first
    const boxResponse = await fetch("/api/inventory/box", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(boxData),
    });

    const data = await boxResponse.json();

    if (!data.success) {
      console.error("Error creating box:", data.error);
      console.error("Details:", data.details);
      throw new Error(data.error || "Unknown error creating box");
    }
    console.log("DATA: ", data);

    return data.data._id;
  };

  const handleSubmit = async (e) => {
    setSubmitting(true);
    e.preventDefault();
    console.log("Displaced Placement", displacedPlacement);
    console.log("New Boxes", newBoxes);
  
    try {
      // Process displaced placement items
      for (const [key, val] of Object.entries(displacedPlacement)) {
        let boxId = key;
        if (key.includes("Box-")) {
          boxId = await uploadBox(newBoxes.find((box) => box.boxId == key));
        }
  
        // Wait for all items in this box to be processed
        for (const item of val) {
          const itemData = {
            box_id: boxId,
            image: item.image,
            style: item.style,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
            sale: false,
            public: false,
            reserved: 0,
            ...(item.brandId && { brandId: String(item.brandId) }),
            ...(item.brand && { brand: String(item.brand) }),
            ...(item.descriptionId && {
              descriptionId: String(item.descriptionId),
            }),
            ...(item.description && {
              descriptionId: String(item.description),
            }),
            ...(item.sizeId && { sizeId: String(item.sizeId) }),
            ...(item.size && { sizeId: String(item.size) }),
          };
          await addToBox(itemData); // Add await here
        }
      }
  
      // Process reservation updates
      for (const item of items) {
        console.log(item);
        const { style, color, brand } = item;
        
        // Process all size updates for this item
        for (const [key, val] of Object.entries(item.sizes)) {
          console.log(val);
          if (val.newQuantity > val.inOrder) {
            await addToReservation( // Add await here
              style,
              color,
              brand,
              key,
              parseInt(val.newQuantity) - val.inOrder
            );
          } else if (val.newQuantity < val.inOrder) {
            await removeFromReservation( // Add await here
              style,
              color,
              brand,
              key,
              val.inOrder - parseInt(val.newQuantity)
            );
          }
        }
      }
  
      // Now all operations are complete, safe to navigate
      router.push(`/admin/reservations?id=${id}`);
    } catch (error) {
      console.error("Error during submission:", error);
      // Handle the error appropriately
    } finally {
      setSubmitting(false); // Move this to finally block
    }
  };
  
  const addToBox = async (itemToAdd) => {
    try {
      const addToInventory = await fetch(`/api/inventory/item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemToAdd),
      });
      
      if (!addToInventory.ok) {
        throw new Error(`HTTP error! status: ${addToInventory.status}`);
      }
      
      return await addToInventory.json();
    } catch (error) {
      console.error("Error adding item to box:", error);
      throw new Error("Could not add item to Box");
    }
  };
  
  const addToReservation = async (style, color, brand, size, increasedQuant) => {
    try {
      const response = await fetch("/api/catalog", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          style: style,
          color: color,
          brand: brand,
          size: size,
          quantityToReserve: increasedQuant,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
  
      const editReservation = await fetch(`/api/catalog/reservation/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationDetails: result.reservationDetails,
          type: "add",
        }),
      });
  
      if (!editReservation.ok) {
        throw new Error(`HTTP error! status: ${editReservation.status}`);
      }
  
      return await editReservation.json();
    } catch (error) {
      console.error("Error adding to reservation:", error);
      throw new Error("Could not add item to reservation");
    }
  };
  
  const removeFromReservation = async (style, color, brand, size, decreasedQuant) => {
    try {
      const editReservation = await fetch(`/api/catalog/reservation/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          style: style,
          color: color,
          brand: brand,
          size: size,
          quantityToRemove: decreasedQuant,
        }),
      });
  
      if (!editReservation.ok) {
        throw new Error(`HTTP error! status: ${editReservation.status}`);
      }
  
      return await editReservation.json();
    } catch (error) {
      console.error("Error removing from reservation:", error);
      throw new Error("Could not remove item from reservation");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "end",
          marginBottom: "20px",
        }}
      >
        <GrPowerReset size={25} onClick={reset} style={{ cursor: "pointer" }} />
      </div>
      {items?.map((item, index) => (
        <>
          <div key={index} className={styles.cartRow}>
            <div className={styles.imageContainer}>
              <img src={item.image} className={styles.rowImage} ></img>
            </div>
            <div style={{ fontWeight: "bold" }}>
              <div>
                {brandDict[item.brand]?.brand || item.brand || ""} {item.style}{" "}
                {descriptionDict[item.description]?.description ||
                  item.description ||
                  ""}
              </div>
              <div style={{ color: "gray" }}>{item.color}</div>
            </div>
            <div className={styles.sizeBreakdown}>
              <div
                className={styles.column}
                style={{ textAlign: "right", fontWeight: "bold" }}
              >
                <div style={{ padding: "5px" }}>Size</div>
                <div style={{ padding: "5px" }}>Original Quantity</div>
                <div style={{ padding: "5px" }}>Pulled</div>
                <div style={{ padding: "5px" }}>Available</div>
                <div style={{ padding: "5px" }}>New Quantity</div>
              </div>
              {Object.entries(item.sizes).map(([sizeKey, val], sizeIndex) => (
                <div
                  key={sizeKey}
                  className={styles.column}
                  style={{ borderRadius: "5px", overflow: "hidden" }}
                >
                  <div style={{ backgroundColor: "#a1b1cc", padding: "5px" }}>
                    {sizeKey.toUpperCase()}{" "}
                  </div>
                  <div style={{ backgroundColor: "#b8c7e0", padding: "5px" }}>
                    {val.inOrder}
                  </div>
                  <div style={{ backgroundColor: "#b8c7e0", padding: "5px" }}>
                    {val.pulled}
                  </div>
                  <div style={{ backgroundColor: "#b8c7e0", padding: "5px" }}>
                    {val.quantity - val.reserved || 0}
                  </div>
                  <div style={{ backgroundColor: "#b8c7e0", padding: "5px" }}>
                    <input
                      className={styles.input}
                      style={{
                        maxWidth: "60px",
                        color:
                          val.newQuantity < val.pulled ? "#c4867e" : "black",
                      }}
                      value={val.newQuantity}
                      onChange={(e) => changeInput(e, index, sizeKey)}
                      onBlur={(e) => validate(e, val, index)}
                      disabled={saveVersion > 1}
                    />
                  </div>
                </div>
              ))}
            </div>
            <FaTrash
              style={{ color: "red", margin: "20px", cursor: "pointer" }}
              onClick={() => setItemQuantities(index)}
              title="Remove entire group"
            />
          </div>
        </>
      ))}
      {displaced.length > 0 && saveVersion > 1 && (
        <>
          <h2 style={{ marginBottom: "10px" }}>Displaced</h2>
          <div style={{ display: "flex", flexDirection: "row", gap: "40px" }}>
            <div style={{ flexGrow: "1" }} className={styles.displacedItems}>
              {displaced.map((item, index) => (
                <div
                  className={styles.displacedRow}
                  style={{
                    backgroundColor: item.selected ? "rgb(193, 193, 193)" : "",
                  }}
                  onClick={() => changeSelected(index)}
                >
                  <div className={styles.itemDetails}>
                    <div
                      className={styles.imageContainer}
                      style={{ minWidth: "50px" }}
                    >
                      <img src={item.image} className={styles.rowImage} />
                    </div>
                    {item.style} {item.color}{" "}
                    {sizeDict[item.sizeId]?.size || item.size || "No Size"}{" "}
                    {brandDict[item.brandId]?.brand || item.brand || "No Brand"}{" "}
                    {descriptionDict[item.descriptionId]?.description ||
                      item.description ||
                      "No Brand"}
                  </div>
                  <div>
                    {item.quantity} {item.quantity > 1 ? "items" : "item"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ width: "20%", display: "block" }}>
              <h3 style={{ marginBottom: "10px" }}>Boxes</h3>
              <div className={styles.boxContainer}>
                <div
                  onClick={() => {
                    selectedBox?._id == `Box-${newBoxVersion}`
                      ? setSelectedBox(null)
                      : setSelectedBox({ _id: `Box-${newBoxVersion}` });
                  }}
                  style={{
                    backgroundColor:
                      selectedBox?._id == `Box-${newBoxVersion}`
                        ? "rgb(193, 193, 193)"
                        : "",
                  }}
                >
                  New Box
                </div>
                {filteredBoxes.map((box) => (
                  <div
                    onClick={() => {
                      selectedBox?._id == box._id
                        ? setSelectedBox(null)
                        : setSelectedBox(box);
                    }}
                    style={{
                      backgroundColor:
                        selectedBox?._id == box._id ? "rgb(193, 193, 193)" : "",
                    }}
                  >
                    {box.boxId}
                  </div>
                ))}
              </div>
              <div style={{ width: "100%", display: "flex" }}>
                <button
                  onClick={saveToBox}
                  className={styles.saveBox}
                  disabled={
                    !selectedBox || !displaced.find((dis) => dis.selected)
                  }
                >
                  Save to Box
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {saveVersion > 1 ? (
        <div style={{ width: "100%", display: "flex" }}>
          <button
            className={styles.save}
            onClick={(e) => handleSubmit(e)}
            disabled={displaced.length > 0 || submitting}
          >
            {submitting ? <BeatLoader size={10}/> : "Save"}
          </button>
        </div>
      ) : (
        <div style={{ width: "100%", display: "flex" }}>
          <button
            className={styles.save}
            onClick={() => setSaveVersion(saveVersion + 1)}
          >
            Confirm Changes
          </button>
        </div>
      )}

      {addBoxVisible && (
        <AddBox
          onClose={() => setAddBoxVisible(false)}
          refresh={getReservation}
          options={options}
          savedInfo={{
            addBox: { contents: displaced.filter((d) => d.selected) },
          }}
          appendToBox={appendToBox}
        />
      )}
    </div>
  );
}
