import styles from "./image.module.css";
import { useState, useEffect } from "react";
export default function Image({ image, objectFit="contain" }) {
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
      <div className={styles.thumbnailContainer} style={{borderRadius: objectFit == "cover" && "2px"}}>
        <img src={image} onClick={(e) => {e.stopPropagation(); setExpand(true)}} style={{objectFit: objectFit}}></img>
      </div>
      {expand &&
       <div className={styles.imageExpanded} onClick={(e) => e.stopPropagation()}>
        <img src={image}/>
        </div>}
    </div>
  );
}
