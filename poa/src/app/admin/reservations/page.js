"use client";
import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from "react";
import styles from "./reservation.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import Reservation from "./Reservation";
import Link from "next/link";

// Create a separate component that uses useSearchParams
function ReservationsContent() {
  const [reservations, setReservations] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(null);
  const filters = ["All", "Incomplete", "In Progress", "Complete"];
  const [activeFilter, setActiveFilter] = useState("All");
  const [filterIndex, setFilterIndex] = useState(0)
  const colors = ["#4b84de", "#db8e86", "#e0d28b", "#aad99e"];
  const filterRefs = useRef({});
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

    const reservations = [];
    for (const reservation of result.data) {
      let status = "";
      const completeItems = reservation.items.reduce(
        (a, b) => a + (b.pulled >= b.quantReserved ? 1 : 0),
        0
      );
      if (completeItems === reservation.items.length) status = "Complete";
      else if (completeItems !== 0) status = "In Progress";
      else status = "Incomplete";
      reservations.push({
        ...reservation,
        status: status,
      });
    }
    setReservations(reservations);

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

  const filteredReservations = useMemo(() => {
    let items;

    switch (activeFilter) {
      case "Incomplete":
        items = reservations.filter((item) => item.status === "Incomplete");
        break;
      case "In Progress":
        items = reservations.filter((item) => item.status === "In Progress");
        break;
      case "Complete":
        items = reservations.filter((item) => item.status === "Complete");
        break;
      default: 
        items = reservations;
    }
    return items
  }, [
    reservations, activeFilter
  ]);

  const updateSliderPosition = useCallback((filterName) => {
    const element = filterRefs.current[filterName];
    if (element) {
      const rect = element.getBoundingClientRect();
      const containerRect = element.parentElement.getBoundingClientRect();

      setSliderPosition({
        width: rect.width,
        height: rect.height,
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
      });
    }
  }, []);

  const changePagination = useCallback(
    (e) => {
      const filterName = e.target.textContent;
      setActiveFilter(filterName);
      updateSliderPosition(filterName);
    },
    [updateSliderPosition]
  );

  // Update slider on mount and resize
  useEffect(() => {
    updateSliderPosition(activeFilter);

    const handleResize = () => updateSliderPosition(activeFilter);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeFilter, updateSliderPosition]);

  return (
    <div className={styles.page}>
      <div style={{display:"flex", justifyContent:"space-between"}}>
        <h1>Order Requests</h1>
        <Link href="/admin/reserve" className={styles.button}>Place Reservation</Link>
        </div>
      <div className={styles.paginationType}>
        <div
          className={styles.slider}
          style={{
            width: sliderPosition?.width + 20 || 0,
            height: sliderPosition?.height + 10 || 0,
            left: sliderPosition?.left || 0,
            top: sliderPosition?.top || 0,
            backgroundColor: colors[filterIndex]
          }}
        />
        {filters.map((filter, index) => (
          <div
            key={filter}
            ref={(el) => (filterRefs.current[filter] = el)}
            className={styles.filter}
            style={{color: activeFilter === filter ? "white" : "black"}}
            onClick={(e) => {changePagination(e); setFilterIndex(index)}}
          >
            {filter}
          </div>
        ))}
      </div>
      {filteredReservations.length > 0 ? <div className={styles.tableContainer}>
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
            {filteredReservations.map((reservation, index) => (
              <tr
                key={reservation._id} // Add key prop
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
      :
      <div style={{fontStyle:"italic", fontSize:"1.5rem", color:"gray", width:"100%", height:"100px", display:"flex", justifyContent:"center", alignItems:"center"}}>Currently no reservations</div>
      }
      {reservation !== null && (
        <Reservation
          onClose={() => setReservation(null)}
          reservation={reservation}
        />
      )}
    </div>
  );
}

// Loading component for suspense fallback
function ReservationsLoading() {
  return (
    <div className={styles.page}>
      <h1>Order Requests</h1>
      <div>Loading...</div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function Reservations() {
  return (
    <Suspense fallback={<ReservationsLoading />}>
      <ReservationsContent />
    </Suspense>
  );
}
