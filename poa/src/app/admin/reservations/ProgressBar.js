import styles from "./progressBar.module.css";
import { useState, useEffect } from "react";

export default function ProgressBar({ steps, stepsComplete }) {
  const [loaded, setLoaded] = useState(false);
  const [animatedStepsComplete, setAnimatedStepsComplete] = useState(0);

  const progressPercentage = steps > 0 ? (stepsComplete / steps) * 100 : 0;

  useEffect(() => {
    const timerId = setTimeout(() => {
      setLoaded(true);
    }, 5);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  // Animate steps completion in sync with line
  useEffect(() => {
    if (!loaded) return;

    let currentStep = 0;
    const stepDuration = 1000 / stepsComplete;

    const animateSteps = () => {
      if (currentStep < stepsComplete) {
        setAnimatedStepsComplete(currentStep + 1);
        currentStep++;
        setTimeout(animateSteps, stepDuration);
      }
    };

    if (stepsComplete > 0) {
      setTimeout(animateSteps, stepDuration);
    }
  }, [loaded, stepsComplete]);

  const circles = []
  for(let i = 0; i < steps; i++){
    circles.push(
        <div
          className={styles.circle}
        />
    )
  }

  return (
    <div className={styles.barContainer}>
      <div className={styles.line}>
        <div
          className={styles.innerLine}
          style={{
            width: loaded ? `${progressPercentage}%` : "0%",
          }}
        />
      </div>
      {steps !== 0 && <div
        className={`${styles.circle} ${loaded ? styles.complete : styles.incomplete}`}
      />}
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={`${styles.circle} ${i < animatedStepsComplete ? styles.complete : styles.incomplete}`}
        />
      ))}
    </div>
  );
}
