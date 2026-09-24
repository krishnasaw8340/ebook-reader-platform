import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Coins, Plus, User, Bookmark, Sparkles, LogOut, Shield, ArrowLeft, X, Flame } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import styles from './Layout.module.css';

export const TopNavbar: React.FC<{ onSearchTrigger?: () => void }> = ({ onSearchTrigger }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, bookSeries, userLibrary } = useUser();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = bookSeries.filter(b => 
      b.title.toLowerCase().includes(val.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(val.toLowerCase()))
    );
    setSearchResults(filtered.slice(0, 5));
  };

  const handleSearchResultClick = (seriesId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    setMobileSearchOpen(false);
    navigate(`/book/${seriesId}`);
  };

  const popularSeries = bookSeries.slice(0, 3);
  const topRecentSeries = [...bookSeries].reverse().slice(0, 3);

  const isActive = (path: string) => location.pathname === path;

  const renderSuggestions = () => (
    <div className={styles.suggestionsContainer}>
      <div className={styles.suggestionSection}>
        <div className={styles.suggestionHeader}>
          <Flame size={11} className={styles.suggestionIconFlame} fill="currentColor" />
          <span>Trending</span>
        </div>
        <div className={styles.suggestionList}>
          {popularSeries.map(b => (
            <div key={b.id} className={styles.suggestionItem} onClick={() => handleSearchResultClick(b.id)}>
              <img src={b.cover_image || ''} alt={b.title} className={styles.suggestionCover} />
              <div className={styles.suggestionInfo}>
                <div className={styles.suggestionTitle}>{b.title}</div>
                <div className={styles.suggestionMeta}>{b.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.suggestionSection}>
        <div className={styles.suggestionHeader}>
          <Sparkles size={11} className={styles.suggestionIconSparkles} fill="currentColor" />
          <span>Recent</span>
        </div>
        <div className={styles.suggestionList}>
          {topRecentSeries.map(b => (
            <div key={b.id} className={styles.suggestionItem} onClick={() => handleSearchResultClick(b.id)}>
              <img src={b.cover_image || ''} alt={b.title} className={styles.suggestionCover} />
              <div className={styles.suggestionInfo}>
                <div className={styles.suggestionTitle}>{b.title}</div>
                <div className={styles.suggestionMeta}>{b.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {mobileSearchOpen ? (
          <div className={styles.mobileSearchContainer}>
            <button 
              className={styles.mobileSearchBack} 
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              aria-label="Close search"
            >
              <ArrowLeft size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Search manga, series, creators..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.mobileSearchInput}
              autoFocus
            />
            {searchQuery && (
              <button 
                className={styles.mobileSearchClear} 
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            
            <div className={`${styles.searchDropdown} ${styles.mobileSearchDropdown}`}>
              {searchQuery ? (
                searchResults.length > 0 ? (
                  searchResults.map(b => (
                    <div key={b.id} className={styles.searchItem} onClick={() => handleSearchResultClick(b.id)}>
                      <img src={b.cover_image || ''} alt={b.title} />
                      <div>
                        <div className={styles.searchTitle}>{b.title}</div>
                        <div className={styles.searchMeta}>{b.status}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noSearch}>No results found</div>
                )
              ) : (
                renderSuggestions()
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Brand */}
            <div className={styles.brand} onClick={() => navigate('/')}>
              <div className={styles.brandIcon}>黒</div>
              <div className={styles.brandName}>Kuro<span>Yomi</span></div>
            </div>

            {/* Desktop Nav */}
            <nav className={styles.desktopNav}>
              <ul>
                <li className={isActive('/') ? styles.activeLink : ''} onClick={() => navigate('/')}>Home</li>
                <li className={isActive('/browse') ? styles.activeLink : ''} onClick={() => navigate('/browse')}>Browse</li>
                <li className={isActive('/library') ? styles.activeLink : ''} onClick={() => navigate('/library')}>Library</li>
              </ul>
            </nav>

            {/* Search & Actions */}
            <div className={styles.actions}>
              {/* Desktop Search */}
              <div className={styles.searchWrapper} ref={searchRef}>
                <Search className={styles.searchIcon} size={15} />
                <input 
                  type="text" 
                  placeholder="Search manga..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  className={styles.searchInput}
                />
                {showSearchDropdown && (
                  <div className={styles.searchDropdown}>
                    {searchQuery ? (
                      searchResults.length > 0 ? (
                        searchResults.map(b => (
                          <div key={b.id} className={styles.searchItem} onClick={() => handleSearchResultClick(b.id)}>
                            <img src={b.cover_image || ''} alt={b.title} />
                            <div>
                              <div className={styles.searchTitle}>{b.title}</div>
                              <div className={styles.searchMeta}>{b.status}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.noSearch}>No results found</div>
                      )
                    ) : (
                      renderSuggestions()
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Search Button */}
              <button 
                className={`${styles.navBtn} ${styles.mobileSearchBtn}`} 
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Open search"
              >
                <Search size={18} />
              </button>

              {/* Wallet */}
              <div className={`${styles.walletPill} ${styles.desktopOnlyAction}`} onClick={() => navigate('/wallet')}>
                <Coins className={styles.coinIcon} size={14} />
                <span>{wallet?.balance || 0}</span>
                <span className={styles.walletAdd}><Plus size={9} /></span>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle variant="menu" />

              {/* Profile */}
              <div className={`${styles.profileWrapper} ${styles.desktopOnlyAction}`} ref={dropdownRef}>
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop" 
                  alt="Profile" 
                  className={styles.profileAvatar} 
                  onClick={() => setProfileOpen(!profileOpen)}
                />
                {profileOpen && (
                  <div className={styles.profileDropdown}>
                    <div className={styles.profileDropdownHeader}>
                      <div className={styles.profileName}>{user ? user.email.split('@')[0] : 'Guest User'}</div>
                      <div className={styles.profileEmail}>{user ? user.email : 'Sign in to access your library'}</div>
                    </div>
                    <div className={styles.profileMenu}>
                      <div className={styles.profileItem} onClick={() => { setProfileOpen(false); navigate('/library'); }}>
                        <Bookmark size={14} /> My Library ({userLibrary.length})
                      </div>
                      <div className={styles.profileItem} onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                        <User size={14} /> Account Settings
                      </div>
                      <div className={styles.profileItem} onClick={() => { setProfileOpen(false); navigate('/wallet'); }}>
                        <Coins size={14} /> My Coins ({wallet?.balance || 0})
                      </div>
                      {isAdmin && (
                        <div className={styles.profileItem} onClick={() => { setProfileOpen(false); navigate('/admin'); }} style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                          <Shield size={14} /> Admin Portal
                        </div>
                      )}
                      
                      <div style={{ padding: '8px 4px 4px 4px', borderTop: '1px solid var(--color-border-subtle)', margin: '4px 0' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '6px', paddingLeft: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appearance</div>
                        <ThemeToggle variant="segmented" />
                      </div>

                      {isAuthenticated ? (
                        <div className={`${styles.profileItem} ${styles.signOut}`} onClick={async () => { setProfileOpen(false); await logout(); navigate('/login'); }}>
                          <LogOut size={14} /> Sign Out
                        </div>
                      ) : (
                        <div className={styles.profileItem} onClick={() => { setProfileOpen(false); navigate('/login'); }}>
                          <LogOut size={14} /> Sign In / Register
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
