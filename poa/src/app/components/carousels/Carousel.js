"use client";

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { GridLoader } from "react-spinners";
import { useEffect, useRef, useState } from "react";
import styles from "./carousel.module.css";

export default function Carousel({ images = [], loading = false }) {
  const [carouselPosition, setCarouselPosition] = useState(0);

  const velocityRef = useRef(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const SWIPE_THRESHOLD = 10;

  const changeEnlarged = (increment) => {
    if (!images.length) return;

    setCarouselPosition((position) => position + increment);
  };

  // Runs continuously, but only changes the carousel when velocity is non-zero.
  useEffect(() => {
    let animationFrame;
    let previousTime;

    const animate = (time) => {
      if (previousTime !== undefined) {
        const deltaSeconds = Math.min((time - previousTime) / 1000, 0.05);

        if (velocityRef.current !== 0) {
          setCarouselPosition(
            (position) => position + velocityRef.current * deltaSeconds
          );
        }
      }

      previousTime = time;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Keep position reasonable if the image list changes.
  useEffect(() => {
    if (!images.length) {
      setCarouselPosition(0);
    }
  }, [images.length]);

  const getImageStyle = (index) => {
    if (!images.length) return { opacity: 0 };

    let difference = index - carouselPosition;
    const total = images.length;

    // Makes the carousel wrap around in the shortest direction.
    difference =
      ((difference + total / 2) % total + total) % total - total / 2;

    const distance = Math.abs(difference);

    if (distance > 5) {
      return {
        opacity: 0,
        pointerEvents: "none",
        zIndex: 0,
      };
    }

    // Position and scale for images 0–5 spaces from center.
    const positions = [0, 18, 36, 52, 62, 68];
    const scales = [1, 0.85, 0.75, 0.6, 0.5, 0.4];

    // Interpolate between positions so movement is fluid.
    const lower = Math.floor(distance);
    const upper = Math.min(Math.ceil(distance), 5);
    const progress = distance - lower;

    const x =
      positions[lower] + (positions[upper] - positions[lower]) * progress;

    const scale =
      scales[lower] + (scales[upper] - scales[lower]) * progress;

    return {
      left: `calc(50% + ${Math.sign(difference) * x}%)`,
      transform: `translateX(-50%) scale(${scale})`,
      opacity: 1,
      zIndex: Math.round(100 - distance * 10),
    };
  };

  const handlePointerMove = (event) => {
    if (event.pointerType !== "mouse") return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    // -1 = far left, 0 = center, 1 = far right
    const relativePosition = Math.max(
      -1,
      Math.min(1, (event.clientX - centerX) / (rect.width / 2))
    );

    // The center 44% of the carousel will not move.
    const deadZone = 0.22;

    if (Math.abs(relativePosition) < deadZone) {
      velocityRef.current = 0;
      return;
    }

    const normalizedSpeed =
      (Math.abs(relativePosition) - deadZone) / (1 - deadZone);

    const minSpeed = 0.35;
    const maxSpeed = 2.5;

    // Squaring gives a gentler increase near center and faster edges.
    velocityRef.current =
      Math.sign(relativePosition) *
      (minSpeed + (maxSpeed - minSpeed) * normalizedSpeed ** 2);
  };

  const stopCarousel = () => {
    velocityRef.current = 0;
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (event) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const dx = touchEndX.current - touchStartX.current;

    if (dx > SWIPE_THRESHOLD) {
      changeEnlarged(-1);
    } else if (dx < -SWIPE_THRESHOLD) {
      changeEnlarged(1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.controls}>
        <FaArrowLeft />
        <span>hover to navigate</span>
        <FaArrowRight />
      </div>

      <div
        className={styles.imageContainer}
        onPointerMove={handlePointerMove}
        onPointerLeave={stopCarousel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.gradientLeft}></div>
        {loading ? (
          <div className={styles.loadingContainer}>
            <GridLoader color="#aaa5a5" />
          </div>
        ) : (
          images.map((img, index) => (
            <img
              key={img.id ?? img.image ?? index}
              src={img.image}
              alt={`Gallery ${index + 1}`}
              className={styles.galleryItem}
              style={getImageStyle(index)}
              draggable={false}
            />
          ))
        )}
        <div className={styles.gradientRight}></div>
      </div>
    </div>
  );
}