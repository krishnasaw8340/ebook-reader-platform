import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Flame, ShieldAlert, Play, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import styles from './Home.module.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { bookSeries, books, chapters, pages, readingProgress, userLibrary, toggleBookmark } = useUser();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [isInfiniteLoading, setIsInfiniteLoading] = useState(false);
  const [infiniteCount, setInfiniteCount] = useState(0);
  const [scrollSeries, setScrollSeries] = useState<any[]>([]);

  // Auto sliding carousel for top 3 series
  const featuredSeries = bookSeries.slice(0, 3);
  useEffect(() => {
    if (featuredSeries.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % featuredSeries.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredSeries.length]);

  // Handle status filters
  const filteredSeries = activeFilter === 'ALL'
    ? bookSeries
    : bookSeries.filter(s => s.status === activeFilter);

  // Continue reading filter
  const continueReadingList = bookSeries.filter(series => 
    readingProgress.some(prog => 
      books.some(b => b.series_id === series.id && b.id === prog.book_id)
    )
  );

  const getProgressPercent = (seriesId: string) => {
    const seriesBooks = books.filter(b => b.series_id === seriesId);
    const prog = readingProgress.find(p => seriesBooks.some(b => b.id === p.book_id));
    if (!prog) return undefined;
    
    const chPages = pages.filter(p => p.chapter_id === prog.chapter_id);
    const currPage = pages.find(p => p.id === prog.page_id);
    if (chPages.length > 0 && currPage) {
      return Math.round((currPage.page_no / chPages.length) * 100);
    }
    return 50;
  };

  const isSeriesBookmarked = (seriesId: string) => {
    const seriesBooks = books.filter(b => b.series_id === seriesId);
    return seriesBooks.some(b => userLibrary.some(lib => lib.book_id === b.id));
  };

  // Infinite scroll simulator
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 150
      ) {
        if (!isInfiniteLoading && infiniteCount < 2) {
          triggerInfiniteLoad();
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInfiniteLoading, infiniteCount]);

  const triggerInfiniteLoad = () => {
    setIsInfiniteLoading(true);
    setTimeout(() => {
      const newItems = [
        {
          id: `inf-series-${infiniteCount}-1`,
          title: `Chrono Odyssey Reborn`,
          description: "A time-traveling explorer shatters the temporal hourglass, splitting earth into coexisting epochs.",
          cover_image: "https://images.unsplash.com/photo-1560942485-b2a11cc13456?q=80&width=400&auto=format&fit=crop",
          status: "ONGOING" as const,
          created_at: new Date().toISOString()
        }
      ];
      setScrollSeries(prev => [...prev, ...newItems]);
      setInfiniteCount(prev => prev + 1);
      setIsInfiniteLoading(false);
    }, 1500);
  };

  return (
    <div className={styles.home}>
      {/* Featured Hero Carousel */}
      {featuredSeries.length > 0 && (
        <section className={styles.heroSection}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={carouselIndex}
              className={styles.heroSlide}
              style={{ backgroundImage: `url(${featuredSeries[carouselIndex].cover_image})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className={styles.heroBackdrop} />
              <div className={styles.heroSlideBgBlur} style={{ backgroundImage: `url(${featuredSeries[carouselIndex].cover_image})` }} />
              
              <div className="main-container">
                <div className={styles.heroContent}>
                  <div className={styles.heroBadges}>
                    <span className={styles.badgeFeatured}>Featured</span>
                    <span className={styles.badgeStatus}>Manga • {featuredSeries[carouselIndex].status}</span>
                  </div>
                  
                  <motion.h1 
                    className={styles.heroTitle}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {featuredSeries[carouselIndex].title}
                  </motion.h1>

                  <p className={styles.heroDesc}>{featuredSeries[carouselIndex].description}</p>
                  
                  <div className={styles.heroActions}>
                    <button 
                      className={styles.btnRead}
                      onClick={() => navigate(`/book/${featuredSeries[carouselIndex].id}`)}
                    >
                      <Play size={16} fill="currentColor" /> View Series
                    </button>
                    <button 
                      className={styles.btnBookmark}
                      onClick={() => toggleBookmark(featuredSeries[carouselIndex].id)}
                    >
                      <Bookmark 
                        size={16} 
                        fill={isSeriesBookmarked(featuredSeries[carouselIndex].id) ? "currentColor" : "none"} 
                      /> Library
                    </button>
                  </div>
                </div>
              </div>

              {/* Float cover */}
              <div className={styles.heroCoverWrapper}>
                <img src={featuredSeries[carouselIndex].cover_image || ''} alt={featuredSeries[carouselIndex].title} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel dots indicators */}
          <div className={styles.carouselIndicators}>
            {featuredSeries.map((_, idx) => (
              <div 
                key={idx} 
                className={`${styles.indicator} ${idx === carouselIndex ? styles.activeIndicator : ''}`}
                onClick={() => setCarouselIndex(idx)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="main-container">
        {/* Continue Reading Section */}
        {continueReadingList.length > 0 && (
          <section className={styles.shelfSection}>
            <div className={styles.shelfHeader}>
              <h2 className={styles.shelfTitle}>Continue Reading</h2>
            </div>
            <div className={`${styles.scrollShelf} no-scrollbar`}>
              {continueReadingList.map(series => (
                <BookCard 
                  key={series.id} 
                  series={series} 
                  progressPercent={getProgressPercent(series.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Today */}
        <section className={styles.shelfSection}>
          <div className={styles.shelfHeader}>
            <h2 className={styles.shelfTitle}><Flame size={20} color="var(--primary)" /> Trending Publications</h2>
          </div>
          <div className={`${styles.scrollShelf} no-scrollbar`}>
            {bookSeries.map(series => (
              <BookCard key={series.id} series={series} />
            ))}
          </div>
        </section>

        {/* Explore Filters Chips */}
        <section className={styles.shelfSection}>
          <div className={styles.shelfHeader}>
            <h2 className={styles.shelfTitle}>Filter by Status</h2>
          </div>
          <div className={`${styles.genresGrid} no-scrollbar`}>
            {(['ALL', 'ONGOING', 'COMPLETED'] as const).map(filter => (
              <div 
                key={filter}
                className={`${styles.genreCard} ${activeFilter === filter ? styles.activeGenre : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                <span>{filter === 'ALL' ? 'All Publications' : filter}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic Genre Shelf based on Active Chip */}
        <section className={styles.shelfSection}>
          <div className={styles.shelfHeader}>
            <h2 className={styles.shelfTitle}>
              {activeFilter === 'ALL' ? 'Complete Catalog Releases' : `${activeFilter} Releases`}
            </h2>
          </div>
          {filteredSeries.length > 0 ? (
            <div className={styles.bookGrid}>
              {filteredSeries.slice(0, 8).map(series => (
                <BookCard key={series.id} series={series} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyShelf}>No releases matching this status filter.</div>
          )}
        </section>

        {/* Premium Collection */}
        <section className={styles.shelfSection}>
          <div className={styles.shelfHeader}>
            <h2 className={styles.shelfTitle}><Calendar size={20} /> Premium Collections</h2>
          </div>
          <div className={`${styles.scrollShelf} no-scrollbar`}>
            {bookSeries
              .filter(series => books.some(b => b.series_id === series.id && b.coin_price > 0))
              .map(series => (
                <BookCard key={series.id} series={series} />
              ))}
          </div>
        </section>

        {/* Infinite Scroll trigger */}
        <section className={styles.infiniteScrollSection}>
          {scrollSeries.length > 0 && (
            <div className={styles.bookGrid}>
              {scrollSeries.map(series => (
                <BookCard key={series.id} series={series} />
              ))}
            </div>
          )}

          {isInfiniteLoading && (
            <div className={styles.skeletonsGrid}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
          
          {infiniteCount >= 2 && (
            <div className={styles.endOfFeed}>You have reached the end of the catalog feed.</div>
          )}
        </section>
      </div>
    </div>
  );
};
