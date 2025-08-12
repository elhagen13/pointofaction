import styles from "./reserve.module.css";
import { useState, useEffect } from "react";
import { FiShoppingBag } from "react-icons/fi";

export default function Cart({
  onClose,
  sizeDict,
  brandDict,
  descriptionDict,
  filteredInventory
}) {
  const [cart, setCart] = useState([]);
  const [imageDict, setImageDict] = useState({})
  
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
    setCart(getCartFromStorage())
    filteredInventory.forEach(() => {

    })
  }, [])

  useEffect(() => {
    const cartWithImages = [];
    cart.forEach((item) => {

    })
  }, [cart])

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
        <table>
        <tr className={styles.tableRow}>
            <th>Item</th>
            <th>Style</th>
            <th>Brand</th>
            <th>Color</th>
            <th>Size</th>
            <th>Quantity</th>
            <th></th>
        </tr>
        {cart.map((cartItem) => (
            <tr className={styles.tableRow}>
                <td></td>
                <td>{cartItem.style}</td>
                <td>{brandDict[cartItem.brand]?.brand || cartItem.brand}</td>
                <td>{cartItem.color}</td>
                <td>{cartItem.size}</td>
                <td>{cartItem.quantity}</td>
                <td></td>

            </tr>
        ))}
        </table>
      </div>
    </div>
  );
}
