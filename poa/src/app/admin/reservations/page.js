"use client";
import { useEffect, useState } from "react";
import styles from "./reservaton.module.css";
import Reservation from "./Reservation";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [reservation, setReservation] = useState(null)

  const statusColor = {
    Incomplete: "#db8e86",
    "In Progress": "#e0d28b",
    Complete: "#aad99e",
  };

  useEffect(() => {
    getReservations();
  }, []);

  const getReservations = async () => {
    const response = await fetch("/api/catalog/reservation", {
      method: "GET",
    });
    const result = await response.json();
    setReservations(result.data);
  };


  return (
    <div className={styles.page}>
        <h1>Order Requests</h1>
      <table className={styles.reservationTable}>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Order Title</th>
            <th>Customer Id</th>
            <th>Status</th>
            <th>Purchase Date</th>
            <th>Last Edited</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation, index) => (
            <tr
              style={{
                backgroundColor: index % 2 == 0 ? "#f2f2f2" : "#ebebeb",
              }}
              onClick={() => setReservation(reservation)}
            >
              <td className={styles.columnItem}>
                {reservation.sequentialId.toString().padStart(5, "0")}
              </td>
              <td className={styles.columnItem}>{reservation.orderTitle}</td>
              <td className={styles.columnItem}>{reservation.customer}</td>
              <td className={styles.columnItem}>
                <div className={styles.status}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "10px",
                      backgroundColor: statusColor[reservation.status],
                    }}
                  ></div>
                  {reservation.status}
                </div>
              </td>
              <td className={styles.columnItem}>
                {new Date(reservation.createdAt).toLocaleString()}
              </td>
              <td className={styles.columnItem}>
                {new Date(reservation.updatedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reservation !== null && <Reservation onClose={() => setReservation(null)} reservation={reservation}/>}
    </div>
  );
}
