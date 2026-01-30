import styles from "./image.module.css";
import { useState, useEffect } from "react";
export default function Image({ image }) {
  const [expand, setExpand] = useState(false);

    useEffect(() => {
    if (!expand) return;

    const handleClick = () => {
      setExpand(false);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [expand]);


  return (
    <div style={{ position: "relative" }}>
      <div className={styles.thumbnailContainer}>
        <img src={image} onClick={(e) => {e.stopPropagation(); setExpand(true)}}></img>
      </div>
      {expand &&
       <div className={styles.imageExpanded} onClick={(e) => e.stopPropagation()}>
        <img src={image}/>
        </div>}
    </div>
  );
}
