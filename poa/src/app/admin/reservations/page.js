"use client";
import { useEffect, useState } from "react";
import styles from "./reservaton.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import Reservation from "./Reservation";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [reservation, setReservation] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
    console.log(result.data)
    // Check for ID in URL after reservations are loaded
    const id = searchParams.get("id");
    if (id && result.data.length > 0) {
      const foundReservation = result.data.find((r) => r._id === id);
      if (foundReservation) {
        setReservation(foundReservation);
      }
    }
  };

  useEffect(() => {
    getReservations();
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <h1>Order Requests</h1>
      <div className={styles.tableContainer}>
        <table className={styles.reservationItemTable}>
          <thead>
            <tr style={{ backgroundColor: "#c5ced9" }}>
              <th style={{ padding: "10px" }}>Order #</th>
              <th>Order Title</th>
              <th>Customer Id</th>
              <th>Status</th>
              <th>SO#/IN#</th>
              <th>Purchase Date</th>
              <th>Last Edited</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation, index) => (
              <tr
                style={{
                  backgroundColor: index % 2 === 0 ? "#dde4ed" : "#c5ced9",
                }}
                onClick={() => setReservation(reservation)}
              >
                <td style={{ padding: "10px" }}>
                  {reservation.sequentialId.toString().padStart(5, "0")}
                </td>
                <td>{reservation.orderTitle}</td>
                <td>{reservation.customer}</td>
                <td>
                  <div
                    className={styles.dropdownButton}
                    style={{ border: "none", width: "fit-content" }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "10px",
                        cursor: "default",
                        backgroundColor:
                          reservation.status === "Incomplete"
                            ? "#db8e86"
                            : reservation.status === "Complete"
                              ? "#aad99e"
                              : "#e0d28b",
                      }}
                    />
                    {reservation.status}
                  </div>
                </td>
                <td>{reservation.soIn || "N/A"}</td>
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
      </div>
      {reservation !== null && (
        <Reservation
          onClose={() => setReservation(null)}
          reservation={reservation}
        />
      )}
    </div>
  );
}
