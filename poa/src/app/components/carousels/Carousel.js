"use client";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import styles from "./carousel.module.css";
import { useState, useEffect, useRef } from "react";

export default function Carousel({ images, loading }) {
  const [curEnlarged, setCurEnlarged] = useState(0);

  const [hoverDelay, setHoverDelay] = useState(null);
  const directionRef = useRef(1);
  const intervalRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const SWIPE_THRESHOLD = 10;

  // --- Positioning stays the same (class-based) ---
  const getPosition = (index) => {
    if (!images.length) return styles.hidden;
    const current = curEnlarged;
    if (index === current) return styles.center;

    const total = images.length;
    let diff = index - current;
    if (diff > total / 2) diff -= total;
    else if (diff < -total / 2) diff += total;

    if (diff < 0 && diff >= -5) {
      const d = Math.abs(diff);
      return `${styles.left} ${styles[`left${d}`]}`;
    } else if (diff > 0 && diff <= 5) {
      return `${styles.right} ${styles[`right${diff}`]}`;
    }
    return styles.hidden;
  };

  const changeEnlarged = (increment) => {
    setCurEnlarged((previous) => {
      if (!images.length) return 0;
      return (previous + increment + images.length) % images.length;
    });
  };

  // Clear on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // (Re)start an interval whenever hoverDelay changes
  useEffect(() => {
    // Stop any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // If we have a valid delay, start a new interval
    if (typeof hoverDelay === "number" && hoverDelay > 0) {
      intervalRef.current = setInterval(() => {
        changeEnlarged(directionRef.current);
      }, hoverDelay);
    }

    // Cleanup when delay changes again
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hoverDelay]);

  const startHoverScroll = (direction = 1) => {
    directionRef.current = direction;
    // If delay hasn't been set by mouse move yet, give a sensible default
    if (hoverDelay == null) {
      setHoverDelay(220); // mid-speed default
    }
  };

  const stopHoverScroll = () => {
    directionRef.current = 1;
    setHoverDelay(null); // stop the interval (effect cleanup handles it)
  };

  // Map mouse position to delay (ms): closer to edge => smaller delay => faster
  const handleMouseMove = (e, direction) => {
    directionRef.current = direction;

    const rect = e.currentTarget.getBoundingClientRect();
    const zoneWidth = Math.max(1, rect.width); // avoid division by zero
    // Position within the zone [0..zoneWidth]
    const localX = Math.min(Math.max(e.clientX - rect.left, 0), zoneWidth);

    const distanceFromEdge = direction === 1 ? zoneWidth - localX : localX;

    // ratio: 0 (far from edge) -> 1 (at the edge)
    const ratio = 1 - Math.min(Math.max(distanceFromEdge / zoneWidth, 0), 1);

    // Map ratio to delay: near edge -> minDelay (fast); far -> maxDelay (slow)
    const minDelay = 200;
    const maxDelay = 400;
    const delay = Math.round(maxDelay - ratio * (maxDelay - minDelay));

    setHoverDelay(delay);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const dx = touchEndX.current - touchStartX.current;

    // Swipe Right → go left (previous)
    if (dx > SWIPE_THRESHOLD) {
      changeEnlarged(-1);
    }

    // Swipe Left → go right (next)
    if (dx < -SWIPE_THRESHOLD) {
      changeEnlarged(1);
    }

    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.controls}>
        <FaArrowLeft />
        hover to navigate
        <FaArrowRight />
      </div>

      <div
        className={styles.imageContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img.image}
            alt={`Gallery ${i}`}
            className={`${styles.galleryItem} ${getPosition(i)}`}
            draggable={false}
          />
        ))}
        <div
          className={styles.mouseRight}
          onMouseEnter={() => startHoverScroll(1)}
          onMouseLeave={stopHoverScroll}
          onMouseMove={(e) => handleMouseMove(e, 1)}
        />

        <div
          className={styles.mouseCenter}
          onMouseEnter={stopHoverScroll}
          onMouseMove={stopHoverScroll}
        />

        <div
          className={styles.mouseLeft}
          onMouseEnter={() => startHoverScroll(-1)}
          onMouseLeave={stopHoverScroll}
          onMouseMove={(e) => handleMouseMove(e, -1)}
        />
      </div>
    </div>
  );
}
