import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Bookmark, Coins, User } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Layout.module.css';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Browse', path: '/browse', icon: Compass },
    { label: 'Library', path: '/library', icon: Bookmark },
    { label: 'Wallet', path: '/wallet', icon: Coins },
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <nav className={`${styles.bottomNav} glass`}>
      <div className={styles.bottomNavContainer}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <div 
              key={item.label} 
              className={styles.bottomNavItem} 
              onClick={() => navigate(item.path)}
            >
              <div className={styles.iconWrapper}>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabGlow"
                    className={styles.activeTabGlow}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon 
                  size={20} 
                  className={isActive ? styles.activeIcon : styles.inactiveIcon} 
                />
              </div>
              <span className={isActive ? styles.activeLabel : styles.inactiveLabel}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
