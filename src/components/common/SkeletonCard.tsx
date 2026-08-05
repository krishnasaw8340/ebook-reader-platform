import React from 'react';
import styles from './BookCard.module.css';

export const SkeletonCard: React.FC = () => {
  return (
    <div className={styles.skeletonCard}>
      <div className={`${styles.skeletonCover} shimmer`} />
      <div className={`${styles.skeletonTitle} shimmer`} />
      <div className={`${styles.skeletonText} shimmer`} />
    </div>
  );
};
