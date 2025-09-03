import styles from "./reserve.module.css";
import { useState, useEffect } from "react";
import { FaCheckCircle, FaRegTrashAlt, FaTrash } from "react-icons/fa";
import {TbShoppingCartCancel} from "react-icons/tb"
import { useUser } from "@clerk/nextjs";

export default function Cart({
  onClose,
  brandDict,
  descriptionDict,
  refresh,
  cart,
  setCart
}) {
  const [groupedCart, setGroupedCart] = useState({});
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [orderTitle, setOrderTitle] = useState("");
  const [soin, setSoIn] = useState("")

  const { user } = useUser();

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  useEffect(() => {console.log("cart", cart)}, [cart])

  // Remove all items that match the group (style, brand, description, color)
  const removeGroupFromCart = (groupKey) => {
    const updatedCart = cart.filter((item) => {
      const itemKey = `${item.color}, ${item.brand}, ${item.description}, ${item.style}`;
      return itemKey !== groupKey;
    });

    saveCartToStorage(updatedCart);
    setCart(updatedCart);
  };

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

  const reserveCart = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const reservationResults = [];
    const failedReservations = [];

    try {
      // Process all cart items
      for (const item of cart) {
        try {
          const reservation = await uploadReserve(item);

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
      console.log(reservationResults);
      let items = [];
      for (const res of reservationResults) {
        for (const item of res.data.reservationDetails) {
          items.push({
            itemId: item.itemId,
            quantReserved: item.quantityReservedFromThisItem,
          });
        }
      }
      console.log(items);
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
      } catch {
        console.error("Error finalizing reservation:", item, itemError);
      }

      setSubmitting(false);
      setCart([]);
      setGroupedCart({});
      refresh();
      saveCartToStorage([]);
      onClose();
    } catch (error) {
      console.error("Cart reservation error:", error);
      alert("An error occurred while reserving items. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadReserve = async (item) => {
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
      throw new Error(`Network error: ${fetchError.message}`);
    }
  };

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
      {Object.entries(groupedCart).length > 0 ?
      <>
        {Object.entries(groupedCart).map(([groupKey, item], index) => (
          <div key={index} className={styles.cartRow}>
            <div className={styles.imageContainer}>
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
                gap:"5px",
                fontWeight:"bold",
                justifyContent:"space-between"
              }}
            >
              Order Title: <input className={styles.input} value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)}/>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap:"5px",
                fontWeight:"bold",
                justifyContent:"space-between"
              }}
            >
              SO#/IN#: <input className={styles.input} value={soin} onChange={(e) => setSoIn(e.target.value)}/>
            </div>
          </div>
          <div
            className={styles.shoppingButton}
            style={{ height: "fit-content" }}
            onClick={(e) => reserveCart(e)}
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                Reserve
                <FaCheckCircle />
              </>
            )}
          </div>
        </div>
        </>
        :
        <div style={{fontWeight:"bold", fontSize:"30px", fontStyle:"italic", color:"#d6d6d6", display:"flex", flexDirection:"column", alignItems:"center"}}>
          Cart empty
          <TbShoppingCartCancel size={40}/>
        </div>
        }
      </div>
    </div>
  );
}
