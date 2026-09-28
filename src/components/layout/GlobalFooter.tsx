import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Layout.module.css';

export const GlobalFooter: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.globalFooter}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          {/* Brand Col */}
          <div className={styles.footerBrandCol}>
            <div 
              className={styles.brand} 
              onClick={() => handleNavigate('/')} 
              style={{ cursor: 'pointer', display: 'inline-flex' }}
            >
              <div className={styles.brandIcon}>黒</div>
              <div className={styles.brandName}>Kuro<span>Yomi</span></div>
            </div>
            <p className={styles.footerDesc}>
              An original premium reading platform built for Japanese manga, Korean webtoons, Chinese manhua, graphic novels, and ebooks. Read your favorites in immersive vertical or horizontal panels.
            </p>
          </div>
          
          {/* Navigation Col */}
          <div className={styles.footerCol}>
            <h4>Navigation</h4>
            <ul>
              <li onClick={() => handleNavigate('/')}>Home</li>
              <li onClick={() => handleNavigate('/browse')}>Browse Catalog</li>
              <li onClick={() => handleNavigate('/library')}>My Library</li>
              <li onClick={() => handleNavigate('/wallet')}>Coins & Wallet</li>
              <li onClick={() => handleNavigate('/admin')}>Creator Studio</li>
            </ul>
          </div>

          {/* Explore Genres Col */}
          <div className={styles.footerCol}>
            <h4>Explore Genres</h4>
            <ul>
              <li onClick={() => handleNavigate('/browse?genre=Action')}>Shonen Action</li>
              <li onClick={() => handleNavigate('/browse?genre=Fantasy')}>Seinen Fantasy</li>
              <li onClick={() => handleNavigate('/browse?genre=Romance')}>Shojo Romance</li>
              <li onClick={() => handleNavigate('/browse?genre=Cyberpunk')}>Sci-Fi Cyberpunk</li>
            </ul>
          </div>

          {/* Support Col */}
          <div className={styles.footerCol}>
            <h4>Support</h4>
            <ul>
              <li onClick={() => handleNavigate('/terms')}>Terms of Service</li>
              <li onClick={() => handleNavigate('/privacy')}>Privacy Policy</li>
              <li onClick={() => handleNavigate('/coin-policy')}>Sandboxed Coin Policies</li>
              <li onClick={() => handleNavigate('/support')}>Contact Support</li>
            </ul>
          </div>
        </div>

        <div className={styles.footerCopyright}>
          <div>© 2026 KuroYomi Platform Inc. Built with React 19 + TypeScript + Framer Motion.</div>
          <div>Sandboxed Manga Reader & Creator Ecosystem</div>
        </div>
      </div>
    </footer>
  );
};
