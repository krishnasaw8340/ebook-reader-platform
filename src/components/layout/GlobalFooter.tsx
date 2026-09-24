import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Layout.module.css';

export const GlobalFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className={styles.globalFooter}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrandCol}>
            <div className={styles.brand} onClick={() => navigate('/')}>
              <div className={styles.brandIcon}>黒</div>
              <div className={styles.brandName}>Kuro<span>Yomi</span></div>
            </div>
            <p className={styles.footerDesc}>
              An original premium reading platform built for Japanese manga, Korean webtoons, Chinese manhua, graphic novels, and ebooks. Read your favorites in immersive vertical or horizontal panels.
            </p>
          </div>
          
          <div className={styles.footerCol}>
            <h4>Navigation</h4>
            <ul>
              <li onClick={() => navigate('/')}>Home</li>
              <li onClick={() => navigate('/browse')}>Browse Catalog</li>
              <li onClick={() => navigate('/library')}>My Library</li>
              <li onClick={() => navigate('/wallet')}>Coins & Wallet</li>
              <li onClick={() => navigate('/admin')}>Creator Studio</li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Explore Genres</h4>
            <ul>
              <li onClick={() => navigate('/browse?genre=Action')}>Shonen Action</li>
              <li onClick={() => navigate('/browse?genre=Fantasy')}>Seinen Fantasy</li>
              <li onClick={() => navigate('/browse?genre=Romance')}>Shojo Romance</li>
              <li onClick={() => navigate('/browse?genre=Cyberpunk')}>Sci-Fi Cyberpunk</li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Support</h4>
            <ul>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Sandboxed Coin Policies</li>
              <li>Contact Support</li>
            </ul>
          </div>
        </div>

        <div className={styles.footerCopyright}>
          <div>© 2026 KuroYomi Platform Inc. Built with React 19 + TypeScript + Framer Motion.</div>
          <div>Designed by Google DeepMind Agent</div>
        </div>
      </div>
    </footer>
  );
};
