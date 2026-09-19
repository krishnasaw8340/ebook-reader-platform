import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    FileText,
    FileImage,
    Coins,
    Image as ImageIcon,
    Activity,
    Edit2,
    Save,
    Trash2,
    Plus,
    ExternalLink,
    CheckCircle2,
    UploadCloud,
    Archive
} from 'lucide-react';
import {
    adminBookService,
    adminSeriesService,
    adminVolumeService,
    adminChapterService,
    adminPageService
} from '../../services/admin/adminServices';
import type { Book, BookSeries, Volume, Chapter, Page } from '../../types';
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

type TabType = 'overview' | 'chapters' | 'pages' | 'pricing' | 'media' | 'activity';

export const AdminBookDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [book, setBook] = useState<Book | null>(null);
    const [series, setSeries] = useState<BookSeries | null>(null);
    const [volume, setVolume] = useState<Volume | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapterId, setSelectedChapterId] = useState<string>('');
    const [pages, setPages] = useState<Page[]>([]);

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
    const [formPricingModel, setFormPricingModel] = useState<any>('PER_CHAPTER');
    const [formCoinPrice, setFormCoinPrice] = useState(0);
    const [formCoinsPerPage, setFormCoinsPerPage] = useState(0);
    const [formFreeChapters, setFormFreeChapters] = useState(2);
    const [formFreePages, setFormFreePages] = useState(5);
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
    const [chAccessType, setChAccessType] = useState<'FREE' | 'PARTIAL' | 'PARTIAL_FREE' | 'PAID'>('FREE');
    const [chCost, setChCost] = useState(0);
    const [chFreePages, setChFreePages] = useState(1);

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<'book' | Chapter | Page | null>(null);

    // Page preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const pageUploadRef = useRef<HTMLInputElement>(null);

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
            setFormCoinsPerPage(b.default_coins_per_page || 0);
            setFormFreeChapters(b.default_free_chapters || 0);
            setFormFreePages(b.default_free_pages || 0);
            setFormIsPremium(Boolean(b.is_premium));
            setFormCover(b.cover_image || '');
            setFormBanner(b.banner_image || '');
            setFormThumbnail(b.thumbnail_image || '');

            const [s, vList, cList] = await Promise.all([
                adminSeriesService.getById(b.series_id),
                b.volume_id ? adminVolumeService.getById(b.volume_id) : Promise.resolve(undefined),
                adminChapterService.getAll(b.id)
            ]);

            setSeries(s || null);
            setVolume(vList || null);
            setChapters(cList);

            if (cList.length > 0) {
                const targetChId = selectedChapterId || cList[0].id;
                setSelectedChapterId(targetChId);
                const pList = await adminPageService.getByChapter(targetChId);
                setPages(pList);
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to load book workspace.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookData();
    }, [id]);

    const handleSelectChapter = async (chapId: string) => {
        setSelectedChapterId(chapId);
        try {
            const pList = await adminPageService.getByChapter(chapId);
            setPages(pList);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to load chapter pages.');
        }
    };

    // Save Overview Metadata
    const handleSaveOverview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);
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
            setSuccessMessage('Book overview metadata updated.');
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
                default_coins_per_page: Number(formCoinsPerPage),
                default_free_chapters: Number(formFreeChapters),
                default_free_pages: Number(formFreePages),
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

    // Toggle Publishing Lifecycle
    const handleTogglePublish = async () => {
        if (!id) return;
        try {
            const updated = await adminBookService.togglePublish(id);
            setBook(updated);
            setSuccessMessage(`Book status changed to ${updated.status}.`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update publication status.');
        }
    };

    // Archive
    const handleArchiveBook = async () => {
        if (!id) return;
        try {
            const updated = await adminBookService.archive(id);
            setBook(updated);
            setSuccessMessage('Book archived from reader catalog.');
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to archive book.');
        }
    };

    // Chapter Modal Handlers
    const openCreateChapter = () => {
        setEditingChapter(null);
        setChNo(chapters.length + 1);
        setChTitle(`Chapter ${chapters.length + 1}: `);
        setChAccessType('FREE');
        setChCost(0);
        setChFreePages(1);
        setChapterModalOpen(true);
    };

    const openEditChapter = (ch: Chapter) => {
        setEditingChapter(ch);
        setChNo(ch.chapter_no);
        setChTitle(ch.title);
        setChAccessType(ch.access_type);
        setChCost(ch.coin_cost);
        setChFreePages(ch.free_pages);
        setChapterModalOpen(true);
    };

    const handleSaveChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        try {
            if (editingChapter) {
                await adminChapterService.update(editingChapter.id, {
                    chapter_no: Number(chNo),
                    title: chTitle,
                    access_type: chAccessType,
                    coin_cost: chAccessType === 'FREE' ? 0 : Number(chCost),
                    free_pages: Number(chFreePages)
                });
                setSuccessMessage(`Chapter "${chTitle}" updated.`);
            } else {
                await adminChapterService.create({
                    book_id: id,
                    chapter_no: Number(chNo),
                    title: chTitle,
                    access_type: chAccessType,
                    coin_cost: chAccessType === 'FREE' ? 0 : Number(chCost),
                    free_pages: Number(chFreePages)
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
                navigate('/admin/books');
            } else if ('chapter_no' in (deleteTarget as any)) {
                const ch = deleteTarget as Chapter;
                await adminChapterService.delete(ch.id);
                setSuccessMessage(`Chapter "${ch.title}" deleted.`);
                loadBookData();
            } else if ('page_no' in (deleteTarget as any)) {
                const pg = deleteTarget as Page;
                await adminPageService.delete(pg.id);
                setSuccessMessage(`Page ${pg.page_no} deleted.`);
                if (selectedChapterId) handleSelectChapter(selectedChapterId);
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Deletion failed.');
        } finally {
            setDeleteTarget(null);
        }
    };

    // Page batch upload
    const handlePageBatch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !selectedChapterId) return;
        const urls: string[] = [];
        for (let i = 0; i < files.length; i++) {
            urls.push(URL.createObjectURL(files[i]));
        }
        try {
            await adminPageService.uploadPages(selectedChapterId, urls);
            setSuccessMessage(`Uploaded ${urls.length} pages.`);
            handleSelectChapter(selectedChapterId);
        } catch (err: any) {
            setErrorMessage(err.message || 'Page upload failed.');
        }
    };

    if (loading) {
        return <LoadingState message="Loading book workspace..." />;
    }

    if (!book) {
        return (
            <EmptyState
                title="Book Not Found"
                description="The requested book does not exist or has been deleted."
                action={
                    <button className={uiStyles.btnPrimary} onClick={() => navigate('/admin/books')}>
                        Return to Books Catalog
                    </button>
                }
            />
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="Book Management Workspace"
                subtitle={`Admin control panel for: ${book.title}`}
                breadcrumbs={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    { label: 'Books', path: '/admin/books' },
                    ...(series ? [{ label: series.title || series.name || 'Series', path: `/admin/series/${series.id}` }] : []),
                    { label: book.title }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className={uiStyles.btnSecondary} onClick={() => navigate('/admin/books')}>
                            <ArrowLeft size={16} /> All Books
                        </button>
                        <button
                            className={uiStyles.btnSecondary}
                            onClick={() => navigate(`/book/${book.seriesId || book.series_id}`)}
                        >
                            <ExternalLink size={14} /> Reader View
                        </button>
                        <button
                            className={uiStyles.btnPrimary}
                            onClick={handleTogglePublish}
                        >
                            <CheckCircle2 size={14} />
                            {book.status === 'PUBLISHED' ? 'Unpublish to Draft' : 'Publish Book'}
                        </button>
                    </div>
                }
            />

            {errorMessage && <ErrorBanner message={errorMessage} />}
            {successMessage && <SuccessBanner message={successMessage} />}

            {/* Book Workspace Header Card */}
            <div className={styles.headerCard}>
                <img
                    src={book.cover_image || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=200'}
                    alt={book.title}
                    className={styles.coverThumb}
                />

                <div className={styles.headerInfo}>
                    <div className={styles.headerTitleRow}>
                        <h1 className={styles.bookTitle}>{book.title}</h1>
                        <StatusBadge status={book.status} />
                    </div>

                    {book.japanese_title && (
                        <div className={styles.japaneseTitle}>{book.japanese_title}</div>
                    )}

                    <div className={styles.metaRow}>
                        <div className={styles.metaItem}>
                            <span>Series:</span> <strong>{series?.title || 'Unassigned'}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Volume:</span> <strong>{volume ? `Vol. ${volume.volume_no}` : 'Direct Series (No Volume)'}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Language:</span> <strong>{book.language || 'English'}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Pricing:</span> <strong>{book.pricing_model || 'PER_CHAPTER'}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Chapters:</span> <strong>{chapters.length}</strong>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            className={uiStyles.btnSecondary}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={handleArchiveBook}
                        >
                            <Archive size={13} /> Archive Book
                        </button>
                        <button
                            className={uiStyles.btnSecondary}
                            style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444' }}
                            onClick={() => setDeleteTarget('book')}
                        >
                            <Trash2 size={13} /> Delete Book
                        </button>
                    </div>
                </div>
            </div>

            {/* Workspace Tab Bar */}
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
                    <FileText size={16} /> Chapters ({chapters.length})
                </button>
                <button
                    className={`${styles.tabItem} ${activeTab === 'pages' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('pages')}
                >
                    <FileImage size={16} /> Pages ({pages.length})
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
                    <ImageIcon size={16} /> Media Artwork
                </button>
                <button
                    className={`${styles.tabItem} ${activeTab === 'activity' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    <Activity size={16} /> Activity & Audit
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
                                <label className={uiStyles.formLabel}>Title *</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Japanese Title</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formJapaneseTitle}
                                    onChange={(e) => setFormJapaneseTitle(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={uiStyles.formGrid}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Author</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formAuthor}
                                    onChange={(e) => setFormAuthor(e.target.value)}
                                />
                            </div>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Artist / Illustrator</label>
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
                                <label className={uiStyles.formLabel}>Language</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formLanguage}
                                    onChange={(e) => setFormLanguage(e.target.value)}
                                />
                            </div>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Demographic</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Plot Summary / Synopsis</label>
                            <textarea
                                className={uiStyles.formTextarea}
                                rows={4}
                                value={formSummary}
                                onChange={(e) => setFormSummary(e.target.value)}
                            />
                        </div>

                        <button type="submit" className={uiStyles.btnPrimary} disabled={saving}>
                            <Save size={14} /> {saving ? 'Saving...' : 'Save Overview Metadata'}
                        </button>
                    </form>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: CHAPTERS */}
            {/* ============================================================ */}
            {activeTab === 'chapters' && (
                <div className={styles.tabContentCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Chapter Management</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure chapter numbers, coin unlock pricing, and access permissions</p>
                        </div>
                        <button className={uiStyles.btnPrimary} onClick={openCreateChapter}>
                            <Plus size={14} /> New Chapter
                        </button>
                    </div>

                    <div className={uiStyles.tableWrapper}>
                        <table className={uiStyles.dataTable}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Access Model</th>
                                    <th>Unlock Price</th>
                                    <th>Free Preview</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chapters.map((ch) => (
                                    <tr key={ch.id}>
                                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>Ch. {ch.chapter_no}</td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: '#ffffff' }}>{ch.title}</span>
                                        </td>
                                        <td>
                                            <StatusBadge status={ch.access_type} />
                                        </td>
                                        <td>
                                            {ch.coin_cost > 0 ? (
                                                <StatusBadge status={`${ch.coin_cost} Coins`} type="coin" />
                                            ) : (
                                                <span style={{ color: '#10b981', fontWeight: 700 }}>FREE</span>
                                            )}
                                        </td>
                                        <td>{ch.free_pages} page(s)</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                <button
                                                    className={uiStyles.btnSecondary}
                                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                                    onClick={() => {
                                                        setSelectedChapterId(ch.id);
                                                        setActiveTab('pages');
                                                    }}
                                                >
                                                    <FileImage size={12} /> Pages
                                                </button>
                                                <button
                                                    className={uiStyles.btnIcon}
                                                    title="Edit Chapter"
                                                    onClick={() => openEditChapter(ch)}
                                                >
                                                    <Edit2 size={13} />
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: PAGES */}
            {/* ============================================================ */}
            {activeTab === 'pages' && (
                <div className={styles.tabContentCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Chapter:</label>
                            <select
                                className={uiStyles.formSelect}
                                style={{ maxWidth: '300px' }}
                                value={selectedChapterId}
                                onChange={(e) => handleSelectChapter(e.target.value)}
                            >
                                {chapters.map(c => (
                                    <option key={c.id} value={c.id}>Ch. {c.chapter_no}: {c.title}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className={uiStyles.btnPrimary}
                            onClick={() => pageUploadRef.current?.click()}
                        >
                            <UploadCloud size={14} /> Batch Upload Pages
                        </button>
                    </div>

                    <input
                        type="file"
                        ref={pageUploadRef}
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePageBatch}
                    />

                    {pages.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: '12px'
                        }}>
                            {pages.map((p) => (
                                <div
                                    key={p.id}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, background: 'var(--primary)', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>
                                            PG {p.page_no}
                                        </span>
                                        <button
                                            className={uiStyles.btnIcon}
                                            style={{ width: '22px', height: '22px', color: '#ef4444' }}
                                            onClick={() => setDeleteTarget(p)}
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>

                                    <div
                                        style={{ height: '160px', background: '#0e0e11', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }}
                                        onClick={() => setPreviewUrl(p.image_url)}
                                    >
                                        <img src={p.image_url} alt={`Page ${p.page_no}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No pages uploaded"
                            description="Upload scans to populate this chapter."
                            action={
                                <button className={uiStyles.btnPrimary} onClick={() => pageUploadRef.current?.click()}>
                                    <UploadCloud size={14} /> Upload Pages
                                </button>
                            }
                        />
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: PRICING */}
            {/* ============================================================ */}
            {activeTab === 'pricing' && (
                <div className={styles.tabContentCard}>
                    <form onSubmit={handleSavePricing}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Default Pricing Model</label>
                            <select
                                className={uiStyles.formSelect}
                                value={formPricingModel}
                                onChange={(e) => setFormPricingModel(e.target.value)}
                            >
                                <option value="FREE">FREE</option>
                                <option value="PER_CHAPTER">PER_CHAPTER</option>
                                <option value="PER_PAGE">PER_PAGE</option>
                                <option value="PER_BOOK">PER_BOOK</option>
                                <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                            </select>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Applies as default to new chapters created for this book.
                            </p>
                        </div>

                        <div className={uiStyles.formGrid}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Book Coin Price</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={uiStyles.formInput}
                                    value={formCoinPrice}
                                    onChange={(e) => setFormCoinPrice(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Default Free Chapters</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={uiStyles.formInput}
                                    value={formFreeChapters}
                                    onChange={(e) => setFormFreeChapters(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <button type="submit" className={uiStyles.btnPrimary} disabled={saving}>
                            <Save size={14} /> {saving ? 'Saving...' : 'Save Pricing Configuration'}
                        </button>
                    </form>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 5: MEDIA */}
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
            {/* TAB 6: ACTIVITY */}
            {/* ============================================================ */}
            {activeTab === 'activity' && (
                <div className={styles.tabContentCard}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                        Book Audit Timeline
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px' }} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Book Created</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(book.created_at).toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginTop: '6px' }} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Published Status: {book.status}</div>
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
                title={editingChapter ? `Edit Chapter ${editingChapter.chapter_no}` : 'Create New Chapter'}
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
                            <label className={uiStyles.formLabel}>Access Model</label>
                            <select
                                className={uiStyles.formSelect}
                                value={chAccessType}
                                onChange={(e) => setChAccessType(e.target.value as any)}
                            >
                                <option value="FREE">FREE</option>
                                <option value="PARTIAL">PARTIAL FREE</option>
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

                    {chAccessType !== 'FREE' && (
                        <div className={uiStyles.formGrid}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Coin Cost</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={uiStyles.formInput}
                                    value={chCost}
                                    onChange={(e) => setChCost(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            {chAccessType === 'PARTIAL' && (
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Free Preview Pages</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={uiStyles.formInput}
                                        value={chFreePages}
                                        onChange={(e) => setChFreePages(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </Modal>

            {/* Page Preview Modal */}
            <Modal
                isOpen={!!previewUrl}
                onClose={() => setPreviewUrl(null)}
                title="Manga Page High-Res Preview"
            >
                {previewUrl && (
                    <div style={{ textAlign: 'center', background: '#000', padding: '12px', borderRadius: '8px' }}>
                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
                    </div>
                )}
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete Permanently"
            />
        </div>
    );
};
