import styles from "./reserve.module.css";
import { useState, useEffect } from "react";
import { FaCheckCircle, FaRegTrashAlt, FaTrash } from "react-icons/fa";
import { TbShoppingCartCancel } from "react-icons/tb"
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { IoIosCheckmarkCircle } from "react-icons/io";


export default function Cart({
  onClose,
  brandDict,
  descriptionDict,
  sizeDict,
  fullInventory,
  refresh,
}) {

  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [groupedCart, setGroupedCart] = useState({});
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [orderTitle, setOrderTitle] = useState("");
  const [soin, setSoIn] = useState("");

  const [selectionType, setSelectionType] = useState("manual");

  const [boxOptions, setBoxOptions] = useState({});
  const [optionsIndex, setOptionsIndex] = useState(null);

  const [currentStatus, setCurrentStatus] = useState([])

  const { user } = useUser();

  const [manualSelections, setManualSelections] = useState({})
  
  const [bestIndexes, setBestIndexes] = useState([])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const getCartFromStorage = () => {
    try {
      const cartData = localStorage.getItem("cart");
      if (!cartData) return [];
      const parsed = JSON.parse(cartData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Invalid cart data in localStorage, resetting cart:", error);
      localStorage.removeItem("cart");
      return [];
    }
  };

  // Safe function to save cart to localStorage
  const saveCartToStorage = (cart) => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  };

  useEffect(() => {
    setCart(getCartFromStorage());
  }, []);


  // Remove all items that match the group (style, brand, description, color)
  const removeGroupFromCart = (groupKey) => {
    const updatedCart = cart.filter((item) => {
      const itemKey = `${item.color}, ${item.brand}, ${item.description}, ${item.style}`;
      return itemKey !== groupKey;
    });

    saveCartToStorage(updatedCart);
    setCart(updatedCart);
  };

  // Calculate the total quantity that will be taken from selected boxes for a given cart item
  const calculateSelectedQuantity = (cartItemIndex) => {
    const cartItem = cart[cartItemIndex];
    if (!cartItem) return 0;

    const itemBoxOptions = boxOptions[cartItemIndex];
    if (!itemBoxOptions) return 0;

    const selectedBoxes = itemBoxOptions.filter(box => manualSelections[`${cartItemIndex}-${box._id}`]);

    selectedBoxes.sort((a, b) => a.boxSequentialId - b.boxSequentialId);

    let totalSelected = 0;
    let remainingNeeded = cartItem.quantity;

    for (const box of selectedBoxes) {
      const availableInBox = box.quantity - (box.reserved || 0);
      const toTakeFromBox = Math.min(availableInBox, remainingNeeded);

      totalSelected += toTakeFromBox;
      remainingNeeded -= toTakeFromBox;

      if (remainingNeeded <= 0) break;
    }

    return Math.min(totalSelected, cartItem.quantity);
  };

  useEffect(() => {
    let arr = [];
    for (let i = 0; i < cart.length; i++) {
      if (selectionType === "manual") {
        arr.push(calculateSelectedQuantity(i));
      } else {
        arr.push(0);
      }
    }
    setCurrentStatus(arr);
  }, [cart, manualSelections, boxOptions, selectionType]);


  useEffect(() => {
    const cartGrouped = {};
    for (const item of cart) {
      let key = `${item.color}, ${item.brand}, ${item.description}, ${item.style}`;
      if (!cartGrouped[key]) {
        cartGrouped[key] = {
          image: item.image,
          color: item.color,
          brand: item.brand,
          price: item.price,
          description: item.description,
          style: item.style,
          sizes: {},
        };
        cartGrouped[key]["sizes"][item.size] = {
          quantity: item.quantity,
          price: item.price,
        };
      } else if (!cartGrouped[key]["sizes"][item.size]) {
        cartGrouped[key]["sizes"][item.size] = {
          quantity: item.quantity,
          price: item.price,
        };
      } else {
        cartGrouped[key]["sizes"][item.size]["quantity"] += item.quantity;
      }
    }
    setGroupedCart(cartGrouped);
  }, [cart]);

  //Get total
  useEffect(() => {
    setTotal(
      Object.values(groupedCart)
        ?.reduce(
          (prev, cur) =>
            prev +
            Object.values(cur.sizes).reduce((pr, c) => {
              return pr + parseInt(c.price) * c.quantity;
            }, 0),
          0
        )
        .toFixed(2)
    );
  }, [groupedCart]);

  const getMatching = async (style, color, brand, size, cartItemIndex, quantity) => {
    try {
      const matching = await fetch(`/api/catalog?style=${style}&color=${color}&brand=${brand}&size=${size}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },

      });

      if (!matching.ok) {
        const errorData = await matching.json();
        throw new Error(errorData.error || `HTTP ${matching.status}`);
      }

      const data = await matching.json()
     

      setBoxOptions(prev => ({
        ...prev,
        [cartItemIndex]: data
      }));
      console.log(data);
      return;


    } catch (finalizeError) {
      console.error("Error finalizing reservation:", finalizeError);
      alert("Items were reserved but failed to create final reservation");
    }

  }

 function findBestCombination(arr, target) {
  let bestResult = null;
  let bestScore = -Infinity;

  function calculateScore(combination) {
    const { indexes, sum, boxCount } = combination;
    
    // Calculate how much we're taking from each box
    const takeAmounts = indexes.map(i => Math.min(arr[i], target));
    const totalTaking = takeAmounts.reduce((sum, amt) => sum + amt, 0);
    
    // Count how many boxes we're completely emptying
    const completelyEmptiedBoxes = takeAmounts.filter((take, idx) => 
      take === arr[indexes[idx]]
    ).length;
    
    // Prioritization scoring:
    // 1. Exact match gets huge bonus
    const exactMatchBonus = (sum === target) ? 1000 : 0;
    
    // 2. Prefer combinations that empty more boxes completely
    const emptyBoxBonus = completelyEmptiedBoxes * 100;
    
    // 3. Prefer fewer total boxes used
    const fewBoxesBonus = -boxCount * 10;
    
    // 4. Minimize waste (overfill penalty)
    const wastePenalty = sum > target ? -(sum - target) * 5 : 0;
    
    // 5. If no exact match possible, prefer getting closer to target
    const proximityBonus = exactMatchBonus === 0 ? -Math.abs(sum - target) : 0;
    
    return exactMatchBonus + emptyBoxBonus + fewBoxesBonus + wastePenalty + proximityBonus;
  }

  function backtrack(index, currentSum, currentIndexes) {
    // Check if current combination is valid and potentially better
    if (currentSum >= target || index === arr.length) {
      if (currentIndexes.length > 0) {
        const combination = {
          indexes: [...currentIndexes],
          values: currentIndexes.map(i => arr[i]),
          sum: currentSum,
          waste: Math.max(0, currentSum - target),
          boxCount: currentIndexes.length,
          completelyEmptied: currentIndexes.filter(i => arr[i] <= target - (currentSum - arr[i])).length
        };
        
        const score = calculateScore(combination);
        
        if (score > bestScore) {
          bestResult = combination;
          bestScore = score;
        }
      }
      
      if (currentSum >= target) return; // Stop exploring this path if we've reached/exceeded target
    }

    // Continue exploring
    for (let i = index; i < arr.length; i++) {
      if (arr[i] > 0 && currentSum + arr[i] <= target * 2) { // Don't go too far over
        currentIndexes.push(i);
        backtrack(i + 1, currentSum + arr[i], currentIndexes);
        currentIndexes.pop();
      }
    }
  }

  backtrack(0, 0, []);
  
  if (bestResult) {
    // Add detailed info about what's being taken from each box
    bestResult.takeDetails = bestResult.indexes.map(i => ({
      boxIndex: i,
      available: arr[i],
      taking: Math.min(arr[i], target),
      remaining: arr[i] - Math.min(arr[i], target),
      completelyEmptied: Math.min(arr[i], target) === arr[i]
    }));
  }
  
  return bestResult || {
    indexes: [],
    values: [],
    sum: 0,
    waste: Infinity,
    boxCount: 0,
    message: 'No valid combination found'
  };
}


  const onItemClick = async (cartItem, index) => {
    setOptionsIndex(index)
    await getMatching(cartItem.style, cartItem.color, cartItem.brand, cartItem.size, index, cartItem.quantity)
  }

  useEffect(() => {
    if(!boxOptions || !boxOptions[optionsIndex]) return

    const numArr = boxOptions ? boxOptions[optionsIndex]?.map(item => item.quantity - (item.reserved || 0)) : []
    const bestCombination = findBestCombination(numArr, cart[optionsIndex].quantity)
    
    setBestIndexes(bestCombination.indexes)
    return;

  }, [boxOptions])

  const reserveCart = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const reservationResults = [];
    const failedReservations = [];

    try {
      // Process all cart items first
      if (selectionType === "auto") {
        for (const item of cart) {
          try {
            const reservation = await uploadReserveAuto(item);
            if (reservation.ok) {
              const data = await reservation.json();
              reservationResults.push({
                item: item,
                success: true,
                data: data,
              });
            } else {
              const errorData = await reservation.json();
              failedReservations.push({
                item: item,
                error: errorData.error || `HTTP ${reservation.status}`,
              });
            }
          } catch (itemError) {
            console.error("Error processing item:", item, itemError);
            failedReservations.push({
              item: item,
              error: itemError.message,
            });
          }
        }
      }
      else if (selectionType === "manual") {
        for (const [cartItemIndex, boxList] of Object.entries(boxOptions)) {
          for (const box of boxList) {
            const selectionKey = `${cartItemIndex}-${box._id}`;

            // Only process selected boxes
            if (manualSelections[selectionKey]) {
              const quantityFromBox = getQuantityFromBox(box, parseInt(cartItemIndex));

              if (quantityFromBox > 0) {
                try {
                  const reservation = await uploadReserveManual(box._id, quantityFromBox);
                  if (reservation.ok) {
                    const data = await reservation.json();
                    reservationResults.push({
                      item: box,
                      success: true,
                      data: data,
                    });
                  } else {
                    const errorData = await reservation.json();
                    failedReservations.push({
                      item: box,
                      error: errorData.error || `HTTP ${reservation.status}`,
                    });
                  }
                } catch (itemError) {
                  console.error("Error processing box:", box, itemError);
                  failedReservations.push({
                    item: box,
                    error: itemError.message,
                  });
                }
              }
            }
          }
        }
      }
      else {
        throw Error("Invalid selection type")
      }


      // Check if there were any failures
      if (failedReservations.length > 0) {
        console.error("Failed reservations:", failedReservations);

        // Show user-friendly error message
        const errorMessages = failedReservations.map(failure =>
          `${failure.item.style} (${failure.item.color}): ${failure.error}`
        ).join('\n');

        alert(`Cannot complete reservation due to the following errors:\n\n${errorMessages}`);

        setSubmitting(false);
        return; // Exit early - don't create reservation
      }

      // Only proceed if all items were successfully reserved
      console.log("All items successfully reserved:", reservationResults);

      let items = [];
      for (const res of reservationResults) {
        for (const item of res.data.reservationDetails) {
          items.push({
            itemId: item.itemId,
            image: item.image,
            color: item.color,
            style: item.style,
            brand: brandDict[item.brand.toString()]?.brand || item.brand || "No Brand",
            size: sizeDict[item.size.toString()]?.size || item.size || "No Size",
            description: descriptionDict[item.description?.toString()]?.description || item.description || "No Description",
            location: item.location,
            boxId: item.boxId || "N/A",
            quantReserved: item.quantityReservedFromThisItem,
          });
        }
      }

      console.log("Items for final reservation:", items);

      try {
        const completeReservation = await fetch("/api/catalog/reservation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderTitle: orderTitle.trim(),
            soIn: soin.trim(),
            items: items,
            status: "Incomplete",
            internal: true,
            customer: user.fullName,
          }),
        });

        if (!completeReservation.ok) {
          const errorData = await completeReservation.json();
          throw new Error(errorData.error || `HTTP ${completeReservation.status}`);
        }

        const data = await completeReservation.json()

        // Success! Clear cart and close
        setCart([]);
        setGroupedCart({});
        refresh();
        saveCartToStorage([]);
        onClose();
        router.push(`/admin/reservations?id=${data.data._id}`)



      } catch (finalizeError) {
        console.error("Error finalizing reservation:", finalizeError);
        alert("Items were reserved but failed to create final reservation");
      }

    } catch (error) {
      console.error("Cart reservation error:", error);
      alert("An error occurred while reserving items. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  const uploadReserveAuto = async (item) => {
    // Validate required fields
    if (
      !item.style ||
      !item.color ||
      (!item.brand && !item.size) ||
      !item.quantity
    ) {
      throw new Error("Missing required item fields");
    }

    if (item.quantity <= 0) {
      throw new Error("Invalid quantity");
    }

    try {
      const result = await fetch("/api/catalog", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          style: item.style,
          color: item.color,
          brand: item.brand,
          size: item.size,
          quantityToReserve: item.quantity,
        }),
      });

      return result;
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      alert("Insufficient inventory: please reload")
      throw new Error(`Network error: ${fetchError.message}`);
    }
  };

  const uploadReserveManual = async (id, quantityToReserve) => {
    // Validate required fields
    if (!id || !quantityToReserve) {
      throw new Error("Missing required fields: boxId and quantityToReserve");
    }

    if (quantityToReserve <= 0) {
      throw new Error("Invalid quantity");
    }

    try {
      const result = await fetch("/api/catalog/manual", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryId: id,
          quantityToReserve: quantityToReserve,
        }),
      });

      return result;
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      alert("Insufficient inventory: please reload");
      throw new Error(`Network error: ${fetchError.message}`);
    }
  };

  const handleBoxSelection = (item, cartItemIndex) => {
    const selectionKey = `${cartItemIndex}-${item._id}`;

    setManualSelections(prev => {
      if (prev[selectionKey]) {
        // Removing selection
        const { [selectionKey]: removed, ...rest } = prev;
        return rest;
      } else {
        // Adding selection
        return {
          ...prev,
          [selectionKey]: true
        };
      }
    });
  }

  // Helper function to get the quantity that would be taken from a specific box
  const getQuantityFromBox = (box, cartItemIndex) => {
    const cartItem = cart[cartItemIndex];
    if (!cartItem) return 0;

    const selectionKey = `${cartItemIndex}-${box._id}`;
    if (!manualSelections[selectionKey]) return 0;

    // Get box options for this specific cart item
    const itemBoxOptions = boxOptions[cartItemIndex];
    if (!itemBoxOptions) return 0;

    // Get all selected boxes for this cart item and sort them consistently
    const selectedBoxes = itemBoxOptions.filter(b => manualSelections[`${cartItemIndex}-${b._id}`]);
    selectedBoxes.sort((a, b) => a.boxSequentialId - b.boxSequentialId);

    let remainingNeeded = cartItem.quantity;

    for (const selectedBox of selectedBoxes) {
      const availableInBox = selectedBox.quantity - (selectedBox.reserved || 0);
      const toTakeFromBox = Math.min(availableInBox, remainingNeeded);

      if (selectedBox._id === box._id) {
        return toTakeFromBox;
      }

      remainingNeeded -= toTakeFromBox;
      if (remainingNeeded <= 0) break;
    }

    return 0;
  };

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
        {Object.entries(groupedCart).length > 0 ?
          <>
            {Object.entries(groupedCart).map(([groupKey, item], index) => (
              <div key={index} className={styles.cartRow} onClick={() => console.log(item)}>
                <div className={styles.imageContainer} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={item.image} className={styles.rowImage}></img>
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
                    <div style={{ padding: "5px" }}>Quantity</div>
                    <div style={{ padding: "5px" }}>Price</div>
                  </div>
                  {Object.entries(item.sizes).map(([sizeKey, val]) => (
                    <div key={sizeKey} className={styles.column}>
                      <div style={{ backgroundColor: "#a1b1cc", padding: "5px" }}>
                        {sizeKey}{" "}
                      </div>
                      <div style={{ backgroundColor: "#b8c7e0", padding: "5px" }}>
                        {val.quantity}
                      </div>
                      <div style={{ backgroundColor: "#c8d3e6", padding: "5px" }}>
                        ${val.price}
                      </div>
                    </div>
                  ))}
                  <div
                    className={styles.column}
                    style={{ fontWeight: "bold", textAlign: "right" }}
                  >
                    <div style={{ padding: "5px", fontWeight: "bold" }}>Total</div>
                    <div style={{ padding: "5px" }}>
                      {Object.values(item.sizes).reduce((prev, cur) => {
                        return prev + cur.quantity;
                      }, 0)}
                    </div>
                    <div style={{ padding: "5px" }}>
                      $
                      {Object.values(item.sizes)
                        .reduce((prev, cur) => {
                          return prev + parseInt(cur.price) * cur.quantity;
                        }, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                </div>
                <FaTrash
                  style={{ color: "red", margin: "20px", cursor: "pointer" }}
                  onClick={() => removeGroupFromCart(groupKey)}
                  title="Remove entire group"
                />
              </div>
            ))}
            <div style={{
              width: "100%",
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
              gap: "10px",
              margin: "10px 0"
            }}>

              <input type="radio" id="auto" value="auto" checked={selectionType === "auto"} onClick={() => setSelectionType("auto")} />
              <label for="auto">Auto Selection</label><br />

              <input type="radio" id="manual" value="manual" checked={selectionType === "manual"} onClick={() => { setSelectionType("manual"); console.log(cart) }} />
              <label for="manual">Manual Selection</label><br />

            </div>
            {
              selectionType == "manual" &&
              <div>
                {
                  cart.map((cartItem, index) => (
                    <>
                      <div key={index} className={styles.manualSelection} onClick={() => onItemClick(cartItem, index)}>
                        <div className={styles.imageContainer} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          <img src={cartItem.image} className={styles.rowImage}></img>
                        </div>
                        {cartItem.brand} {cartItem.style} {cartItem.description} {cartItem.size}
                        <div style={{ marginLeft: "auto", fontSize: "32px", marginRight: "10px", color: (currentStatus[index] || 0) >= cartItem.quantity ? "green" : "black" }}>{currentStatus[index] || 0} / {cartItem.quantity}</div>
                      </div>
                      <div className={`${styles.boxGrid} ${optionsIndex === index && boxOptions[index] ? styles.visible : styles.notVisible}`}>
                        {
                          boxOptions[index] && boxOptions[index].map((box, i) => {
                            const quantityFromThisBox = getQuantityFromBox(box, index);
                            const availableQuantity = box.quantity - (box.reserved || 0);
                            const selectionKey = `${index}-${box._id}`;

                            return (
                              <div key={i} onClick={() => handleBoxSelection(box, index)} className={manualSelections[selectionKey] ? styles.selected : ""} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <h3>#{box.boxSequentialId}</h3>
                                <div>Available: <span style={{textDecoration: manualSelections[selectionKey] ? "line-through" : ""}}>{availableQuantity}
                                  </span>
                                 {manualSelections[selectionKey] ? `  ${parseInt(availableQuantity) - parseInt(quantityFromThisBox)}` : ""}

                                  </div>
                                {manualSelections[selectionKey] && (
                                  <div style={{ color: "green", fontWeight: "bold" }}>
                                    Taking: {quantityFromThisBox}
                                  </div>
                                )}
                                <IoIosCheckmarkCircle style={{ position: "absolute", right: "5px", bottom: "5px", display: manualSelections[selectionKey] ? "" : "none", color: "green" }} size={20} />
                                <span className={styles.recommended} style={{display: bestIndexes.includes(i) ? "" : "none"}}/>
                              </div>
                            );
                          })
                        }
                      </div>
                    </>
                  ))
                }

              </div>
            }
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "0",
                gap: "10px",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: "bold",
                    justifyContent: "space-between"
                  }}
                >
                  Order Title: <input className={styles.input} value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: "bold",
                    justifyContent: "space-between"
                  }}
                >
                  SO#/IN#: <input className={styles.input} value={soin} onChange={(e) => setSoIn(e.target.value)} />
                </div>
              </div>
              <button
                className={styles.shoppingButton}
                style={{ height: "fit-content" }}
                onClick={(e) => reserveCart(e)}
                disabled={selectionType == "manual" && !cart.every((item, index) => item.quantity <= currentStatus[index])}
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    Reserve
                    <FaCheckCircle />
                  </>
                )}
              </button>
            </div>
          </>
          :
          <div style={{ fontWeight: "bold", fontSize: "30px", fontStyle: "italic", color: "#d6d6d6", display: "flex", flexDirection: "column", alignItems: "center" }}>
            Cart empty
            <TbShoppingCartCancel size={40} />
          </div>
        }
      </div>
    </div>
  );
}