'use client'
import styles from './banner.module.css';

const BannerItem = ({ image, obj1, obj2 }) => {
  return (
    <div className={styles.bannerContainer}>
      <img src={image} className={styles.bannerImage} />
      <div className={styles.bannerImageContents}>
        <img src={obj1} className={styles.internalImage} />
        <div className={styles.textContent}>
          {obj2}
        </div>
      </div>
    </div>
  );
};

export default BannerItem;