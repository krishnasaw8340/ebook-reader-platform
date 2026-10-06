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
    Unlock,
    Sparkles,
    UploadCloud,
    Globe,
    Tag,
    ChevronRight
} from 'lucide-react';
import {
    adminBookService,
    adminSeriesService,
    adminVolumeService,
    adminChapterService
} from '../../services/admin/adminServices';
import { chapterService } from '../../services/chapterService';
import { storeChapterPdf } from '../../utils/pdfStorage';
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
import { BookCoverUploader } from './BookCoverUploader';
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
            setFormCover(b.coverUrl || '');

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

    const handleChapterPdfUpload = async (ch: Chapter, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSaving(true);
        try {
            await storeChapterPdf(ch.id, file, file.name);
            await adminChapterService.update(ch.id, {
                pdfFileName: file.name,
                pdfFileSize: file.size,
                contentStatus: 'READY'
            });
            try {
                const { uploadUrl, key } = await chapterService.getUploadUrl(ch.id, {
                    fileName: file.name,
                    fileSize: file.size,
                    contentType: file.type || 'application/pdf',
                });
                await chapterService.uploadPdfToS3(uploadUrl, file);
                await chapterService.uploadComplete(ch.id, {
                    key,
                    fileSize: file.size,
                    pageCount: ch.pdfPageCount || 30
                });
            } catch (s3Err) {
                console.warn('S3 remote sync notice:', s3Err);
            }
            setSuccessMessage(`PDF "${file.name}" attached successfully to Chapter ${ch.chapterNumber ?? ch.chapter_no}. Ready for reader.`);
            loadBookData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to attach PDF.');
        } finally {
            setSaving(false);
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
        <div className={styles.container}>
            {/* Header with Hierarchy Context */}
            <div className={styles.backNavRow}>
                <button
                    className={styles.backBtn}
                    onClick={() => navigate(series ? `/admin/series/${series.id}` : '/admin/series')}
                >
                    <ArrowLeft size={14} /> Back to {series?.title || 'Series'}
                </button>
                <div className={styles.breadcrumbPath}>
                    <span className={styles.breadcrumbLink} onClick={() => navigate('/admin')}>Admin</span>
                    <ChevronRight size={12} />
                    <span className={styles.breadcrumbLink} onClick={() => navigate('/admin/series')}>Catalog</span>
                    {series && (
                        <>
                            <ChevronRight size={12} />
                            <span className={styles.breadcrumbLink} onClick={() => navigate(`/admin/series/${series.id}`)}>{series.title}</span>
                        </>
                    )}
                    <ChevronRight size={12} />
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{book.title}</span>
                </div>
            </div>

            {/* Book Hero Card */}
            <div className={styles.heroCard}>
                <div
                    className={styles.coverContainer}
                    onClick={() => setActiveTab('media')}
                    title="Click to view or upload cover artwork"
                >
                    {book.coverUrl || book.cover_image || book.coverImage ? (
                        <img
                            src={book.coverUrl || book.cover_image || book.coverImage || ''}
                            alt={book.title}
                            className={styles.coverThumb}
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className={styles.coverPlaceholder}>
                            <ImageIcon size={26} />
                            <span>Upload Cover</span>
                        </div>
                    )}
                    <div className={styles.coverOverlay}>
                        <UploadCloud size={16} />
                        <span>Change</span>
                    </div>
                </div>

                <div className={styles.heroContent}>
                    <div className={styles.heroTopRow}>
                        <div className={styles.heroBadges}>
                            {series && (
                                <span
                                    className={styles.seriesBadge}
                                    onClick={() => navigate(`/admin/series/${series.id}`)}
                                    title="View parent series"
                                >
                                    📁 {series.title}
                                </span>
                            )}
                            {volume && (
                                <span className={styles.volumeBadge}>
                                    Vol. {volume.volumeNumber ?? (volume as any).volume_number}: {volume.title}
                                </span>
                            )}
                            <StatusBadge status={book.status} type={book.status === 'PUBLISHED' ? 'success' : 'warning'} />
                            {book.is_premium && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                                    <Sparkles size={11} /> Premium
                                </span>
                            )}
                        </div>

                        <div className={styles.heroActions}>
                            {chapters.length > 0 && (
                                <button
                                    className={uiStyles.btnSecondary}
                                    onClick={() => navigate(`/reader/${book.id}/${chapters[0].id}`)}
                                    title="Preview in Manga Reader"
                                >
                                    <ExternalLink size={14} /> Read Book
                                </button>
                            )}
                            <button
                                className={uiStyles.btnPrimary}
                                onClick={() => navigate(`/admin/chapters?bookId=${book.id}`)}
                            >
                                <FileText size={14} /> Manage Chapter PDFs
                            </button>
                            <button
                                className={uiStyles.btnDanger}
                                onClick={() => setDeleteTarget('book')}
                                title="Delete this book"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>

                    <div className={styles.heroTitleGroup}>
                        <h1 className={styles.bookTitle}>{book.title}</h1>
                        {book.japanese_title && (
                            <div className={styles.japaneseTitle}>{book.japanese_title}</div>
                        )}
                    </div>

                    <div className={styles.heroMetaChips}>
                        <span className={styles.metaChip}>
                            <Tag size={12} /> {book.category || 'Manga'}
                        </span>
                        <span className={styles.metaChip}>
                            <Globe size={12} /> {book.language || 'English'}
                        </span>
                        {(book.author || book.artist) && (
                            <span className={styles.metaChip}>
                                By {book.author || 'Unknown'} {book.artist ? `· Art by ${book.artist}` : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Quick KPI Stat Cards Grid */}
            <div className={styles.kpiBanner}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ color: book.status === 'PUBLISHED' ? '#10b981' : '#f59e0b' }}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div className={styles.kpiTextGroup}>
                        <div className={styles.kpiLabel}>Catalog Status</div>
                        <div className={styles.kpiValue}>{book.status}</div>
                        <div className={styles.kpiSub}>
                            {book.status === 'PUBLISHED' ? 'Live in Reader Storefront' : 'Draft / Unpublished'}
                        </div>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ color: '#ffd700' }}>
                        <Coins size={20} />
                    </div>
                    <div className={styles.kpiTextGroup}>
                        <div className={styles.kpiLabel}>Monetization Model</div>
                        <div className={styles.kpiValue}>{book.pricing_model || 'PER_CHAPTER'}</div>
                        <div className={styles.kpiSub}>
                            {book.pricing_model === 'FREE' ? 'Entire volume free' : 'Chapter coin unlocks'}
                        </div>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ color: '#38bdf8' }}>
                        <FileText size={20} />
                    </div>
                    <div className={styles.kpiTextGroup}>
                        <div className={styles.kpiLabel}>Total Chapters</div>
                        <div className={styles.kpiValue}>{chapters.length} Chapter{chapters.length === 1 ? '' : 's'}</div>
                        <div className={styles.kpiSub}>
                            {chapters.filter(c => c.pdfFileName || (c as any).pdf_file_name).length} PDF asset{chapters.filter(c => c.pdfFileName || (c as any).pdf_file_name).length === 1 ? '' : 's'} linked
                        </div>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconWrap} style={{ color: '#a855f7' }}>
                        {formDefaultChapterCoinCost > 0 ? <Lock size={20} /> : <Unlock size={20} />}
                    </div>
                    <div className={styles.kpiTextGroup}>
                        <div className={styles.kpiLabel}>Default Chapter Price</div>
                        <div className={styles.kpiValue}>
                            {formDefaultChapterCoinCost > 0 ? `🪙 ${formDefaultChapterCoinCost} Coins` : 'FREE (0 Coins)'}
                        </div>
                        <div className={styles.kpiSub}>
                            {formFreeChapters > 0 ? `${formFreeChapters} initial free chapters` : 'All chapters charged'}
                        </div>
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
                    <FileText size={16} /> Chapters & PDFs
                    <span className={styles.tabCounter}>{chapters.length}</span>
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
                        <div className={styles.formSectionCard}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h3 className={styles.sectionTitle}>
                                        <BookOpen size={16} /> Core Book Information
                                    </h3>
                                    <p className={styles.sectionSubtitle}>Primary display titles and synopsis</p>
                                </div>
                            </div>

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
                                        placeholder="e.g. 進撃の巨人"
                                        value={formJapaneseTitle}
                                        onChange={(e) => setFormJapaneseTitle(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={uiStyles.formGroup} style={{ marginTop: '12px' }}>
                                <label className={uiStyles.formLabel}>Summary / Synopsis</label>
                                <textarea
                                    className={uiStyles.formTextarea}
                                    rows={4}
                                    placeholder="Enter book synopsis or summary..."
                                    value={formSummary}
                                    onChange={(e) => setFormSummary(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.formSectionCard}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h3 className={styles.sectionTitle}>
                                        <Tag size={16} /> Credits & Classification
                                    </h3>
                                    <p className={styles.sectionSubtitle}>Creator credits, target demographic, and language</p>
                                </div>
                            </div>

                            <div className={uiStyles.formGrid}>
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Author (Original Story)</label>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        placeholder="e.g. Hajime Isayama"
                                        value={formAuthor}
                                        onChange={(e) => setFormAuthor(e.target.value)}
                                    />
                                </div>

                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Artist (Illustration)</label>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        placeholder="e.g. Hajime Isayama"
                                        value={formArtist}
                                        onChange={(e) => setFormArtist(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={uiStyles.formGrid} style={{ marginTop: '12px' }}>
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Target Demographic / Category</label>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        placeholder="e.g. Manga, Shonen, Seinen"
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
                        </div>

                        <div className={styles.formActionRow}>
                            <button type="submit" className={uiStyles.btnPrimary} disabled={saving}>
                                <Save size={14} /> {saving ? 'Saving Changes...' : 'Save Overview Metadata'}
                            </button>
                        </div>
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    {pdfName ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
                                                            <FileText size={14} /> {pdfName}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#f59e0b', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <AlertCircle size={13} /> No PDF file
                                                        </span>
                                                    )}
                                                    <label 
                                                        style={{ 
                                                            cursor: 'pointer', 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            gap: '4px', 
                                                            fontSize: '11px', 
                                                            fontWeight: 600,
                                                            padding: '3px 8px', 
                                                            borderRadius: '4px', 
                                                            background: 'var(--color-surface-hover)', 
                                                            border: '1px solid var(--color-border)',
                                                            color: 'var(--color-text-primary)'
                                                        }}
                                                        title="Attach PDF file to this chapter"
                                                    >
                                                        <UploadCloud size={11} /> {pdfName ? 'Replace PDF' : 'Upload PDF'}
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            style={{ display: 'none' }}
                                                            onChange={(e) => handleChapterPdfUpload(ch, e)}
                                                        />
                                                    </label>
                                                </div>
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
                    <BookCoverUploader
                        bookId={book.id}
                        coverUrl={book.coverUrl || book.cover_image || (book as any).coverImage}
                        fileName={book.coverFileName}
                        fileSize={book.coverFileSize}
                        onUploaded={(updated) => {
                            setBook(updated);
                            setFormCover(updated.coverUrl || updated.cover_image || '');
                        }}
                        onSuccess={(m) => { setErrorMessage(null); setSuccessMessage(m); }}
                        onError={(m) => { setSuccessMessage(null); setErrorMessage(m); }}
                    />
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 5: ACTIVITY */}
            {/* ============================================================ */}
            {activeTab === 'activity' && (
                <div className={styles.tabContentCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>
                                <Activity size={16} /> Book Audit Timeline
                            </h3>
                            <p className={styles.sectionSubtitle}>Lifecycle changes and publication events</p>
                        </div>
                    </div>

                    <div className={styles.timeline}>
                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot} />
                            <div className={styles.timelineTitle}>Book Created & Cataloged</div>
                            <div className={styles.timelineDate}>{new Date(book.created_at).toLocaleString()}</div>
                        </div>

                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot} style={{ background: book.status === 'PUBLISHED' ? '#10b981' : '#f59e0b' }} />
                            <div className={styles.timelineTitle}>Status: {book.status}</div>
                            <div className={styles.timelineDate}>{new Date(book.updated_at || book.created_at).toLocaleString()}</div>
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
