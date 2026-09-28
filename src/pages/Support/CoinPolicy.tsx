import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Coins, Sparkles, Shield, RefreshCw, ShoppingCart, HelpCircle, ArrowRight } from 'lucide-react';
import styles from './SupportPages.module.css';

export const CoinPolicy: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocItems = [
    { id: 'overview', label: '1. What are KuroYomi Coins?' },
    { id: 'sandbox-nature', label: '2. Sandbox Simulation Mode' },
    { id: 'packages-bonus', label: '3. Packages & Bonus Rates' },
    { id: 'unlock-mechanics', label: '4. Chapter & Volume Unlocks' },
    { id: 'refunds-transfers', label: '5. Non-Refundable & Transfer Terms' },
    { id: 'creator-royalties', label: '6. Creator Revenue Model' },
    { id: 'faq', label: '7. Coin FAQ' }
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Sandboxed Coin Policies' }]} />

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <Coins size={12} /> Virtual Currency Policy
            </span>
            <span className={styles.metaText}>
              <Sparkles size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--color-status-warning)' }} />
              Sandbox Environment Active
            </span>
          </div>
          <h1 className={styles.title}>Sandboxed Coin Policies</h1>
          <p className={styles.subtitle}>
            Everything you need to know about KuroYomi Coins, virtual wallet balances, chapter unlocks, and our sandboxed transaction engine.
          </p>
        </header>

        {/* Feature highlight cards */}
        <div className={styles.cardsGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Coins size={22} />
            </div>
            <div className={styles.featureTitle}>Instant Micro-Unlocks</div>
            <p className={styles.featureDesc}>
              Unlock individual manga chapters for as little as 2 to 5 coins without waiting for entire book releases.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Shield size={22} />
            </div>
            <div className={styles.featureTitle}>Permanent Ownership</div>
            <p className={styles.featureDesc}>
              Any volume or chapter unlocked with coins remains in your personal cloud library forever.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Sparkles size={22} />
            </div>
            <div className={styles.featureTitle}>Sandboxed Payment Engine</div>
            <p className={styles.featureDesc}>
              Test transactions risk-free using simulated card processors and instant testnet ledger credits.
            </p>
          </div>
        </div>

        <div className={styles.contentLayout}>
          {/* Quick Jump Sidebar */}
          <aside className={styles.tocSidebar}>
            <div className={styles.tocTitle}>Table of Contents</div>
            <nav className={styles.tocList}>
              {tocItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} className={styles.tocItem}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={() => navigate('/wallet')}
                className={styles.submitBtn} 
                style={{ width: '100%', fontSize: '12px', padding: '10px' }}
              >
                Go to My Wallet <ArrowRight size={14} />
              </button>
            </div>
          </aside>

          {/* Main Document Body */}
          <main className={styles.docCard}>
            <section id="overview" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>1</span>
                What are KuroYomi Coins?
              </h2>
              <p className={styles.paragraph}>
                <strong>KuroYomi Coins</strong> are digital platform credits specifically engineered to provide an effortless, friction-free reading experience. Instead of charging your credit card small amounts for individual 20-page chapters, you hold a balance of coins and spend them instantly with a single tap in the reader.
              </p>
            </section>

            <section id="sandbox-nature" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>2</span>
                Sandbox Simulation Mode & Safe Testing
              </h2>
              <p className={styles.paragraph}>
                In this preview deployment, KuroYomi operates under a <strong>Sandboxed Financial Protocol</strong>:
              </p>
              <ul className={styles.list}>
                <li>Coin top-ups and checkout checkouts simulate actual production payment webhooks.</li>
                <li>No actual fiat currency (USD, EUR, JPY) is captured during transactions.</li>
                <li>Your wallet ledger accurately reflects double-entry accounting records, simulated orders, and unlock receipts so you can evaluate the experience exactly as in production.</li>
              </ul>
              <div className={`${styles.calloutBox} ${styles.calloutInfo}`}>
                <strong>Developer & Evaluator Note:</strong> Test orders placed through the platform will instantly update your wallet balance upon simulated checkout completion.
              </div>
            </section>

            <section id="packages-bonus" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>3</span>
                Packages, Tiers & Bonus Incentives
              </h2>
              <p className={styles.paragraph}>
                Coins are bundled into tiered packages. Larger tiers award bonus promotional coins:
              </p>
              <ul className={styles.list}>
                <li><strong>Starter Pouch (100 Coins):</strong> Perfect for catching up on 20-30 individual chapters.</li>
                <li><strong>Reader's Chest (300 Coins + 25 Bonus):</strong> Ideal for binge-reading a full ongoing volume.</li>
                <li><strong>Collector's Vault (1,000 Coins + 150 Bonus):</strong> Best value for heavy manga and manhwa readers.</li>
              </ul>
            </section>

            <section id="unlock-mechanics" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>4</span>
                Chapter & Volume Unlock Mechanics
              </h2>
              <p className={styles.paragraph}>
                KuroYomi supports two primary reading access models:
              </p>
              <ul className={styles.list}>
                <li><strong>Free Chapters:</strong> Most series provide the first 2–3 chapters completely free to all registered readers without requiring any coins.</li>
                <li><strong>Pay-per-Chapter:</strong> Locked chapters are priced between 2 and 5 coins depending on chapter length and visual rendering complexity.</li>
                <li><strong>Full Volume Bundle:</strong> When you purchase a complete Volume bundle, all current and future chapters included in that volume are permanently unlocked with a 20% discount.</li>
              </ul>
            </section>

            <section id="refunds-transfers" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>5</span>
                Non-Refundable & Transferability Terms
              </h2>
              <p className={styles.paragraph}>
                KuroYomi Coins have no real-world monetary redemption value and cannot be exchanged back into fiat currency or cryptocurrency:
              </p>
              <ul className={styles.list}>
                <li><strong>No Expiration:</strong> Coins credited to your wallet balance never expire as long as your account remains active.</li>
                <li><strong>Non-Transferable:</strong> Coins cannot be traded, gifted between disparate user accounts, or auctioned on secondary markets.</li>
                <li><strong>Finality:</strong> Once spent to decrypt and unlock a chapter for streaming, coin deductions are final.</li>
              </ul>
            </section>

            <section id="creator-royalties" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>6</span>
                Creator Revenue Model & Royalties
              </h2>
              <p className={styles.paragraph}>
                KuroYomi is built creator-first. 70% of all coins spent unlocking chapters are credited to the creator or publisher's royalty pool. In Creator Studio (Admin), mangaka can track chapter-by-chapter reader engagement, coin unlock velocity, and projected revenue splits.
              </p>
            </section>

            <section id="faq" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>7</span>
                Frequently Asked Questions
              </h2>
              <div className={styles.list}>
                <div style={{ marginBottom: '16px' }}>
                  <strong>Q: What happens if a chapter fails to load after I spent coins?</strong>
                  <p className={styles.paragraph} style={{ margin: '4px 0 0 0' }}>
                    Once unlocked, the chapter receipt is permanently recorded in your database account. Refreshing the browser or switching devices will never require re-spending coins.
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong>Q: Can I get free coins?</strong>
                  <p className={styles.paragraph} style={{ margin: '4px 0 0 0' }}>
                    Yes! KuroYomi awards promotional coins during welcome registration events, daily check-in streaks, and community reading challenges.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
