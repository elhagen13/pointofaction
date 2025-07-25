"use client";
import React, { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import styles from "./product.module.css";
import CheckoutWrapper from "../../components/CheckoutForm";
import stripePromise from "../../../lib/stripe";
import { useParams } from "next/navigation";
import {
    Plus,
    Minus,
  } from "lucide-react"

export default function Product({}) {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [total, setTotal] = useState(null);
  const [maxQuantities, setMaxQuantities] = useState([])
  const [quantities, setQuantities] = useState([])
  const [addedItemsPrice, setAddedItemsPrice] = useState(0)
  const [minPurchase, setMinPurchase] = useState(0)

  useEffect(() => {
    const getProduct = async () => {
      const response = await fetch(`/api/inventory/${params.id}`, {
        method: "GET",
      });

      const result = await response.json();
      setProduct(result.data);
    };
    getProduct();
  }, []);

  useEffect(() => {
    if (!product) return;
    
    const price = product?.contents
      ?.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.price * currentValue.quantity;
      }, 0)
      ?.toFixed(2);
    setTotal([price, (price * (1 - product?.discount * 0.01)).toFixed(2)]);

    setMaxQuantities(product?.contents ? product.contents.map((item) => item.quantity) : product?.quantity)
    setQuantities(product?.contents ? product.contents.map(() => 0) : 0)
    setMinPurchase(product?.minPrice)
  }, [product]);

  // Calculate addedItemsPrice whenever quantities change
  useEffect(() => {
    if (!product?.contents || !quantities.length) return;
    
    const totalPrice = product.contents.reduce((total, item, index) => {
      return total + (item.price * (quantities[index] || 0));
    }, 0);
    
    setAddedItemsPrice(totalPrice);
  }, [quantities, product]);

  const updateQuantity = (index, change) => {
    setQuantities(prevQuantities => 
      prevQuantities.map((quantity, i) => {
        if (index === i) {
          const newQuantity = quantity + change;
          // Ensure quantity doesn't go below 0 or above max
          return Math.max(0, Math.min(newQuantity, maxQuantities[index] || 0));
        }
        return quantity;
      })
    );
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className={styles.box}>
        <div className={styles.imageContainer}>
          <img className={styles.image} src={product?.imageLink} alt={product?.name}></img>
        </div>
        <div className={styles.boxDescription}>
          <div style={{ flexGrow: "1" }}>
            <div className={styles.top}>
              <h1>{product?.name} </h1>
              <div className={styles.flexH}>
                <h1
                  style={{ textDecoration: "line-through", color: "#ad2f26" }}
                >
                  ${total ? total[0] : ""}
                </h1>
                <h1 style={{ color: "#2563eb", marginLeft: "10px" }}>
                  ${total ? total[1] : ""}
                </h1>
              </div>
            </div>
            <div style={{ width: "100%", marginTop: "10px" }}>
              {product?.itemDescription}
            </div>
          </div>
          <button className={styles.buyButton}>
            <ShoppingCart className={styles.cartIcon} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
      <div className={styles.boxContents}>
        <h3>Add Individual Items to Cart</h3>
        <table
          style={{
            width: "100%",
            textAlign: "left",
            borderCollapse: "collapse",
            backgroundColor: "white",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px"
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#ccd5e0" }}>
              <th style={{ width: "60px", padding: "0.5rem" }}>Image</th>
              <th className={styles.colLg}>Description</th>
              <th className={styles.colSm}>Style</th>
              <th className={styles.colSm}>Size</th>
              <th className={styles.colSm}>Color</th>
              <th className={styles.colSm}>Price</th>
              <th className={styles.colMd}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {product?.contents?.map((item, index) => (
              <tr
                key={item._id || index}
                className={styles.row}
                style={{
                  backgroundColor: index % 2 === 0 ? "#dae2eb" : "#ccd5e0",
                }}
              >
                <td style={{ width: "60px", padding: "0.5rem" }}>
                  <img src={item.imageUrl} className={styles.tableImage} alt={item.description} />
                </td>
                <td className={styles.colLg}>{item.description}</td>
                <td className={styles.colSm}>{item.style}</td>
                <td className={styles.colSm}>{item.size}</td>
                <td className={styles.colSm}>{item.color}</td>
                <td className={styles.colSm}>${item.price.toFixed(2)}</td>
                <td className={styles.colMd}>
                  <div className={styles.quantityContainer}>
                    <div className={styles.quantityControls}>
                      <button
                        type="button"
                        className={`${styles.quantityButton}`}
                        disabled={quantities[index] <= 0}
                        onClick={() => updateQuantity(index, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className={styles.quantityDisplay}>{quantities[index] || 0}</span>
                      <button 
                        type="button" 
                        className={styles.quantityButton}
                        disabled={quantities[index] >= (maxQuantities[index] || 0)}
                        onClick={() => updateQuantity(index, 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button 
          className={styles.buyButton} 
          style={{
            marginTop: "20px",
            backgroundColor: addedItemsPrice < minPurchase ? "#9ca3af" : "#2563eb",
            cursor: addedItemsPrice < minPurchase ? "not-allowed" : "pointer"
          }} 
          disabled={addedItemsPrice < minPurchase}
        >
          <ShoppingCart className={styles.cartIcon} />
          <span>
            Add Selected Items to Cart ~ ${addedItemsPrice.toFixed(2)}
            {addedItemsPrice < minPurchase && ` (Min: $${minPurchase})`}
          </span>
        </button>
      </div>
    </div>
  );
}