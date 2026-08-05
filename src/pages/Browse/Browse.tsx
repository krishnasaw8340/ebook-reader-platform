import React, { useState } from 'react';
import { Search, Compass } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import styles from './Browse.module.css';

export const Browse: React.FC = () => {
  const { bookSeries } = useUser();
  const [query, setQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');

  const statusFilters = [
    { label: 'All Releases', value: 'ALL' as const },
    { label: 'Ongoing', value: 'ONGOING' as const },
    { label: 'Completed', value: 'COMPLETED' as const }
  ];

  const filteredSeries = bookSeries.filter(series => {
    const matchesSearch = series.title.toLowerCase().includes(query.toLowerCase()) ||
      (series.description && series.description.toLowerCase().includes(query.toLowerCase()));

    const matchesStatus = selectedStatus === 'ALL' || series.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.browse}>
      <div className="main-container">
        <h2>Browse Catalog</h2>
        <p className={styles.subtitle}>Explore our complete catalog of database-registered manga series.</p>

        {/* Search & filters panel */}
        <div className={styles.filtersPanel}>
          <div className={`${styles.searchBox} glass`}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by series title or description..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className={`${styles.genresScroll} no-scrollbar`}>
            {statusFilters.map(filter => (
              <button 
                key={filter.value}
                className={`${styles.genreChip} ${selectedStatus === filter.value ? styles.activeChip : ''}`}
                onClick={() => setSelectedStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results grid layout */}
        {filteredSeries.length > 0 ? (
          <div className={styles.grid}>
            {filteredSeries.map(series => (
              <BookCard key={series.id} series={series} />
            ))}
          </div>
        ) : (
          <div className={`${styles.emptyBox} glass`}>
            <Compass size={40} className={styles.emptyIcon} />
            <h4>No Series Found</h4>
            <p>We couldn't find any titles matching your search criteria. Try modifying your filters or keyword query.</p>
          </div>
        )}

      </div>
    </div>
  );
};
