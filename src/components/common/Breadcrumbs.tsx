import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHomeIcon = true,
  className = '',
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`${styles.breadcrumbNav} ${className}`.trim()}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          const showHome = isFirst && showHomeIcon && (item.path === '/' || item.label.toLowerCase() === 'home');

          return (
            <li key={index} className={styles.item}>
              {item.path && !isLast ? (
                <Link to={item.path} className={styles.link}>
                  {showHome ? (
                    <>
                      <Home size={14} className={styles.homeIcon} />
                      <span>{item.label}</span>
                    </>
                  ) : (
                    <>
                      {item.icon && <span className={styles.homeIcon}>{item.icon}</span>}
                      <span>{item.label}</span>
                    </>
                  )}
                </Link>
              ) : (
                <span className={styles.current} aria-current={isLast ? 'page' : undefined} title={item.label}>
                  {item.icon && <span className={styles.homeIcon} style={{ marginRight: 5 }}>{item.icon}</span>}
                  {item.label}
                </span>
              )}

              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  <ChevronRight size={13} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
