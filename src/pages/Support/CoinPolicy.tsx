import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { Coins, Sparkles, Shield, ArrowRight } from 'lucide-react';
import styles from './SupportPages.module.css';

export const CoinPolicy: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tocItems = [
    { id: 'overview', label: '1. What are KuroYomi Coins?' },
    { id: 'payment-flow', label: '2. Payments & Testing' },
    { id: 'packages-bonus', label: '3. Coin Packages' },
    { id: 'unlock-mechanics', label: '4. Chapter & Volume Unlocks' },
    { id: 'refunds-transfers', label: '5. Non-Refundable & Transfer Terms' },
    { id: 'creator-royalties', label: '6. Creator Revenue Model' },
    { id: 'faq', label: '7. Coin FAQ' }
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Coin Policy' }]} />

        <header className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              <Coins size={12} /> Virtual Currency Policy
            </span>
            <span className={styles.metaText}>
              <Shield size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--color-status-success)' }} />
              Server-Verified Payments
            </span>
          </div>
          <h1 className={styles.title}>KuroYomi Coin Policy</h1>
          <p className={styles.subtitle}>
            Learn how coin purchases, wallet balances, and chapter unlocks work.
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
            <div className={styles.featureTitle}>Verified Payments</div>
            <p className={styles.featureDesc}>
              Coins are credited after the payment provider confirms a successful purchase.
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

            <section id="payment-flow" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>2</span>
                Payments & Testing
              </h2>
              <p className={styles.paragraph}>
                To purchase coins, create an order on the wallet page, enter its one-time code in the KuroYomi Discord payment channel, and complete checkout through PayPal. The website checks the order status automatically.
              </p>
              <ul className={styles.list}>
                <li>Coins are added only after the backend verifies PayPal payment confirmation.</li>
                <li>Sandbox PayPal accounts are used for testing; live PayPal transactions may charge real money.</li>
                <li>Your updated coin balance appears automatically after a successful purchase.</li>
              </ul>
              <div className={`${styles.calloutBox} ${styles.calloutInfo}`}>
                <strong>Important:</strong> Check the displayed price and PayPal account environment before approving a payment.
              </div>
            </section>

            <section id="packages-bonus" className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNumber}>3</span>
                Packages, Tiers & Bonus Incentives
              </h2>
              <p className={styles.paragraph}>
                Coin packages currently available:
              </p>
              <ul className={styles.list}>
                <li><strong>500 Coins:</strong> $4.99</li>
                <li><strong>1,200 Coins:</strong> $9.99</li>
                <li><strong>3,500 Coins:</strong> $24.99</li>
                <li><strong>8,000 Coins:</strong> $49.99</li>
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
