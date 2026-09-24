import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    FileText,
    Coins,
    Image as ImageIcon,
    Activity,
    Edit2,
    Save,
    Trash2,
    Plus,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Clock,
    Lock,
    Unlock
} from 'lucide-react';
import {
    adminBookService,
    adminSeriesService,
    adminVolumeService,
    adminChapterService
} from '../../services/admin/adminServices';
import type { Book, BookSeries, Volume, Chapter, ChapterPricingModel, PricingModel } from '../../types';
import {
    PageHeader,
    StatusBadge,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner,
    Modal,
    ConfirmDialog,
    FileUploadDropzone
} from '../components/AdminUI';
import styles from './AdminBookDetail.module.css';
import uiStyles from '../components/AdminUI.module.css';

type TabType = 'overview' | 'chapters' | 'pricing' | 'media' | 'activity';

export const AdminBookDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [book, setBook] = useState<Book | null>(null);
    const [series, setSeries] = useState<BookSeries | null>(null);
    const [volume, setVolume] = useState<Volume | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Edit Metadata Form State (Overview Tab)
    const [formTitle, setFormTitle] = useState('');
    const [formJapaneseTitle, setFormJapaneseTitle] = useState('');
    const [formSummary, setFormSummary] = useState('');
    const [formLanguage, setFormLanguage] = useState('English');
    const [formAuthor, setFormAuthor] = useState('');
    const [formArtist, setFormArtist] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formGenres, setFormGenres] = useState<string[]>([]);
    const [formTags, setFormTags] = useState<string[]>([]);

    // Edit Pricing Form State (Pricing Tab)
    const [formPricingModel, setFormPricingModel] = useState<PricingModel>('PER_CHAPTER');
    const [formCoinPrice, setFormCoinPrice] = useState(0);
    const [formDefaultChapterCoinCost, setFormDefaultChapterCoinCost] = useState(2);
    const [formFreeChapters, setFormFreeChapters] = useState(2);
    const [formIsPremium, setFormIsPremium] = useState(false);

    // Media Form State (Media Tab)
    const [formCover, setFormCover] = useState('');
    const [formBanner, setFormBanner] = useState('');
    const [formThumbnail, setFormThumbnail] = useState('');

    // Chapter Modal
    const [chapterModalOpen, setChapterModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [chTitle, setChTitle] = useState('');
    const [chNo, setChNo] = useState(1);
    const [chAccessType, setChAccessType] = useState<ChapterPricingModel>('FREE');
    const [chCost, setChCost] = useState(0);

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<'book' | Chapter | null>(null);

    const loadBookData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const b = await adminBookService.getById(id);
            if (!b) {
                setErrorMessage('Book not found.');
                setLoading(false);
                return;
            }
            setBook(b);
            setFormTitle(b.title);
            setFormJapaneseTitle(b.japanese_title || '');
            setFormSummary(b.summary || '');
            setFormLanguage(b.language || 'English');
            setFormAuthor(b.author || '');
            setFormArtist(b.artist || '');
            setFormCategory(b.category || 'Shonen');
            setFormGenres(b.genres || []);
            setFormTags(b.tags || []);
            setFormPricingModel(b.pricing_model || 'PER_CHAPTER');
            setFormCoinPrice(b.coin_price || 0);
            setFormDefaultChapterCoinCost(b.default_chapter_coin_cost ?? b.defaultChapterCoinCost ?? 2);
            setFormFreeChapters(b.default_free_chapters || 0);
            setFormIsPremium(Boolean(b.is_premium));
            setFormCover(b.cover_image || '');
            setFormBanner(b.banner_image || '');
            setFormThumbnail(b.thumbnail_image || '');

            const [s, vList, cList] = await Promise.all([
                adminSeriesService.getById(b.series_id),
                b.volume_id ? adminVolumeService.getById(b.volume_id) : Promise.resolve(undefined),
                adminChapterService.getAll({ bookId: b.id })
            ]);

            setSeries(s || null);
            setVolume(vList || null);
            setChapters(cList);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to load book workspace.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookData();
    }, [id]);

    // Save Overview Metadata
    const handleSaveOverview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSaving(true);
        try {
            const updated = await adminBookService.update(id, {
                title: formTitle,
                japanese_title: formJapaneseTitle,
                summary: formSummary,
                language: formLanguage,
                author: formAuthor,
                artist: formArtist,
                category: formCategory,
                genres: formGenres,
                tags: formTags
            });
            setBook(updated);
            setSuccessMessage('Book overview metadata saved successfully.');
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save metadata.');
        } finally {
            setSaving(false);
        }
    };

    // Save Pricing Defaults
    const handleSavePricing = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSaving(true);
        try {
            const updated = await adminBookService.update(id, {
                pricing_model: formPricingModel,
                coin_price: Number(formCoinPrice),
                default_chapter_coin_cost: Number(formDefaultChapterCoinCost),
                default_free_chapters: Number(formFreeChapters),
                is_premium: formIsPremium
            });
            setBook(updated);
            setSuccessMessage('Book pricing configuration saved.');
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update pricing.');
        } finally {
            setSaving(false);
        }
    };

    // Save Media
    const handleSaveMedia = async () => {
        if (!id) return;
        setSaving(true);
        try {
            const updated = await adminBookService.update(id, {
                cover_image: formCover,
                banner_image: formBanner,
                thumbnail_image: formThumbnail
            });
            setBook(updated);
            setSuccessMessage('Media artwork assets updated.');
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update media.');
        } finally {
            setSaving(false);
        }
    };

    // Chapter Modal Handlers
    const openCreateChapter = () => {
        setEditingChapter(null);
        setChNo(chapters.length + 1);
        setChTitle(`Chapter ${chapters.length + 1}`);
        setChAccessType(chapters.length < formFreeChapters ? 'FREE' : 'PAID');
        setChCost(formDefaultChapterCoinCost || 2);
        setChapterModalOpen(true);
    };

    const openEditChapter = (ch: Chapter) => {
        setEditingChapter(ch);
        setChNo(ch.chapterNumber ?? ch.chapter_no);
        setChTitle(ch.title);
        const pModel = (ch.pricingModel || ch.pricing_model || ch.access_type || 'FREE') as ChapterPricingModel;
        setChAccessType(pModel === 'PAID' ? 'PAID' : 'FREE');
        setChCost(ch.coinCost ?? ch.coin_cost ?? formDefaultChapterCoinCost ?? 2);
        setChapterModalOpen(true);
    };

    const handleSaveChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        try {
            if (editingChapter) {
                await adminChapterService.update(editingChapter.id, {
                    bookId: id,
                    chapterNumber: Number(chNo),
                    chapter_no: Number(chNo),
                    title: chTitle,
                    pricingModel: chAccessType,
                    access_type: chAccessType,
                    coinCost: chAccessType === 'FREE' ? 0 : Number(chCost),
                    coin_cost: chAccessType === 'FREE' ? 0 : Number(chCost)
                });
                setSuccessMessage(`Chapter "${chTitle}" updated.`);
            } else {
                await adminChapterService.create({
                    bookId: id,
                    book_id: id,
                    chapterNumber: Number(chNo),
                    chapter_no: Number(chNo),
                    title: chTitle,
                    pricingModel: chAccessType,
                    access_type: chAccessType,
                    coinCost: chAccessType === 'FREE' ? 0 : Number(chCost),
                    coin_cost: chAccessType === 'FREE' ? 0 : Number(chCost),
                    published: true
                });
                setSuccessMessage(`Chapter "${chTitle}" created.`);
            }
            setChapterModalOpen(false);
            loadBookData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save chapter.');
        }
    };

    // Delete confirmation
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget === 'book' && id) {
                await adminBookService.delete(id);
                navigate(series ? `/admin/series/${series.id}` : '/admin/series');
            } else if (typeof deleteTarget === 'object' && 'title' in deleteTarget) {
                const ch = deleteTarget as Chapter;
                await adminChapterService.delete(ch.id);
                setSuccessMessage(`Chapter "${ch.title}" deleted.`);
                loadBookData();
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Deletion failed.');
        } finally {
            setDeleteTarget(null);
        }
    };

    if (loading) {
        return <LoadingState message="Loading book workspace..." />;
    }

    if (!book) {
        return (
            <EmptyState
                title="Book not found"
                description="The requested book does not exist or has been removed."
                action={
                    <button className={uiStyles.btnSecondary} onClick={() => navigate('/admin/series')}>
                        Back to Catalog
                    </button>
                }
            />
        );
    }

    return (
        <div>
            {/* Header with Hierarchy Context */}
            <div style={{ marginBottom: '16px' }}>
                <button
                    className={uiStyles.btnSecondary}
                    onClick={() => navigate(series ? `/admin/series/${series.id}` : '/admin/series')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                >
                    <ArrowLeft size={14} /> Back to {series?.title || 'Series'}
                </button>
            </div>

            <PageHeader
                title={book.title}
                subtitle={`${series?.title ? `Franchise: ${series.title}` : ''} ${volume ? `• Vol. ${volume.volumeNumber ?? (volume as any).volume_number}: ${volume.title}` : '• Standalone Book'}`}
                breadcrumbs={[
                    { label: 'Admin', path: '/admin' },
                    { label: series?.title || 'Series', path: series ? `/admin/series/${series.id}` : '/admin/series' },
                    { label: book.title }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={uiStyles.btnSecondary}
                            onClick={() => navigate(`/admin/chapters?bookId=${book.id}`)}
                        >
                            <FileText size={14} /> Manage Chapter PDFs
                        </button>
                        <button
                            className={uiStyles.btnDanger}
                            onClick={() => setDeleteTarget('book')}
                        >
                            <Trash2 size={14} /> Delete Book
                        </button>
                    </div>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Quick KPI Banner */}
            <div className={styles.kpiBanner}>
                <div className={styles.kpiItem}>
                    <div className={styles.kpiLabel}>Status</div>
                    <div className={styles.kpiValue}>
                        <StatusBadge status={book.status} type={book.status === 'PUBLISHED' ? 'success' : 'warning'} />
                    </div>
                </div>
                <div className={styles.kpiItem}>
                    <div className={styles.kpiLabel}>Monetization Model</div>
                    <div className={styles.kpiValue} style={{ color: '#ffd700', fontWeight: 700 }}>
                        {book.pricing_model || 'PER_CHAPTER'}
                    </div>
                </div>
                <div className={styles.kpiItem}>
                    <div className={styles.kpiLabel}>Total Chapters</div>
                    <div className={styles.kpiValue}>{chapters.length}</div>
                </div>
                <div className={styles.kpiItem}>
                    <div className={styles.kpiLabel}>Default Chapter Cost</div>
                    <div className={styles.kpiValue} style={{ color: '#ffd700' }}>
                        🪙 {formDefaultChapterCoinCost} Coins
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabBar}>
                <button
                    className={`${styles.tabItem} ${activeTab === 'overview' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <BookOpen size={16} /> Overview
                </button>
                <button
                    className={`${styles.tabItem} ${activeTab === 'chapters' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('chapters')}
                >
                    <FileText size={16} /> Chapters & PDFs ({chapters.length})
                </button>
                <button
                    className={`${styles.tabItem} ${activeTab === 'pricing' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('pricing')}
                >
                    <Coins size={16} /> Pricing Defaults
                </button>
                <button
                    className={`${styles.tabItem} ${activeTab === 'media' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('media')}
                >
                    <ImageIcon size={16} /> Media & Covers
                </button>
                <button
                    className={`${styles.tabItem} ${activeTab === 'activity' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    <Activity size={16} /> Audit Timeline
                </button>
            </div>

            {/* ============================================================ */}
            {/* TAB 1: OVERVIEW */}
            {/* ============================================================ */}
            {activeTab === 'overview' && (
                <div className={styles.tabContentCard}>
                    <form onSubmit={handleSaveOverview}>
                        <div className={uiStyles.formGrid}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Book Title (English / Display) *</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Japanese Title (Romaji / Kanji)</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formJapaneseTitle}
                                    onChange={(e) => setFormJapaneseTitle(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Summary / Synopsis</label>
                            <textarea
                                className={uiStyles.formTextarea}
                                rows={4}
                                value={formSummary}
                                onChange={(e) => setFormSummary(e.target.value)}
                            />
                        </div>

                        <div className={uiStyles.formGrid}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Author (Original Story)</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formAuthor}
                                    onChange={(e) => setFormAuthor(e.target.value)}
                                />
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Artist (Illustration)</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formArtist}
                                    onChange={(e) => setFormArtist(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={uiStyles.formGrid}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Target Demographic / Category</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                />
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Language</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formLanguage}
                                    onChange={(e) => setFormLanguage(e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="submit" className={uiStyles.btnPrimary} disabled={saving}>
                            <Save size={14} /> {saving ? 'Saving...' : 'Save Overview Metadata'}
                        </button>
                    </form>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: CHAPTERS & CONTENT */}
            {/* ============================================================ */}
            {activeTab === 'chapters' && (
                <div className={styles.tabContentCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Chapter & PDF Content</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Each chapter holds a single PDF asset and monetization unlock rule</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={uiStyles.btnSecondary} onClick={() => navigate(`/admin/chapters?bookId=${book.id}`)}>
                                Manage All in Chapters Screen
                            </button>
                            <button className={uiStyles.btnPrimary} onClick={openCreateChapter}>
                                <Plus size={14} /> New Chapter
                            </button>
                        </div>
                    </div>

                    <div className={uiStyles.tableWrapper}>
                        <table className={uiStyles.dataTable}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>PDF Asset</th>
                                    <th>Pricing</th>
                                    <th>Unlock Cost</th>
                                    <th>Content Status</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chapters.map((ch) => {
                                    const pModel = ch.pricingModel || ch.pricing_model || ch.access_type || 'FREE';
                                    const isPaid = pModel === 'PAID';
                                    const cost = ch.coinCost ?? ch.coin_cost ?? 0;
                                    const pdfName = ch.pdfFileName || ch.pdf_file_name;
                                    const pdfPages = ch.pdfPageCount ?? ch.pdf_page_count;
                                    const contentStatus = ch.contentStatus || ch.content_status || (pdfName ? 'READY' : 'PENDING');

                                    return (
                                        <tr key={ch.id}>
                                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                                Ch. {ch.chapterNumber ?? ch.chapter_no}
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ch.title}</span>
                                            </td>
                                            <td>
                                                {pdfName ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
                                                        <FileText size={14} /> {pdfName} ({pdfPages || 0} pgs)
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#f59e0b', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <AlertCircle size={13} /> No PDF uploaded
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {isPaid ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffd700', fontSize: '12px', fontWeight: 700 }}>
                                                        <Lock size={12} /> PAID
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2ecc71', fontSize: '12px', fontWeight: 700 }}>
                                                        <Unlock size={12} /> FREE
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {cost > 0 ? (
                                                    <StatusBadge status={`${cost} Coins`} type="coin" />
                                                ) : (
                                                    <span style={{ color: '#10b981', fontWeight: 700 }}>FREE</span>
                                                )}
                                            </td>
                                            <td>
                                                {contentStatus === 'READY' ? (
                                                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle2 size={13} /> READY
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={13} /> PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={ch.published !== false ? 'PUBLISHED' : 'DRAFT'}
                                                    type={ch.published !== false ? 'success' : 'warning'}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <button
                                                        className={uiStyles.btnIcon}
                                                        title="Edit Chapter"
                                                        onClick={() => openEditChapter(ch)}
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        className={uiStyles.btnIcon}
                                                        title="Read / Preview"
                                                        onClick={() => navigate(`/reader/${book.id}/${ch.id}`)}
                                                    >
                                                        <ExternalLink size={13} />
                                                    </button>
                                                    <button
                                                        className={uiStyles.btnIcon}
                                                        style={{ color: '#ef4444' }}
                                                        title="Delete Chapter"
                                                        onClick={() => setDeleteTarget(ch)}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: PRICING */}
            {/* ============================================================ */}
            {activeTab === 'pricing' && (
                <div className={styles.tabContentCard}>
                    <form onSubmit={handleSavePricing}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Default Pricing Model</label>
                            <select
                                className={uiStyles.formSelect}
                                value={formPricingModel}
                                onChange={(e) => setFormPricingModel(e.target.value as PricingModel)}
                            >
                                <option value="FREE">FREE</option>
                                <option value="PER_CHAPTER">PER_CHAPTER</option>
                                <option value="PER_BOOK">PER_BOOK</option>
                                <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                            </select>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Chapters inherit this monetization model unless explicitly overridden per chapter.
                            </p>
                        </div>

                        <div className={uiStyles.formGrid}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Default Chapter Unlock Cost (Coins)</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={uiStyles.formInput}
                                    value={formDefaultChapterCoinCost}
                                    onChange={(e) => setFormDefaultChapterCoinCost(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Initial Free Chapters</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={uiStyles.formInput}
                                    value={formFreeChapters}
                                    onChange={(e) => setFormFreeChapters(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Whole-Book Coin Price (Optional)</label>
                            <input
                                type="number"
                                min={0}
                                className={uiStyles.formInput}
                                value={formCoinPrice}
                                onChange={(e) => setFormCoinPrice(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <button type="submit" className={uiStyles.btnPrimary} disabled={saving}>
                            <Save size={14} /> {saving ? 'Saving...' : 'Save Pricing Configuration'}
                        </button>
                    </form>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: MEDIA */}
            {/* ============================================================ */}
            {activeTab === 'media' && (
                <div className={styles.tabContentCard}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        <FileUploadDropzone
                            label="Cover Artwork"
                            currentUrl={formCover}
                            onFileSelected={(url) => setFormCover(url)}
                        />
                        <FileUploadDropzone
                            label="Banner Artwork"
                            currentUrl={formBanner}
                            onFileSelected={(url) => setFormBanner(url)}
                        />
                        <FileUploadDropzone
                            label="Thumbnail Image"
                            currentUrl={formThumbnail}
                            onFileSelected={(url) => setFormThumbnail(url)}
                        />
                    </div>

                    <button className={uiStyles.btnPrimary} onClick={handleSaveMedia} disabled={saving}>
                        <Save size={14} /> {saving ? 'Saving...' : 'Save Media Artwork'}
                    </button>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 5: ACTIVITY */}
            {/* ============================================================ */}
            {activeTab === 'activity' && (
                <div className={styles.tabContentCard}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                        Book Audit Timeline
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px' }} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Book Created</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(book.created_at).toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginTop: '6px' }} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Published Status: {book.status}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(book.updated_at || book.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chapter Modal */}
            <Modal
                isOpen={chapterModalOpen}
                onClose={() => setChapterModalOpen(false)}
                title={editingChapter ? `Edit Chapter ${editingChapter.chapterNumber ?? editingChapter.chapter_no}` : 'Create New Chapter'}
                footer={
                    <>
                        <button className={uiStyles.btnSecondary} onClick={() => setChapterModalOpen(false)}>Cancel</button>
                        <button className={uiStyles.btnPrimary} onClick={handleSaveChapter}>Save Chapter</button>
                    </>
                }
            >
                <form onSubmit={handleSaveChapter}>
                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Chapter Number *</label>
                            <input
                                type="number"
                                min={1}
                                className={uiStyles.formInput}
                                value={chNo}
                                onChange={(e) => setChNo(parseInt(e.target.value) || 1)}
                                required
                            />
                        </div>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Pricing Model</label>
                            <select
                                className={uiStyles.formSelect}
                                value={chAccessType}
                                onChange={(e) => {
                                    const val = e.target.value as ChapterPricingModel;
                                    setChAccessType(val);
                                    if (val === 'FREE') setChCost(0);
                                    else if (chCost === 0) setChCost(formDefaultChapterCoinCost || 2);
                                }}
                            >
                                <option value="FREE">FREE</option>
                                <option value="PAID">PAID</option>
                            </select>
                        </div>
                    </div>

                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Title *</label>
                        <input
                            type="text"
                            className={uiStyles.formInput}
                            value={chTitle}
                            onChange={(e) => setChTitle(e.target.value)}
                            required
                        />
                    </div>

                    {chAccessType === 'PAID' && (
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Chapter Unlock Cost (Coins) *</label>
                            <input
                                type="number"
                                min={1}
                                className={uiStyles.formInput}
                                value={chCost}
                                onChange={(e) => setChCost(parseInt(e.target.value) || 1)}
                                required
                            />
                        </div>
                    )}
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title={deleteTarget === 'book' ? 'Delete Book' : 'Delete Chapter'}
                message={
                    deleteTarget === 'book'
                        ? `Are you sure you want to delete "${book.title}"? All chapters and associated content will also be permanently deleted.`
                        : `Are you sure you want to delete chapter "${(deleteTarget as Chapter)?.title}"?`
                }
                confirmText={deleteTarget === 'book' ? 'Delete Book' : 'Delete Chapter'}
            />
        </div>
    );
};
