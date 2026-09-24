import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Plus,
    X,
    FolderKanban,
    Layers,
    FileText,
    UploadCloud,
    Trash2,
    ChevronUp,
    ChevronDown,
    Copy,
    Save
} from 'lucide-react';
import {
    adminSeriesService,
    adminVolumeService,
    adminBookService,
    adminChapterService
} from '../../services/admin/adminServices';
import type { BookSeries, Volume, PricingModel } from '../../types';
import {
    PageHeader,
    FileUploadDropzone,
    Modal,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from './BookWizard.module.css';
import uiStyles from '../components/AdminUI.module.css';

const STEPS = [
    { number: 1, title: 'Series' },
    { number: 2, title: 'Volume' },
    { number: 3, title: 'Book Info' },
    { number: 4, title: 'Pricing' },
    { number: 5, title: 'Chapters' },
    { number: 6, title: 'Chapter PDFs' },
    { number: 7, title: 'Review & Publish' }
];

const AVAILABLE_GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Supernatural', 'Thriller', 'Martial Arts', 'Cyberpunk', 'Isekai'
];

const AVAILABLE_TAGS = [
    'Underground', 'Tournament', 'High Stakes', 'Revenge', 'Magic System',
    'Dystopian', 'Netrunner', 'Valkyrie', 'Demons', 'AI Takeover', 'School Life'
];

const AVAILABLE_LANGUAGES = [
    'English', 'Japanese', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Korean'
];

const AVAILABLE_CATEGORIES = [
    'Shonen', 'Seinen', 'Shojo', 'Josei', 'Kodomo', 'Webtoon', 'Manga'
];

export const BookWizard: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Existing Series & Volumes data
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [volumesList, setVolumesList] = useState<Volume[]>([]);

    // STEP 1 — SERIES STATE
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [isCreatingSeries, setIsCreatingSeries] = useState(false);
    const [newSeriesTitle, setNewSeriesTitle] = useState('');
    const [newSeriesDesc, setNewSeriesDesc] = useState('');
    const [newSeriesCover, setNewSeriesCover] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&width=800');

    // STEP 2 — VOLUME STATE
    const [volumeChoice, setVolumeChoice] = useState<'none' | 'existing' | 'new'>('none');
    const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
    const [newVolumeNo, setNewVolumeNo] = useState<number>(1);
    const [newVolumeTitle, setNewVolumeTitle] = useState('');
    const [newVolumeDesc, setNewVolumeDesc] = useState('');

    // STEP 3 — BOOK INFO STATE
    const [bookTitle, setBookTitle] = useState('Shatterfirst - Arc 3: Corporate Arena');
    const [japaneseTitle, setJapaneseTitle] = useState('シャッターファースト 第3巻');
    const [slug, setSlug] = useState('shatterfirst-arc-3-corporate-arena');
    const [language, setLanguage] = useState('English');
    const [description, setDescription] = useState('The stakes rise as underground gladiators face against mechanized mega-corporations.');
    const [author, setAuthor] = useState('Tatsuki Fujimoto');
    const [artist, setArtist] = useState('Yusuke Murata');
    const [category, setCategory] = useState('Shonen');
    const [selectedGenres, setSelectedGenres] = useState<string[]>(['Action', 'Sci-Fi']);
    const [selectedTags, setSelectedTags] = useState<string[]>(['Tournament']);
    const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400');
    const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&width=800');
    const [thumbnailImage, setThumbnailImage] = useState('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=200');
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);

    // STEP 4 — PRICING STATE
    const [pricingModel, setPricingModel] = useState<PricingModel>('PER_CHAPTER');
    const [coinPrice, setCoinPrice] = useState<number>(0);
    const [defaultChapterCoinCost, setDefaultChapterCoinCost] = useState<number>(2);
    const [defaultFreeChapters, setDefaultFreeChapters] = useState<number>(2);
    const [isPremium, setIsPremium] = useState<boolean>(true);

    // STEP 5 & 6 — CHAPTERS STATE
    interface WizardChapter {
        tempId: string;
        chapterNo: number;
        title: string;
        accessType: 'FREE' | 'PAID';
        coinCost: number;
        published: boolean;
        pdfFileName: string;
        pdfPageCount: number;
        pdfFileSize: number;
    }
    const [chapters, setChapters] = useState<WizardChapter[]>([
        {
            tempId: 'temp-c1',
            chapterNo: 1,
            title: 'Chapter 1: The Beginning',
            accessType: 'FREE',
            coinCost: 0,
            published: true,
            pdfFileName: 'chapter-001.pdf',
            pdfPageCount: 32,
            pdfFileSize: 18500000
        },
        {
            tempId: 'temp-c2',
            chapterNo: 2,
            title: 'Chapter 2: Counter Attack',
            accessType: 'FREE',
            coinCost: 0,
            published: true,
            pdfFileName: 'chapter-002.pdf',
            pdfPageCount: 28,
            pdfFileSize: 16200000
        },
        {
            tempId: 'temp-c3',
            chapterNo: 3,
            title: 'Chapter 3: Resonance',
            accessType: 'PAID',
            coinCost: 2,
            published: true,
            pdfFileName: 'chapter-003.pdf',
            pdfPageCount: 35,
            pdfFileSize: 21000000
        }
    ]);

    // Active chapter for Step 6 (PDFs)
    const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
    const filePdfInputRef = useRef<HTMLInputElement>(null);

    // Load initial series & volumes
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [sList, vList] = await Promise.all([
                    adminSeriesService.getAll(),
                    adminVolumeService.getAll()
                ]);
                setSeriesList(sList);
                setVolumesList(vList);
                if (sList.length > 0) {
                    setSelectedSeriesId(sList[0].id);
                }
            } catch (err: any) {
                setErrorMessage(err.message || 'Failed to initialize catalog data.');
            }
        };
        loadInitial();
    }, []);

    // Filter volumes for currently selected series
    const seriesVolumes = volumesList.filter(v => v.series_id === selectedSeriesId);
    const selectedSeriesObj = seriesList.find(s => s.id === selectedSeriesId);
    const selectedVolumeObj = seriesVolumes.find(v => v.id === selectedVolumeId);

    // Create New Series Inline Handler
    const handleCreateSeriesInline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSeriesTitle.trim()) return;
        try {
            const created = await adminSeriesService.create({
                name: newSeriesTitle,
                description: newSeriesDesc,
                cover_image: newSeriesCover,
                status: 'ONGOING'
            });
            setSeriesList([created, ...seriesList]);
            setSelectedSeriesId(created.id);
            setIsCreatingSeries(false);
            setSuccessMessage(`Franchise "${created.title}" registered successfully.`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to create series inline.');
        }
    };

    // Navigation Guards
    const handleNext = () => {
        setErrorMessage(null);
        if (currentStep === 1 && !selectedSeriesId) {
            setErrorMessage('Please select or create a series to continue.');
            return;
        }
        if (currentStep === 2 && volumeChoice === 'existing' && !selectedVolumeId) {
            setErrorMessage('Please choose an existing volume or switch to [No Volume].');
            return;
        }
        if (currentStep === 2 && volumeChoice === 'new' && !newVolumeTitle.trim()) {
            setErrorMessage('Please provide a volume title.');
            return;
        }
        if (currentStep === 3 && !bookTitle.trim()) {
            setErrorMessage('Book title is required.');
            return;
        }
        if (currentStep === 5 && chapters.length === 0) {
            setErrorMessage('At least one chapter is required.');
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };

    const handleBack = () => {
        setErrorMessage(null);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Chapter Management Helpers
    const handleAddChapter = () => {
        const nextNo = chapters.length + 1;
        const newCh: WizardChapter = {
            tempId: `temp-c${Date.now()}`,
            chapterNo: nextNo,
            title: `Chapter ${nextNo}: New Chapter`,
            accessType: nextNo <= defaultFreeChapters ? 'FREE' : 'PAID',
            coinCost: nextNo <= defaultFreeChapters ? 0 : defaultChapterCoinCost,
            published: true,
            pdfFileName: `chapter-${String(nextNo).padStart(3, '0')}.pdf`,
            pdfPageCount: 30,
            pdfFileSize: 18000000
        };
        setChapters([...chapters, newCh]);
    };

    const handleDuplicateChapter = (ch: WizardChapter) => {
        const nextNo = chapters.length + 1;
        const dup: WizardChapter = {
            ...ch,
            tempId: `temp-c${Date.now()}`,
            chapterNo: nextNo,
            title: `${ch.title} (Copy)`,
            pdfFileName: `chapter-${String(nextNo).padStart(3, '0')}.pdf`
        };
        setChapters([...chapters, dup]);
    };

    const handleDeleteChapter = (index: number) => {
        const remaining = chapters.filter((_, i) => i !== index);
        const reordered = remaining.map((c, idx) => ({ ...c, chapterNo: idx + 1 }));
        setChapters(reordered);
        if (activeChapterIndex >= reordered.length) {
            setActiveChapterIndex(Math.max(0, reordered.length - 1));
        }
    };

    const handleMoveChapter = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === chapters.length - 1) return;
        const copy = [...chapters];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        const reordered = copy.map((c, idx) => ({ ...c, chapterNo: idx + 1 }));
        setChapters(reordered);
    };

    const currentChapter = chapters[activeChapterIndex];

    const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !currentChapter) return;
        const file = files[0];
        const updatedChapters = chapters.map((c, idx) => {
            if (idx === activeChapterIndex) {
                return {
                    ...c,
                    pdfFileName: file.name,
                    pdfFileSize: file.size,
                    pdfPageCount: c.pdfPageCount || 35
                };
            }
            return c;
        });
        setChapters(updatedChapters);
        if (filePdfInputRef.current) filePdfInputRef.current.value = '';
    };

    // Final Submission Handler
    const handleSubmit = async (targetStatus: 'PUBLISHED' | 'DRAFT') => {
        setSubmitting(true);
        setErrorMessage(null);

        try {
            // 1. Create Volume if user picked "new"
            let finalVolumeId: string | null = null;
            if (volumeChoice === 'existing') {
                finalVolumeId = selectedVolumeId;
            } else if (volumeChoice === 'new') {
                const createdVol = await adminVolumeService.create({
                    series_id: selectedSeriesId,
                    volume_no: newVolumeNo,
                    volumeNumber: newVolumeNo,
                    title: newVolumeTitle,
                    description: newVolumeDesc,
                    status: 'PUBLISHED'
                });
                finalVolumeId = createdVol.id;
            }

            // 2. Create Book
            const newBook = await adminBookService.create({
                series_id: selectedSeriesId,
                volume_id: finalVolumeId,
                title: bookTitle,
                japanese_title: japaneseTitle || null,
                slug: slug || bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                summary: description,
                language,
                author,
                artist,
                category,
                genres: selectedGenres,
                tags: selectedTags,
                cover_image: coverImage,
                banner_image: bannerImage,
                thumbnail_image: thumbnailImage,
                release_date: releaseDate,
                pricing_model: pricingModel,
                coin_price: coinPrice,
                default_chapter_coin_cost: defaultChapterCoinCost,
                default_free_chapters: defaultFreeChapters,
                is_premium: isPremium,
                status: targetStatus,
                chapter_count: chapters.length
            });

            // 3. Create Chapters with PDF Content Metadata
            for (const ch of chapters) {
                await adminChapterService.create({
                    book_id: newBook.id,
                    bookId: newBook.id,
                    chapter_no: ch.chapterNo,
                    chapterNumber: ch.chapterNo,
                    title: ch.title,
                    pricingModel: ch.accessType,
                    access_type: ch.accessType,
                    coinCost: ch.accessType === 'FREE' ? 0 : ch.coinCost,
                    coin_cost: ch.accessType === 'FREE' ? 0 : ch.coinCost,
                    pdfFileName: ch.pdfFileName,
                    pdf_file_name: ch.pdfFileName,
                    pdfPageCount: ch.pdfPageCount,
                    pdf_page_count: ch.pdfPageCount,
                    pdfFileSize: ch.pdfFileSize,
                    pdf_file_size: ch.pdfFileSize,
                    contentStatus: 'READY',
                    content_status: 'READY',
                    published: ch.published
                });
            }

            // 4. Navigate to central book workspace
            navigate(`/admin/books/${newBook.id}`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to finalize book creation.');
            setSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Create Manga Book"
                subtitle="7-step wizard to create book metadata, monetization defaults, chapter structures, and PDF assets."
                breadcrumbs={[
                    { label: 'Admin', path: '/admin' },
                    { label: 'Catalog', path: '/admin/series' },
                    { label: 'Create Book' }
                ]}
            />

            {errorMessage && <ErrorBanner message={errorMessage} />}
            {successMessage && <SuccessBanner message={successMessage} />}

            {/* Stepper Progress Bar */}
            <div className={styles.stepperContainer}>
                {STEPS.map((s) => {
                    const isPassed = s.number < currentStep;
                    const isCurrent = s.number === currentStep;

                    return (
                        <div
                            key={s.number}
                            className={`${styles.stepNode} ${isPassed ? styles.stepNodeCompleted : ''} ${isCurrent ? styles.stepNodeActive : ''}`}
                            onClick={() => {
                                if (s.number < currentStep) setCurrentStep(s.number);
                            }}
                        >
                            <div className={styles.stepCircle}>
                                {isPassed ? <Check size={14} strokeWidth={3} /> : s.number}
                            </div>
                            <span className={styles.stepTitle}>{s.title}</span>
                        </div>
                    );
                })}
            </div>

            {/* ============================================================ */}
            {/* STEP 1: SERIES */}
            {/* ============================================================ */}
            {currentStep === 1 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 1 — Franchise / Series Assignment *</h2>
                        <p className={styles.stepCardSubtitle}>
                            Every book belongs to a parent Series franchise. Select an existing franchise or create one inline.
                        </p>
                    </div>

                    {!isCreatingSeries ? (
                        <>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Select Existing Series Franchise *</label>
                                <select
                                    className={uiStyles.formSelect}
                                    value={selectedSeriesId}
                                    onChange={(e) => setSelectedSeriesId(e.target.value)}
                                >
                                    <option value="" disabled>-- Choose a parent series --</option>
                                    {seriesList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.title} ({s.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <button
                                    type="button"
                                    className={uiStyles.btnSecondary}
                                    onClick={() => setIsCreatingSeries(true)}
                                >
                                    <Plus size={14} /> Register New Series Franchise
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleCreateSeriesInline} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                                Quick Register New Series
                            </h4>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Franchise Title *</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    placeholder="e.g. Solo Leveling: Ragnarok"
                                    value={newSeriesTitle}
                                    onChange={(e) => setNewSeriesTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Synopsis / Description</label>
                                <textarea
                                    className={uiStyles.formTextarea}
                                    rows={2}
                                    value={newSeriesDesc}
                                    onChange={(e) => setNewSeriesDesc(e.target.value)}
                                />
                            </div>

                            <FileUploadDropzone
                                label="Series Banner Artwork"
                                currentUrl={newSeriesCover}
                                onFileSelected={(url) => setNewSeriesCover(url)}
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                <button
                                    type="button"
                                    className={uiStyles.btnSecondary}
                                    onClick={() => setIsCreatingSeries(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={uiStyles.btnPrimary}>
                                    Save & Select Series
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: VOLUME (OPTIONAL) */}
            {/* ============================================================ */}
            {currentStep === 2 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 2 — Volume Configuration (Optional)</h2>
                        <p className={styles.stepCardSubtitle}>
                            Volumes are strictly optional. You can attach this book directly to <strong>{selectedSeriesObj?.title}</strong> without a volume, pick an existing volume, or create one.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                        <div
                            onClick={() => setVolumeChoice('none')}
                            style={{
                                background: volumeChoice === 'none' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: volumeChoice === 'none' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '16px',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            <Layers size={24} color={volumeChoice === 'none' ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '14px' }}>[ No Volume ]</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Direct Series ➔ Book
                            </div>
                        </div>

                        <div
                            onClick={() => setVolumeChoice('existing')}
                            style={{
                                background: volumeChoice === 'existing' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: volumeChoice === 'existing' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '16px',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            <FolderKanban size={24} color={volumeChoice === 'existing' ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '14px' }}>[ Select Existing Volume ]</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {seriesVolumes.length} volume(s) available
                            </div>
                        </div>

                        <div
                            onClick={() => setVolumeChoice('new')}
                            style={{
                                background: volumeChoice === 'new' ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: volumeChoice === 'new' ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                padding: '16px',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            <Plus size={24} color={volumeChoice === 'new' ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '14px' }}>Create New Volume</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Create new volume compilation
                            </div>
                        </div>
                    </div>

                    {volumeChoice === 'existing' && (
                        <div className={uiStyles.formGroup} style={{ marginTop: '16px' }}>
                            <label className={uiStyles.formLabel}>Choose Volume for {selectedSeriesObj?.title} *</label>
                            {seriesVolumes.length > 0 ? (
                                <select
                                    className={uiStyles.formSelect}
                                    value={selectedVolumeId}
                                    onChange={(e) => setSelectedVolumeId(e.target.value)}
                                >
                                    <option value="" disabled>-- Select a volume --</option>
                                    {seriesVolumes.map(v => (
                                        <option key={v.id} value={v.id}>
                                            Vol. {v.volumeNumber ?? (v as any).volume_number}: {v.title}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    No volumes currently exist for this franchise. Choose [No Volume] or create one.
                                </div>
                            )}
                        </div>
                    )}

                    {volumeChoice === 'new' && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', marginTop: '16px' }}>
                            <div className={uiStyles.formGrid}>
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Volume Sequence Number *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={uiStyles.formInput}
                                        value={newVolumeNo}
                                        onChange={(e) => setNewVolumeNo(parseInt(e.target.value) || 1)}
                                        required
                                    />
                                </div>

                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Volume Title *</label>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        placeholder="e.g. Volume 1: Corporate Arena"
                                        value={newVolumeTitle}
                                        onChange={(e) => setNewVolumeTitle(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Volume Description (Optional)</label>
                                <textarea
                                    className={uiStyles.formTextarea}
                                    rows={2}
                                    value={newVolumeDesc}
                                    onChange={(e) => setNewVolumeDesc(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: BOOK INFO */}
            {/* ============================================================ */}
            {currentStep === 3 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 3 — Book Metadata & Artwork</h2>
                        <p className={styles.stepCardSubtitle}>
                            Display title, author, demographic categories, synopsis, and cover assets.
                        </p>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Book Title (English / Main Display) *</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Japanese Title (Original Kanzenban)</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="e.g. シャッターファースト"
                                value={japaneseTitle}
                                onChange={(e) => setJapaneseTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>URL Slug</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Language</label>
                            <select
                                className={uiStyles.formSelect}
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                {AVAILABLE_LANGUAGES.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Author</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Artist / Illustrator</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Demographic Category</label>
                            <select
                                className={uiStyles.formSelect}
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {AVAILABLE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Release Date</label>
                            <input
                                type="date"
                                className={uiStyles.formInput}
                                value={releaseDate}
                                onChange={(e) => setReleaseDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Plot Summary / Synopsis</label>
                        <textarea
                            className={uiStyles.formTextarea}
                            rows={3}
                            placeholder="Detailed synopsis for reader catalog..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Genres (Click to toggle)</label>
                        <div className={styles.chipsContainer}>
                            {AVAILABLE_GENRES.map(g => {
                                const selected = selectedGenres.includes(g);
                                return (
                                    <div
                                        key={g}
                                        className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                                        onClick={() => {
                                            if (selected) setSelectedGenres(selectedGenres.filter(item => item !== g));
                                            else setSelectedGenres([...selectedGenres, g]);
                                        }}
                                    >
                                        <span>{g}</span>
                                        {selected && <X size={12} className={styles.chipRemoveBtn} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Content Tags</label>
                        <div className={styles.chipsContainer}>
                            {AVAILABLE_TAGS.map(t => {
                                const selected = selectedTags.includes(t);
                                return (
                                    <div
                                        key={t}
                                        className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                                        onClick={() => {
                                            if (selected) setSelectedTags(selectedTags.filter(item => item !== t));
                                            else setSelectedTags([...selectedTags, t]);
                                        }}
                                    >
                                        <span>#{t}</span>
                                        {selected && <X size={12} className={styles.chipRemoveBtn} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.mediaRow}>
                        <FileUploadDropzone
                            label="Cover Image (Portrait)"
                            currentUrl={coverImage}
                            onFileSelected={(url) => setCoverImage(url)}
                        />
                        <FileUploadDropzone
                            label="Banner Artwork (Landscape)"
                            currentUrl={bannerImage}
                            onFileSelected={(url) => setBannerImage(url)}
                        />
                        <FileUploadDropzone
                            label="Thumbnail (Square / Mobile)"
                            currentUrl={thumbnailImage}
                            onFileSelected={(url) => setThumbnailImage(url)}
                        />
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: PRICING */}
            {/* ============================================================ */}
            {currentStep === 4 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 4 — Pricing & Monetization Defaults</h2>
                        <p className={styles.stepCardSubtitle}>
                            Configure default pricing rules. Book pricing acts as the baseline default; individual chapters can override these rules in Step 5.
                        </p>
                    </div>

                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Pricing Model *</label>
                        <select
                            className={uiStyles.formSelect}
                            value={pricingModel}
                            onChange={(e) => setPricingModel(e.target.value as PricingModel)}
                        >
                            <option value="FREE">FREE (All chapters unlocked by default)</option>
                            <option value="PER_CHAPTER">PER_CHAPTER (Chapters unlock via individual coin cost)</option>
                            <option value="PER_BOOK">PER_BOOK (Single flat coin unlock for entire volume)</option>
                            <option value="SUBSCRIPTION">SUBSCRIPTION (KuroYomi Pass membership required)</option>
                        </select>
                    </div>

                    <div className={uiStyles.formGrid}>
                        {pricingModel === 'PER_BOOK' && (
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Full Book Unlock Cost (Coins)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={uiStyles.formInput}
                                    value={coinPrice}
                                    onChange={(e) => setCoinPrice(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        )}

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Default Chapter Unlock Cost (Coins)</label>
                            <input
                                type="number"
                                min={0}
                                className={uiStyles.formInput}
                                value={defaultChapterCoinCost}
                                onChange={(e) => setDefaultChapterCoinCost(parseInt(e.target.value) || 0)}
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coins required to unlock a paid chapter</p>
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Default Free Chapters Count</label>
                            <input
                                type="number"
                                min={0}
                                className={uiStyles.formInput}
                                value={defaultFreeChapters}
                                onChange={(e) => setDefaultFreeChapters(parseInt(e.target.value) || 0)}
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Initial chapters available without coins</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="premiumToggle"
                            checked={isPremium}
                            onChange={(e) => setIsPremium(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                        />
                        <label htmlFor="premiumToggle" style={{ fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                            Premium Badge Enabled (Highlight in storefront carousel)
                        </label>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 5: CHAPTERS */}
            {/* ============================================================ */}
            {currentStep === 5 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                                <h2 className={styles.stepCardTitle}>Step 5 — Chapter Management & Pricing Rules</h2>
                                <p className={styles.stepCardSubtitle}>
                                    Chapters are the monetization and reading unit. Specify title, pricing model, and coin costs.
                                </p>
                            </div>
                            <button type="button" className={uiStyles.btnPrimary} onClick={handleAddChapter}>
                                <Plus size={14} /> Add Chapter
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {chapters.map((ch, idx) => (
                            <div
                                key={ch.tempId}
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '14px', width: '32px' }}>
                                        #{ch.chapterNo}
                                    </span>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        style={{ flex: 1, minWidth: '160px' }}
                                        value={ch.title}
                                        onChange={(e) => {
                                            const updated = [...chapters];
                                            updated[idx].title = e.target.value;
                                            setChapters(updated);
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <select
                                        className={uiStyles.formSelect}
                                        style={{ width: '110px' }}
                                        value={ch.accessType}
                                        onChange={(e) => {
                                            const updated = [...chapters];
                                            const val = e.target.value as 'FREE' | 'PAID';
                                            updated[idx].accessType = val;
                                            if (val === 'FREE') updated[idx].coinCost = 0;
                                            else if (updated[idx].coinCost === 0) updated[idx].coinCost = defaultChapterCoinCost || 2;
                                            setChapters(updated);
                                        }}
                                    >
                                        <option value="FREE">FREE</option>
                                        <option value="PAID">PAID</option>
                                    </select>

                                    {ch.accessType === 'PAID' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coins:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                className={uiStyles.formInput}
                                                style={{ width: '60px', padding: '6px' }}
                                                value={ch.coinCost}
                                                onChange={(e) => {
                                                    const updated = [...chapters];
                                                    updated[idx].coinCost = parseInt(e.target.value) || 1;
                                                    setChapters(updated);
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            type="button"
                                            className={uiStyles.btnIcon}
                                            disabled={idx === 0}
                                            title="Move Up"
                                            onClick={() => handleMoveChapter(idx, 'up')}
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className={uiStyles.btnIcon}
                                            disabled={idx === chapters.length - 1}
                                            title="Move Down"
                                            onClick={() => handleMoveChapter(idx, 'down')}
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className={uiStyles.btnIcon}
                                            title="Duplicate Chapter"
                                            onClick={() => handleDuplicateChapter(ch)}
                                        >
                                            <Copy size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            className={uiStyles.btnIcon}
                                            style={{ color: '#ef4444' }}
                                            title="Delete Chapter"
                                            onClick={() => handleDeleteChapter(idx)}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 6: CHAPTER PDFS */}
            {/* ============================================================ */}
            {currentStep === 6 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                                <h2 className={styles.stepCardTitle}>Step 6 — Chapter PDF Assets</h2>
                                <p className={styles.stepCardSubtitle}>
                                    One PDF corresponds to one chapter. The PDF is stored in object storage and rendered continuously by the reader.
                                </p>
                            </div>
                            <button
                                type="button"
                                className={uiStyles.btnPrimary}
                                onClick={() => filePdfInputRef.current?.click()}
                            >
                                <UploadCloud size={14} /> Attach PDF to Current Chapter
                            </button>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={filePdfInputRef}
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={handlePdfFileSelect}
                    />

                    {/* Chapter Tabs */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
                        {chapters.map((ch, idx) => (
                            <button
                                key={ch.tempId}
                                type="button"
                                onClick={() => setActiveChapterIndex(idx)}
                                className={`${styles.stepPill} ${idx === activeChapterIndex ? styles.stepPillActive : ''}`}
                            >
                                <span>Ch. {ch.chapterNo} ({ch.pdfPageCount || 0} pgs)</span>
                            </button>
                        ))}
                    </div>

                    {currentChapter && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <FileText size={20} color="#38bdf8" />
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                    Ch. {currentChapter.chapterNo}: {currentChapter.title}
                                </h3>
                            </div>

                            <div className={uiStyles.formGrid}>
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>PDF File Name *</label>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        value={currentChapter.pdfFileName}
                                        onChange={(e) => {
                                            const updated = [...chapters];
                                            updated[activeChapterIndex].pdfFileName = e.target.value;
                                            setChapters(updated);
                                        }}
                                        placeholder="e.g. chapter-001.pdf"
                                    />
                                </div>

                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Total PDF Pages *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={uiStyles.formInput}
                                        value={currentChapter.pdfPageCount}
                                        onChange={(e) => {
                                            const updated = [...chapters];
                                            updated[activeChapterIndex].pdfPageCount = parseInt(e.target.value) || 1;
                                            setChapters(updated);
                                        }}
                                    />
                                </div>

                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>File Size (Bytes)</label>
                                    <input
                                        type="number"
                                        min={1024}
                                        className={uiStyles.formInput}
                                        value={currentChapter.pdfFileSize}
                                        onChange={(e) => {
                                            const updated = [...chapters];
                                            updated[activeChapterIndex].pdfFileSize = parseInt(e.target.value) || 1024;
                                            setChapters(updated);
                                        }}
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Approx. {(currentChapter.pdfFileSize / (1024 * 1024)).toFixed(1)} MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 7: REVIEW & PUBLISH */}
            {/* ============================================================ */}
            {currentStep === 7 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 7 — Review & Publish</h2>
                        <p className={styles.stepCardSubtitle}>
                            Validate final catalog attributes, inspect chapter structures, and publish or save as draft.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {/* Summary Card */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '20px' }}>
                            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                                <img
                                    src={coverImage}
                                    alt={bookTitle}
                                    style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{bookTitle}</h3>
                                    {japaneseTitle && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{japaneseTitle}</div>}
                                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                                        Series: {selectedSeriesObj?.title}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        Volume: {volumeChoice === 'none' ? 'Direct Book (No Volume)' : volumeChoice === 'new' ? newVolumeTitle : selectedVolumeObj?.title || 'None'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Language:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{language}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Author / Artist:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{author} / {artist}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Pricing Model:</span>
                                    <span style={{ color: '#ffd700', fontWeight: 700 }}>{pricingModel}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Chapters:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{chapters.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total PDF Pages:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{chapters.reduce((sum, c) => sum + (c.pdfPageCount || 0), 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Validation Checklist */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '14px' }}>Pre-Flight Checklist</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: selectedSeriesId ? '#10b981' : '#ef4444' }}>
                                    <CheckCircle2 size={16} />
                                    <span>Parent Series link verified</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: bookTitle ? '#10b981' : '#ef4444' }}>
                                    <CheckCircle2 size={16} />
                                    <span>Book title & metadata complete</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: coverImage ? '#10b981' : '#f59e0b' }}>
                                    <CheckCircle2 size={16} />
                                    <span>Cover artwork verified</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: chapters.length > 0 ? '#10b981' : '#f59e0b' }}>
                                    <CheckCircle2 size={16} />
                                    <span>{chapters.length} chapters configured</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: chapters.every(c => c.pdfFileName) ? '#10b981' : '#f59e0b' }}>
                                    <CheckCircle2 size={16} />
                                    <span>Chapter PDF assets configured</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className={styles.wizardFooter}>
                <button
                    type="button"
                    className={uiStyles.btnSecondary}
                    onClick={handleBack}
                    disabled={currentStep === 1 || submitting}
                >
                    <ArrowLeft size={16} /> Previous Step
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {currentStep < 7 ? (
                        <button
                            type="button"
                            className={uiStyles.btnPrimary}
                            onClick={handleNext}
                        >
                            Next Step <ArrowRight size={16} />
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className={uiStyles.btnSecondary}
                                onClick={() => handleSubmit('DRAFT')}
                                disabled={submitting}
                            >
                                <Save size={14} /> Save as Draft
                            </button>
                            <button
                                type="button"
                                className={uiStyles.btnPrimary}
                                onClick={() => handleSubmit('PUBLISHED')}
                                disabled={submitting}
                            >
                                {submitting ? 'Publishing...' : 'Publish Manga Book'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
