'use client'
import styles from './banner.module.css';

const BannerItem = ({ image, obj1, obj2 }) => {
  return (
    <div className={styles.bannerContainer}>
      <img src={image} className={styles.bannerImage} />
    </div>
  );
};

export default BannerItem;