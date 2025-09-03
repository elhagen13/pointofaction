"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes, FaRegTrashAlt } from "react-icons/fa";
import { FaRegSquarePlus } from "react-icons/fa6";
import Link from "next/link";

function ReservationItems() {
    return (
      <>
        <div className={styles.addStore}>
          <div className={styles.titleBar}>
            <div className={styles.title}>Reservations & Purchases</div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <Link
                className={styles.button}
                href="/admin/reservations"
                style={{
                  border: "2px solid #538561",
                  backgroundColor: "white",
                  color: "#538561",
                }}
              >
                Go to Reservations
              </Link>
              <Link
                className={styles.button}
                href="/admin/reserve"
              >
                Make Reservation
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  export default ReservationItems;
  