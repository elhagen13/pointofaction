import { GrNext, GrPrevious } from "react-icons/gr";
import styles from "./productCard.module.css";
import { useState, useEffect } from "react";

export default function ProductCard({
  box = null,
  item = null,
  setSelectedBox,
  boxDict,
}) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(0);
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);

  if (box && !box.items) return;

  useEffect(() => {
    getDescription();
    getPrice();
    getImages();
  }, [item, box]);

  const getDescription = () => {
    const descriptors = new Set();
    if (item) {
      setDescription(
        `${item[0].color} ${item[0].brand} ${item[0].description}`,
      );
      return;
    } else if (box) {
      box.items?.forEach((item) => {
        descriptors.add(`${item.brand} ${item.description}s`);
      });
    }
    const descriptorArray = Array.from(descriptors);

    let descriptionString = "";
    descriptorArray.forEach((descriptor, index) => {
      descriptionString += descriptor;
      if (index < descriptorArray.length - 2) {
        descriptionString += ", ";
      } else if (index < descriptorArray.length - 1) {
        descriptionString += " and ";
      }
    });
    setDescription(descriptionString);
  };

  const getPrice = () => {
    let price = 0;
    if (item) {
      const priceArr = item.map((i) => parseFloat(i.price));
      const minPrice = Math.min(...priceArr);
      const maxPrice = Math.max(...priceArr);

      setDiscountedPrice(
        minPrice !== maxPrice ? `${minPrice}-$${maxPrice}` : minPrice,
      );
      return;
    }

    if (box) {
      box.items?.forEach((item) => {
        price += parseFloat(item.price) * item.quantity;
      });
    }

    setPrice(price.toFixed(2));
    setDiscountedPrice((price - price * (box.discount * 0.01)).toFixed(2));
  };

  const getImages = () => {
    if (item) {
      setImages([item[0].image]);
      return;
    }
    const imageList = [box.image];
    const imageDict = {};

    if (box?.items) {
      box.items?.forEach((item) => {
        imageDict[`${item.brand} ${item.style} ${item.color}`] = item.image;
      });
    }
    setImages(imageList.concat(Object.values(imageDict)).slice(0, 6));
  };

  return (
    <div className={styles.productCardContainer}>
      {box !== null && (
        <div className={styles.imageList}>
          {images.slice(1).map((image, index) => (
            <div
              className={styles.imageListImageContainer}
              onClick={() => setCurrentImage(index + 1)}
              style={{ cursor: "pointer" }}
            >
              <img src={image} className={styles.imageListImage}></img>
            </div>
          ))}
        </div>
      )}
      <div
        className={styles.productCard}
        onClick={() =>
          !box && setSelectedBox(box ?? boxDict[item[0].boxId] ?? item[0])
        }
      >
        <div className={styles.imageContainer}>
          <img src={images[currentImage]} className={styles.image}></img>
          {box !== null && (
            <div className={styles.imagePageContainer}>
              <div
                className={styles.nav}
                onClick={() =>
                  setCurrentImage(
                    currentImage - 1 < 0 ? images.length - 1 : currentImage - 1,
                  )
                }
              >
                <GrPrevious />
              </div>
              <div className={styles.imagePage}>
                {images.map(
                  (image, index) =>
                    box !== null && (
                      <div
                        className={`${styles.imageDots} ${index === currentImage && styles.imageDotsActive}`}
                        onClick={() => setCurrentImage(index)}
                      />
                    ),
                )}
              </div>
              <div
                className={styles.nav}
                onClick={() =>
                  setCurrentImage(
                    currentImage + 1 >= images.length ? 0 : currentImage + 1,
                  )
                }
              >
                <GrNext />
              </div>
            </div>
          )}
        </div>
        <div
          className={styles.details}
          onClick={() =>
            setSelectedBox(box ?? boxDict[item[0].boxId] ?? item[0])
          }
        >
          <div className={styles.description}>{description}</div>
          <div className={styles.productCardFooter}>
            <div className={styles.prices}>
              {box !== null && (
                <div
                  style={{ color: "#a80f0fff", textDecoration: "line-through" }}
                >
                  ${price}
                </div>
              )}
              <div style={{ color: "#2c4cb4ff" }}>${discountedPrice}</div>
            </div>
            <button className={styles.view}>View</button>
          </div>
        </div>
      </div>
    </div>
  );
}
