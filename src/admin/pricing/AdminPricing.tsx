import React, { useEffect, useState } from 'react';
import {
    Coins,
    DollarSign,
    Lock,
    Unlock,
    Plus,
    Edit2,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import {
    adminPricingService,
    adminChapterService,
    adminBookService
} from '../../services/admin/adminServices';
import type { CoinPackage, Chapter, Book } from '../../types';
import {
    PageHeader,
    StatCard,
    StatusBadge,
    Modal,
    LoadingState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

export const AdminPricing: React.FC = () => {
    const [packages, setPackages] = useState<CoinPackage[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Edit package modal
    const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null);
    const [formPkgName, setFormPkgName] = useState('');
    const [formCoins, setFormCoins] = useState(10);
    const [formPrice, setFormPrice] = useState(0.99);

    // Edit chapter pricing modal
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [formAccessType, setFormAccessType] = useState<'FREE' | 'PARTIAL' | 'PARTIAL_FREE' | 'PAID'>('FREE');
    const [formCoinCost, setFormCoinCost] = useState(1);
    const [formFreePages, setFormFreePages] = useState(1);

    const loadPricing = async () => {
        setLoading(true);
        try {
            const [pkgs, chaps, bList] = await Promise.all([
                adminPricingService.getCoinPackages(),
                adminChapterService.getAll(),
                adminBookService.getAll()
            ]);
            setPackages(pkgs);
            setChapters(chaps);
            setBooks(bList);
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load pricing configurations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPricing();
    }, []);

    const openEditPackageModal = (pkg: CoinPackage) => {
        setEditingPackage(pkg);
        setFormPkgName(pkg.name);
        setFormCoins(pkg.coins);
        setFormPrice(pkg.price);
    };

    const handlePackageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPackage) return;
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await adminPricingService.updatePackage(editingPackage.id, {
                name: formPkgName,
                coins: Number(formCoins),
                price: Number(formPrice)
            });
            setSuccessMessage(`Package "${formPkgName}" updated.`);
            setEditingPackage(null);
            loadPricing();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update coin package.');
        }
    };

    const openEditChapterModal = (ch: Chapter) => {
        setEditingChapter(ch);
        setFormAccessType(ch.access_type);
        setFormCoinCost(ch.coin_cost);
        setFormFreePages(ch.free_pages || 1);
    };

    const handleChapterPricingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChapter) return;
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await adminChapterService.update(editingChapter.id, {
                access_type: formAccessType,
                coin_cost: formAccessType === 'FREE' ? 0 : Number(formCoinCost),
                free_pages: Number(formFreePages)
            });
            setSuccessMessage(`Pricing for "${editingChapter.title}" updated.`);
            setEditingChapter(null);
            loadPricing();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update chapter pricing.');
        }
    };

    const freeChaptersCount = chapters.filter((c) => c.access_type === 'FREE' || c.coin_cost === 0).length;
    const paidChaptersCount = chapters.length - freeChaptersCount;

    return (
        <div>
            <PageHeader
                title="Pricing & Coin Monetization Engine"
                subtitle="Configure coin refill packages, chapter unlock costs, and free preview page allowances."
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Quick Stat Cards */}
            <div className={styles.statGrid}>
                <StatCard
                    title="Active Coin Packages"
                    value={packages.length}
                    icon={<Coins size={20} />}
                    subtitle="Tiered coin bundles in store"
                    trendColor="#ffd700"
                />
                <StatCard
                    title="Free Chapter Releases"
                    value={freeChaptersCount}
                    icon={<Unlock size={20} />}
                    subtitle="Available to all registered readers"
                    trendColor="#2ecc71"
                />
                <StatCard
                    title="Monetized Chapters"
                    value={paidChaptersCount}
                    icon={<Lock size={20} />}
                    subtitle="Require coin balance unlock"
                    trendColor="#f59e0b"
                />
            </div>

            {/* Coin Store Packages */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Coin Refill Packages</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configured for Stripe / Sandbox payment gateway</span>
                </div>

                <div className={styles.tableCard}>
                    {loading ? (
                        <LoadingState message="Loading coin packages..." />
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Package Name</th>
                                        <th>Coins Credited</th>
                                        <th>Store Price (USD)</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packages.map((pkg) => (
                                        <tr key={pkg.id}>
                                            <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{pkg.name}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#ffd700' }}>
                                                    🪙 {pkg.coins} Coins
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#2ecc71' }}>
                                                ${pkg.price.toFixed(2)}
                                            </td>
                                            <td>
                                                <StatusBadge status={pkg.active ? 'ACTIVE' : 'INACTIVE'} type={pkg.active ? 'success' : 'danger'} />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="Edit Package"
                                                    onClick={() => openEditPackageModal(pkg)}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Chapter Pricing Rules */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Content Pricing & Free Preview Rules</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure chapter unlocking requirements</span>
                </div>

                <div className={styles.tableCard}>
                    {loading ? (
                        <LoadingState message="Loading chapter rules..." />
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Chapter</th>
                                        <th>Parent Volume</th>
                                        <th>Access Model</th>
                                        <th>Coin Unlock Cost</th>
                                        <th>Free Preview Pages</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chapters.map((ch) => {
                                        const parentBook = books.find((b) => b.id === ch.book_id);
                                        const isPaid = ch.access_type === 'PAID' || ch.coin_cost > 0;

                                        return (
                                            <tr key={ch.id}>
                                                <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                                    Ch. {ch.chapter_no}: {ch.title}
                                                </td>
                                                <td>{parentBook?.title || 'Unknown Volume'}</td>
                                                <td>
                                                    {isPaid ? (
                                                        <StatusBadge status="PAID" type="warning" />
                                                    ) : (
                                                        <StatusBadge status="FREE" type="success" />
                                                    )}
                                                </td>
                                                <td>
                                                    {ch.coin_cost > 0 ? (
                                                        <span style={{ color: '#ffd700', fontWeight: 700 }}>{ch.coin_cost} Coins</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>0 (Free)</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {ch.free_pages > 0 ? `${ch.free_pages} page(s) free` : 'No preview'}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className={styles.btnSecondary}
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        onClick={() => openEditChapterModal(ch)}
                                                    >
                                                        <Edit2 size={12} /> Adjust Pricing
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Package Modal */}
            <Modal
                isOpen={!!editingPackage}
                onClose={() => setEditingPackage(null)}
                title="Edit Coin Package"
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setEditingPackage(null)}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handlePackageSubmit}>
                            Save Package
                        </button>
                    </>
                }
            >
                <form onSubmit={handlePackageSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Package Name</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={formPkgName}
                            onChange={(e) => setFormPkgName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Coins Granted</label>
                            <input
                                type="number"
                                min={1}
                                className={styles.formInput}
                                value={formCoins}
                                onChange={(e) => setFormCoins(parseInt(e.target.value) || 1)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Price (USD)</label>
                            <input
                                type="number"
                                step="0.01"
                                min={0.01}
                                className={styles.formInput}
                                value={formPrice}
                                onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0.01)}
                                required
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Edit Chapter Pricing Modal */}
            <Modal
                isOpen={!!editingChapter}
                onClose={() => setEditingChapter(null)}
                title={`Configure Pricing: ${editingChapter?.title}`}
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setEditingChapter(null)}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handleChapterPricingSubmit}>
                            Save Pricing Rule
                        </button>
                    </>
                }
            >
                <form onSubmit={handleChapterPricingSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Access Model</label>
                        <select
                            className={styles.formSelect}
                            value={formAccessType}
                            onChange={(e) => {
                                const val = e.target.value as 'FREE' | 'PARTIAL' | 'PAID';
                                setFormAccessType(val);
                                if (val === 'FREE') setFormCoinCost(0);
                                else if (formCoinCost === 0) setFormCoinCost(1);
                            }}
                        >
                            <option value="FREE">FREE (All pages free of charge)</option>
                            <option value="PAID">PAID (Full chapter locked behind coin cost)</option>
                            <option value="PARTIAL">PARTIAL (Initial preview pages free, remaining paid)</option>
                        </select>
                    </div>

                    {formAccessType !== 'FREE' && (
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Unlock Cost (Coins)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={styles.formInput}
                                    value={formCoinCost}
                                    onChange={(e) => setFormCoinCost(parseInt(e.target.value) || 1)}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Free Preview Pages</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={styles.formInput}
                                    value={formFreePages}
                                    onChange={(e) => setFormFreePages(parseInt(e.target.value) || 0)}
                                    required
                                />
                            </div>
                        </div>
                    )}
                </form>
            </Modal>
        </div>
    );
};
