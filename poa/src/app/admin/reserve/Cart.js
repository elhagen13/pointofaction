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

  const [boxOptions, setBoxOptions] = useState({});
  const [optionsIndex, setOptionsIndex] = useState(0);

  const [currentStatus, setCurrentStatus] = useState([])

  const { user } = useUser();

  const [manualSelections, setManualSelections] = useState({})

  const [recommendedIndexes, setRecommendedIndexes] = useState({})

  const [quantityCalculations, setQuantityCalculations] = useState({});

  const [selectionOrder, setSelectionOrder] = useState({});

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

  const calculateQuantityDistribution = (cartItemIndex, orderedBoxIds, recalculate = false) => {
    const cartItem = cart[cartItemIndex];
    if (!cartItem) return { totalSelected: 0, distribution: {} };

    const itemBoxOptions = boxOptions[cartItemIndex];
    if (!itemBoxOptions) return { totalSelected: 0, distribution: {} };

    // Check if we have existing calculations and selection order
    const existingCalc = quantityCalculations[cartItemIndex];
    const currentOrder = selectionOrder[cartItemIndex] || [];

    // Only use orderedBoxIds if they match our current selection order
    const validOrderedBoxIds = orderedBoxIds.filter(id => currentOrder.includes(id));
    const finalOrderedBoxIds = validOrderedBoxIds.length > 0 ?
      validOrderedBoxIds :
      currentOrder.filter(id => orderedBoxIds.includes(id));

    if (!recalculate && existingCalc &&
      JSON.stringify(existingCalc.orderedBoxIds) === JSON.stringify(finalOrderedBoxIds)) {
      return existingCalc;
    }

    const orderedBoxes = finalOrderedBoxIds.map(boxId =>
      itemBoxOptions.find(box => box._id === boxId)
    ).filter(Boolean);

    let remainingNeeded = cartItem.quantity;
    const distribution = {};
    let totalSelected = 0;

    for (const box of orderedBoxes) {
      const availableInBox = box.quantity - (box.reserved || 0);

      if (remainingNeeded <= 0) {
        distribution[box._id] = 0;
      } else {
        const toTakeFromBox = Math.min(availableInBox, remainingNeeded);
        distribution[box._id] = toTakeFromBox;
        totalSelected += toTakeFromBox;
        remainingNeeded -= toTakeFromBox;
      }
    }

    const result = {
      totalSelected: Math.min(totalSelected, cartItem.quantity),
      distribution,
      orderedBoxIds: finalOrderedBoxIds
    };

    return result;
  };

  const calculateSelectedQuantity = (cartItemIndex) => {
    const cartItem = cart[cartItemIndex];
    if (!cartItem) return 0;

    const itemBoxOptions = boxOptions[cartItemIndex];
    if (!itemBoxOptions) return 0;

    const orderedBoxIds = selectionOrder[cartItemIndex] || [];

    if (orderedBoxIds.length === 0) return 0;

    const calculation = calculateQuantityDistribution(cartItemIndex, orderedBoxIds);

    // Update the stored calculation
    setQuantityCalculations(prev => ({
      ...prev,
      [cartItemIndex]: calculation
    }));

    return calculation.totalSelected;
  };

  useEffect(() => {
    let arr = [];
    for (let i = 0; i < cart.length; i++) {
      const quantity = calculateSelectedQuantity(i)
      arr.push(quantity);
      console.log(quantity, "CART", cart[i])
      if(i === optionsIndex && quantity >= cart[i].quantity){
        console.log(quantity)
        setOptionsIndex(optionsIndex + 1)
      }

    }
    setCurrentStatus(arr);
  }, [cart, manualSelections, boxOptions]);


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

      return data;


    } catch (finalizeError) {
      console.error("Error finalizing reservation:", finalizeError);
      return null;
    }

  }

  function findBestCombination(arr, target) {
    let bestResult = null;
    let bestScore = -Infinity;

    function calculateScore(combination) {
      const { indexes, sum, boxCount } = combination;

      if (sum < target) return -Infinity
      // Calculate how much we're ACTUALLY taking from each box sequentially
      let remaining = target;
      const takeAmounts = indexes.map(i => {
        const take = Math.min(arr[i], remaining);
        remaining -= take;
        return take;
      });

      // Count how many boxes we're completely emptying
      const completelyEmptiedBoxes = takeAmounts.filter((take, idx) =>
        take === arr[indexes[idx]]
      ).length;

      // Rest of your scoring logic...
      const exactMatchBonus = (sum === target) ? 1000 : 0;
      const emptyBoxBonus = completelyEmptiedBoxes * 100;
      const fewBoxesBonus = -boxCount * 10;
      const wastePenalty = sum > target ? -(sum - target) * 5 : 0;
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

  // Fetch all box options on cart load and calculate recommendations
  useEffect(() => {
    const fetchAllMatches = async () => {
      const newRecommendations = {};

      for (let index = 0; index < cart.length; index++) {
        const cartItem = cart[index];
        const data = await getMatching(
          cartItem.style,
          cartItem.color,
          cartItem.brand,
          cartItem.size,
          index,
          cartItem.quantity
        );

        // Calculate recommendations immediately after fetching
        if (data && data.length > 0) {
          const numArr = data.map(item => item.quantity - (item.reserved || 0));
          const bestCombination = findBestCombination(numArr, cartItem.quantity);
          newRecommendations[index] = bestCombination.indexes;
        }
      }

      setRecommendedIndexes(newRecommendations);
    };

    if (cart.length > 0) {
      fetchAllMatches();
    }
  }, [cart]);

  const reserveCart = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const reservationResults = [];
    const failedReservations = [];

    try {
      // Process all cart items first

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




      // Check if there were any failures
      if (failedReservations.length > 0) {
        console.error("Failed reservations:", failedReservations);

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

        const formData = new FormData();
        formData.append('formType', 'product-reservation');
        formData.append('customer', user.fullName);
        formData.append('email', user.primaryEmailAddress)
        formData.append('reservation', data.data.sequentialId);
        formData.append('orderTitle', orderTitle);
        formData.append('soIn', soin);
        formData.append('reservationQuantity', Object.values(cart).reduce((a, b) => a + b.quantity, 0))
        formData.append('link', `www.pointofaction.com/admin/reservations?id=${data.data._id}`)

        console.log()
        // Send form data to API
        const emailResponse = await fetch('/api/resend', {
          method: 'POST',
          body: formData,
        });

        if (!emailResponse.ok) throw Error

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
    const wasSelected = manualSelections[selectionKey];
    console.log("ITEM", item, "CARTINDEX", cartItemIndex)

    setManualSelections(prev => {
      const newSelections = { ...prev };
      const currentOrder = selectionOrder[cartItemIndex] || [];
      console.log(newSelections)

      if (wasSelected) {
        // Deselecting
        delete newSelections[selectionKey];

        const isMostRecent = currentOrder[currentOrder.length - 1] === item._id;

        const newOrder = currentOrder.filter(id => id !== item._id);
        setSelectionOrder(prev => ({
          ...prev,
          [cartItemIndex]: newOrder
        }));

        if (!isMostRecent) {
          // Recalculate because we're removing a box that's not the most recently selected
          const calculation = calculateQuantityDistribution(cartItemIndex, newOrder, true);
          setQuantityCalculations(prev => ({
            ...prev,
            [cartItemIndex]: calculation
          }));
        }

      } else {
        // Selecting
        newSelections[selectionKey] = true;

        const newOrder = [...currentOrder, item._id];
        setSelectionOrder(prev => ({
          ...prev,
          [cartItemIndex]: newOrder
        }));

        // Recalculate for new selection
        const calculation = calculateQuantityDistribution(cartItemIndex, newOrder, true);
        setQuantityCalculations(prev => ({
          ...prev,
          [cartItemIndex]: calculation
        }));
      }

      return newSelections;
    });
  };


  const getQuantityFromBox = (box, cartItemIndex) => {
    const calculation = quantityCalculations[cartItemIndex];
    if (!calculation || !calculation.distribution) return 0;

    return calculation.distribution[box._id] || 0;
  };


  const selectRecommended = () => {
    const newSelections = {};
    const newSelectionOrder = {};
    const newQuantityCalculations = {};

    cart.forEach((_, cartIndex) => {
      if (boxOptions[cartIndex] && recommendedIndexes[cartIndex]) {
        const orderedBoxIds = [];

        recommendedIndexes[cartIndex].forEach((boxIndex) => {
          const box = boxOptions[cartIndex][boxIndex];
          if (box) {
            const selectionKey = `${cartIndex}-${box._id}`;
            newSelections[selectionKey] = true;
            orderedBoxIds.push(box._id);
          }
        });

        newSelectionOrder[cartIndex] = orderedBoxIds;

        // Calculate quantities for this cart item
        const calculation = calculateQuantityDistribution(cartIndex, orderedBoxIds, true);
        newQuantityCalculations[cartIndex] = calculation;
      }
    });

    // Update all state at once
    setManualSelections(newSelections);
    setSelectionOrder(newSelectionOrder);
    setQuantityCalculations(newQuantityCalculations);
  };

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
        {Object.entries(groupedCart).length > 0 ?
          <>
            {Object.entries(groupedCart).map(([groupKey, item], index) => (
              <div key={index} className={styles.cartRow}>
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
            <div className={styles.autoSelectContainer}>
              <button className={styles.autoSelect} onClick={selectRecommended} disabled={Object.entries(recommendedIndexes).length < 1}>Select Recommended</button>
            </div>

            <div>
              {
                cart.map((cartItem, index) => (
                  <>
                    <div key={index} className={styles.manualSelection} onClick={() => setOptionsIndex(index)}>
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
                          const isRecommended = recommendedIndexes[index]?.includes(i);

                          return (
                            <div key={i} onClick={() => handleBoxSelection(box, index)}
                              className={manualSelections[selectionKey] ? styles.selected : isRecommended ? styles.recommended : ""}
                              style={{ position: "relative", display: "flex", flexDirection: "column", gap: "10px" }}>
                              <h3>#{box.boxSequentialId}</h3>
                              <div>Available: <span style={{ textDecoration: manualSelections[selectionKey] ? "line-through" : "" }}>{availableQuantity}
                              </span>
                                {manualSelections[selectionKey] ? `  ${parseInt(availableQuantity) - parseInt(quantityFromThisBox)}` : ""}

                              </div>
                              {manualSelections[selectionKey] && (
                                <div style={{ color: "green", fontWeight: "bold" }}>
                                  Taking: {quantityFromThisBox}
                                </div>
                              )}
                              <IoIosCheckmarkCircle style={{ position: "absolute", right: "5px", bottom: "5px", display: manualSelections[selectionKey] ? "" : "none", color: "green" }} size={20} />
                            </div>
                          );
                        })
                      }
                    </div>
                  </>
                ))
              }

            </div>

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
                disabled={!cart.every((item, index) => item.quantity <= currentStatus[index])}
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