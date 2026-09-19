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
    FileImage,
    UploadCloud,
    Trash2,
    Eye,
    ChevronUp,
    ChevronDown,
    Copy,
    Save
} from 'lucide-react';
import {
    adminSeriesService,
    adminVolumeService,
    adminBookService,
    adminChapterService,
    adminPageService
} from '../../services/admin/adminServices';
import type { BookSeries, Volume } from '../../types';
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
    { number: 6, title: 'Pages' },
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
    const [seriesSearch, setSeriesSearch] = useState('');
    const [isCreatingSeries, setIsCreatingSeries] = useState(false);
    const [newSeriesTitle, setNewSeriesTitle] = useState('');
    const [newSeriesDesc, setNewSeriesDesc] = useState('');
    const [newSeriesCover, setNewSeriesCover] = useState('');

    // STEP 2 — VOLUME STATE (OPTIONAL)
    const [volumeChoice, setVolumeChoice] = useState<'none' | 'existing' | 'new'>('none');
    const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
    const [newVolumeNo, setNewVolumeNo] = useState<number>(1);
    const [newVolumeTitle, setNewVolumeTitle] = useState('');
    const [newVolumeDesc, setNewVolumeDesc] = useState('');

    // STEP 3 — BOOK INFORMATION STATE
    const [bookTitle, setBookTitle] = useState('');
    const [japaneseTitle, setJapaneseTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('English');
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
    const [pricingModel, setPricingModel] = useState<'FREE' | 'PER_PAGE' | 'PER_CHAPTER' | 'PER_BOOK' | 'SUBSCRIPTION'>('PER_CHAPTER');
    const [coinPrice, setCoinPrice] = useState<number>(0);
    const [defaultCoinsPerPage, setDefaultCoinsPerPage] = useState<number>(0);
    const [defaultFreeChapters, setDefaultFreeChapters] = useState<number>(2);
    const [defaultFreePages, setDefaultFreePages] = useState<number>(5);
    const [isPremium, setIsPremium] = useState<boolean>(true);

    // STEP 5 — CHAPTERS STATE
    interface WizardChapter {
        tempId: string;
        chapterNo: number;
        title: string;
        accessType: 'FREE' | 'PARTIAL' | 'PAID';
        freePages: number;
        coinCost: number;
        published: boolean;
        pages: string[]; // Mock page URLs for this chapter
    }
    const [chapters, setChapters] = useState<WizardChapter[]>([
        {
            tempId: 'temp-c1',
            chapterNo: 1,
            title: 'Chapter 1: The Beginning',
            accessType: 'FREE',
            freePages: 20,
            coinCost: 0,
            published: true,
            pages: [
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&width=400',
                'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&width=400',
                'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&width=400'
            ]
        },
        {
            tempId: 'temp-c2',
            chapterNo: 2,
            title: 'Chapter 2: Counter Attack',
            accessType: 'PARTIAL',
            freePages: 5,
            coinCost: 2,
            published: true,
            pages: [
                'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&width=400',
                'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&width=400'
            ]
        }
    ]);

    // Active chapter for Step 6 (Pages)
    const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
    const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null);
    const fileBatchInputRef = useRef<HTMLInputElement>(null);

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

    // Filter volumes when series changes
    const seriesVolumes = volumesList.filter(v => v.series_id === selectedSeriesId);

    // Auto slug sync
    const handleTitleChange = (val: string) => {
        setBookTitle(val);
        const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setSlug(autoSlug);
    };

    // Inline Series Creation
    const handleCreateSeriesInline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSeriesTitle.trim()) return;
        try {
            const created = await adminSeriesService.create({
                title: newSeriesTitle,
                description: newSeriesDesc,
                cover_image: newSeriesCover || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400',
                status: 'ONGOING'
            });
            setSeriesList([created, ...seriesList]);
            setSelectedSeriesId(created.id);
            setIsCreatingSeries(false);
            setSuccessMessage(`Series "${created.title}" created and selected.`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to create series.');
        }
    };

    // Step Validation before progressing
    const validateCurrentStep = (): boolean => {
        setErrorMessage(null);

        if (currentStep === 1) {
            if (!selectedSeriesId) {
                setErrorMessage('Please select an existing series or create a new series.');
                return false;
            }
        } else if (currentStep === 2) {
            if (volumeChoice === 'new') {
                if (!newVolumeTitle.trim()) {
                    setErrorMessage('Please enter a volume title or choose "No Volume".');
                    return false;
                }
            }
        } else if (currentStep === 3) {
            if (!bookTitle.trim()) {
                setErrorMessage('Book title is required.');
                return false;
            }
        } else if (currentStep === 5) {
            if (chapters.length === 0) {
                setErrorMessage('At least one chapter is recommended before publishing.');
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(STEPS.length, prev + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setErrorMessage(null);
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Chapter Management Helpers
    const handleAddChapter = () => {
        const nextNo = chapters.length + 1;
        const newCh: WizardChapter = {
            tempId: `temp-c${Date.now()}`,
            chapterNo: nextNo,
            title: `Chapter ${nextNo}: `,
            accessType: pricingModel === 'FREE' ? 'FREE' : 'PAID',
            freePages: defaultFreePages,
            coinCost: 1,
            published: true,
            pages: []
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
            pages: [...ch.pages]
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

    // Pages Management Helpers
    const currentChapter = chapters[activeChapterIndex];

    const handleBatchPageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !currentChapter) return;
        const newUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
            newUrls.push(URL.createObjectURL(files[i]));
        }
        const updatedChapters = chapters.map((c, idx) => {
            if (idx === activeChapterIndex) {
                return { ...c, pages: [...c.pages, ...newUrls] };
            }
            return c;
        });
        setChapters(updatedChapters);
        if (fileBatchInputRef.current) fileBatchInputRef.current.value = '';
    };

    const handleMovePage = (pageIndex: number, direction: 'left' | 'right') => {
        if (!currentChapter) return;
        if (direction === 'left' && pageIndex === 0) return;
        if (direction === 'right' && pageIndex === currentChapter.pages.length - 1) return;
        const pagesCopy = [...currentChapter.pages];
        const targetIndex = direction === 'left' ? pageIndex - 1 : pageIndex + 1;
        const [moved] = pagesCopy.splice(pageIndex, 1);
        pagesCopy.splice(targetIndex, 0, moved);

        const updatedChapters = chapters.map((c, idx) => {
            if (idx === activeChapterIndex) {
                return { ...c, pages: pagesCopy };
            }
            return c;
        });
        setChapters(updatedChapters);
    };

    const handleDeletePage = (pageIndex: number) => {
        if (!currentChapter) return;
        const pagesCopy = currentChapter.pages.filter((_, i) => i !== pageIndex);
        const updatedChapters = chapters.map((c, idx) => {
            if (idx === activeChapterIndex) {
                return { ...c, pages: pagesCopy };
            }
            return c;
        });
        setChapters(updatedChapters);
    };

    // STEP 7 — FINAL SUBMIT
    const handleFinalSubmit = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
        setSubmitting(true);
        setErrorMessage(null);

        try {
            // 1. If user selected to create a new volume inline
            let finalVolumeId: string | null = null;
            if (volumeChoice === 'existing' && selectedVolumeId) {
                finalVolumeId = selectedVolumeId;
            } else if (volumeChoice === 'new' && newVolumeTitle.trim()) {
                const createdVol = await adminVolumeService.create({
                    series_id: selectedSeriesId,
                    volume_no: Number(newVolumeNo),
                    title: newVolumeTitle,
                    description: newVolumeDesc,
                    status: 'ONGOING'
                });
                finalVolumeId = createdVol.id;
            }

            // 2. Calculate totals
            const totalPageCount = chapters.reduce((sum, c) => sum + c.pages.length, 0);

            // 3. Create Book
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
                default_coins_per_page: defaultCoinsPerPage,
                default_free_chapters: defaultFreeChapters,
                default_free_pages: defaultFreePages,
                is_premium: isPremium,
                status: targetStatus,
                chapter_count: chapters.length,
                page_count: totalPageCount
            });

            // 4. Create Chapters and their Pages
            for (const ch of chapters) {
                const createdChapter = await adminChapterService.create({
                    book_id: newBook.id,
                    chapter_no: ch.chapterNo,
                    title: ch.title,
                    access_type: ch.accessType,
                    free_pages: ch.freePages,
                    coin_cost: ch.coinCost
                });

                if (ch.pages.length > 0) {
                    await adminPageService.uploadPages(createdChapter.id, ch.pages);
                }
            }

            // 5. Navigate to central book workspace
            navigate(`/admin/books/${newBook.id}`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to finalize book creation.');
            setSubmitting(false);
        }
    };

    const selectedSeriesObj = seriesList.find(s => s.id === selectedSeriesId);
    const selectedVolumeObj = volumesList.find(v => v.id === selectedVolumeId);

    return (
        <div className={styles.wizardContainer}>
            <PageHeader
                title="Create Book — Guided Manual Workflow"
                subtitle="Build a complete manga release with full editorial control over volume grouping, DRM pages, and pricing tiers."
                actions={
                    <button className={uiStyles.btnSecondary} onClick={() => navigate('/admin/books')}>
                        <ArrowLeft size={16} /> Exit to Books
                    </button>
                }
            />

            {errorMessage && <ErrorBanner message={errorMessage} />}
            {successMessage && <SuccessBanner message={successMessage} />}

            {/* Stepper Progress Indicator */}
            <div className={styles.stepperHeader}>
                <div className={styles.stepperMeta}>
                    <span className={styles.stepTitleBig}>
                        Step {currentStep} of 7: {STEPS[currentStep - 1].title}
                    </span>
                    <span className={styles.stepCounter}>
                        {Math.round((currentStep / STEPS.length) * 100)}% Completed
                    </span>
                </div>

                <div className={styles.stepperProgressTrack}>
                    <div
                        className={styles.stepperProgressBar}
                        style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    />
                </div>

                <div className={styles.stepsList}>
                    {STEPS.map((step) => {
                        const isCompleted = step.number < currentStep;
                        const isActive = step.number === currentStep;

                        return (
                            <button
                                key={step.number}
                                className={`${styles.stepPill} ${isActive ? styles.stepPillActive : ''} ${isCompleted ? styles.stepPillCompleted : ''}`}
                                onClick={() => {
                                    if (step.number < currentStep) setCurrentStep(step.number);
                                }}
                            >
                                {isCompleted ? <Check size={12} /> : <span>{step.number}.</span>}
                                <span>{step.title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ============================================================ */}
            {/* STEP 1: SERIES */}
            {/* ============================================================ */}
            {currentStep === 1 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 1 — Series Selection</h2>
                        <p className={styles.stepCardSubtitle}>
                            Select the parent manga franchise. You can search existing series or create a brand-new series title.
                        </p>
                    </div>

                    {!isCreatingSeries ? (
                        <div>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Search Existing Series</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    placeholder="Search by series title..."
                                    value={seriesSearch}
                                    onChange={(e) => setSeriesSearch(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '14px' }}>
                                {seriesList
                                    .filter(s => s.title.toLowerCase().includes(seriesSearch.toLowerCase()))
                                    .map((s) => {
                                        const isSelected = s.id === selectedSeriesId;
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => setSelectedSeriesId(s.id)}
                                                style={{
                                                    background: isSelected ? 'rgba(230, 57, 70, 0.15)' : 'rgba(255,255,255,0.03)',
                                                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <img
                                                    src={s.cover_image || ''}
                                                    alt={s.title}
                                                    style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {s.title}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: {s.status}</div>
                                                </div>
                                                {isSelected && <CheckCircle2 size={16} color="var(--primary)" />}
                                            </div>
                                        );
                                    })}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button
                                    type="button"
                                    className={uiStyles.btnSecondary}
                                    onClick={() => setIsCreatingSeries(true)}
                                >
                                    <Plus size={14} /> + Create New Series
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateSeriesInline}>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>New Series Title *</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    placeholder="e.g. Solo Levelling"
                                    value={newSeriesTitle}
                                    onChange={(e) => setNewSeriesTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Synopsis / Story Overview</label>
                                <textarea
                                    className={uiStyles.formTextarea}
                                    rows={3}
                                    placeholder="Official premise of the overarching franchise..."
                                    value={newSeriesDesc}
                                    onChange={(e) => setNewSeriesDesc(e.target.value)}
                                />
                            </div>

                            <FileUploadDropzone
                                label="Series Banner / Poster Artwork"
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
                        {/* Option A: No Volume */}
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
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>[ No Volume ]</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Direct Series ➔ Book
                            </div>
                        </div>

                        {/* Option B: Select Existing Volume */}
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
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>[ Select Existing Volume ]</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {seriesVolumes.length} volume(s) available
                            </div>
                        </div>

                        {/* Option C: Create Volume */}
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
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>[ + Create Volume ]</div>
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
                                    <option value="">-- Choose Volume --</option>
                                    {seriesVolumes.map(v => (
                                        <option key={v.id} value={v.id}>
                                            Vol. {v.volume_no}: {v.title}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    No volumes currently exist for this series. You can select "No Volume" or "+ Create Volume".
                                </p>
                            )}
                        </div>
                    )}

                    {volumeChoice === 'new' && (
                        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>New Volume Details</h4>
                            <div className={uiStyles.formGrid}>
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Volume Number *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={uiStyles.formInput}
                                        value={newVolumeNo}
                                        onChange={(e) => setNewVolumeNo(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Volume Title *</label>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        placeholder="e.g. Volume 1: Awakening"
                                        value={newVolumeTitle}
                                        onChange={(e) => setNewVolumeTitle(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Volume Description</label>
                                <input
                                    type="text"
                                    className={uiStyles.formInput}
                                    placeholder="Brief plot notes for this compilation..."
                                    value={newVolumeDesc}
                                    onChange={(e) => setNewVolumeDesc(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: BOOK INFORMATION */}
            {/* ============================================================ */}
            {currentStep === 3 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 3 — Book Information & Metadata</h2>
                        <p className={styles.stepCardSubtitle}>
                            Enter comprehensive book metadata, creators, multi-select genre chips, and media artworks.
                        </p>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Book Title (English / Display) *</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="e.g. Shatterfirst Vol. 1 - English Digital Edition"
                                value={bookTitle}
                                onChange={(e) => handleTitleChange(e.target.value)}
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

                    {/* Removable Genre Chips */}
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

                    {/* Removable Tag Chips */}
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

                    {/* Previews: Cover / Banner / Thumbnail */}
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
                            onChange={(e) => setPricingModel(e.target.value as any)}
                        >
                            <option value="FREE">FREE (All chapters unlocked by default)</option>
                            <option value="PER_CHAPTER">PER_CHAPTER (Chapters unlock via individual coin cost)</option>
                            <option value="PER_PAGE">PER_PAGE (Micro-metered per page read)</option>
                            <option value="PER_BOOK">PER_BOOK (Single flat coin unlock for entire volume)</option>
                            <option value="SUBSCRIPTION">SUBSCRIPTION (KuroYomi Pass membership required)</option>
                        </select>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            💡 Book pricing represents default pricing; chapter-level pricing may override it later.
                        </p>
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

                        {pricingModel === 'PER_PAGE' && (
                            <div className={uiStyles.formGroup}>
                                <label className={uiStyles.formLabel}>Default Coins Per Page</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={uiStyles.formInput}
                                    value={defaultCoinsPerPage}
                                    onChange={(e) => setDefaultCoinsPerPage(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        )}

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

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Default Free Pages per Chapter</label>
                            <input
                                type="number"
                                min={0}
                                className={uiStyles.formInput}
                                value={defaultFreePages}
                                onChange={(e) => setDefaultFreePages(parseInt(e.target.value) || 0)}
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Teaser pages shown in partial preview mode</p>
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
                        <label htmlFor="premiumToggle" style={{ fontSize: '13px', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>
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
                                <h2 className={styles.stepCardTitle}>Step 5 — Chapter Management</h2>
                                <p className={styles.stepCardSubtitle}>
                                    Define chapters, configure pricing overrides (FREE / PARTIAL_FREE / PAID), and adjust sequence.
                                </p>
                            </div>
                            <button className={uiStyles.btnPrimary} onClick={handleAddChapter}>
                                <Plus size={14} /> + Add Chapter
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {chapters.map((ch, idx) => (
                            <div
                                key={ch.tempId}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '14px 16px',
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
                                        style={{ width: '130px' }}
                                        value={ch.accessType}
                                        onChange={(e) => {
                                            const updated = [...chapters];
                                            updated[idx].accessType = e.target.value as any;
                                            if (e.target.value === 'FREE') updated[idx].coinCost = 0;
                                            else if (updated[idx].coinCost === 0) updated[idx].coinCost = 1;
                                            setChapters(updated);
                                        }}
                                    >
                                        <option value="FREE">FREE</option>
                                        <option value="PARTIAL">PARTIAL FREE</option>
                                        <option value="PAID">PAID</option>
                                    </select>

                                    {ch.accessType === 'PARTIAL' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Free pgs:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                className={uiStyles.formInput}
                                                style={{ width: '60px', padding: '6px' }}
                                                value={ch.freePages}
                                                onChange={(e) => {
                                                    const updated = [...chapters];
                                                    updated[idx].freePages = parseInt(e.target.value) || 0;
                                                    setChapters(updated);
                                                }}
                                            />
                                        </div>
                                    )}

                                    {ch.accessType !== 'FREE' && (
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

                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '60px' }}>
                                        {ch.pages.length} pages
                                    </span>

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
            {/* STEP 6: PAGES */}
            {/* ============================================================ */}
            {currentStep === 6 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <h2 className={styles.stepCardTitle}>Step 6 — Page Management</h2>
                                <p className={styles.stepCardSubtitle}>
                                    Deterministic page ordering. Upload manga scans individually or in bulk.
                                </p>
                            </div>

                            <button
                                type="button"
                                className={uiStyles.btnPrimary}
                                onClick={() => fileBatchInputRef.current?.click()}
                            >
                                <UploadCloud size={14} /> Batch Upload Pages
                            </button>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileBatchInputRef}
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleBatchPageUpload}
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
                                <span>Ch. {ch.chapterNo} ({ch.pages.length} pgs)</span>
                            </button>
                        ))}
                    </div>

                    {/* Pages Grid */}
                    {currentChapter && currentChapter.pages.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '12px'
                        }}>
                            {currentChapter.pages.map((url, pageIdx) => (
                                <div
                                    key={pageIdx}
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
                                            PG {pageIdx + 1}
                                        </span>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            <button
                                                type="button"
                                                className={uiStyles.btnIcon}
                                                style={{ width: '22px', height: '22px' }}
                                                onClick={() => setPagePreviewUrl(url)}
                                            >
                                                <Eye size={10} />
                                            </button>
                                            <button
                                                type="button"
                                                className={uiStyles.btnIcon}
                                                style={{ width: '22px', height: '22px', color: '#ef4444' }}
                                                onClick={() => handleDeletePage(pageIdx)}
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ height: '140px', background: '#0e0e11', borderRadius: '4px', overflow: 'hidden' }}>
                                        <img src={url} alt={`Page ${pageIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                        <button
                                            type="button"
                                            className={uiStyles.btnSecondary}
                                            style={{ flex: 1, padding: '2px 4px', fontSize: '10px', height: '24px' }}
                                            disabled={pageIdx === 0}
                                            onClick={() => handleMovePage(pageIdx, 'left')}
                                        >
                                            ◀ Left
                                        </button>
                                        <button
                                            type="button"
                                            className={uiStyles.btnSecondary}
                                            style={{ flex: 1, padding: '2px 4px', fontSize: '10px', height: '24px' }}
                                            disabled={pageIdx === currentChapter.pages.length - 1}
                                            onClick={() => handleMovePage(pageIdx, 'right')}
                                        >
                                            Right ▶
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <FileImage size={36} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>No pages uploaded for Chapter {currentChapter?.chapterNo}</h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                                Add individual scans or upload high-resolution manga pages in bulk.
                            </p>
                            <button
                                type="button"
                                className={uiStyles.btnPrimary}
                                onClick={() => fileBatchInputRef.current?.click()}
                            >
                                <UploadCloud size={14} /> Upload Scans
                            </button>
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
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>{bookTitle}</h3>
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
                                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{language}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Author / Artist:</span>
                                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{author} / {artist}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Pricing Model:</span>
                                    <span style={{ color: '#ffd700', fontWeight: 700 }}>{pricingModel}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Chapters:</span>
                                    <span style={{ color: '#ffffff', fontWeight: 700 }}>{chapters.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Pages:</span>
                                    <span style={{ color: '#ffffff', fontWeight: 700 }}>{chapters.reduce((sum, c) => sum + c.pages.length, 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Validation Checklist */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>Pre-Flight Checklist</h4>

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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: chapters.reduce((sum, c) => sum + c.pages.length, 0) > 0 ? '#10b981' : '#f59e0b' }}>
                                    <CheckCircle2 size={16} />
                                    <span>Page sequences locked to deterministic order</span>
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

                {currentStep < 7 ? (
                    <button
                        type="button"
                        className={uiStyles.btnPrimary}
                        onClick={handleNext}
                    >
                        Next Step <ArrowRight size={16} />
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            className={uiStyles.btnSecondary}
                            onClick={() => handleFinalSubmit('DRAFT')}
                            disabled={submitting}
                        >
                            <Save size={16} /> Save as Draft
                        </button>
                        <button
                            type="button"
                            className={uiStyles.btnPrimary}
                            onClick={() => handleFinalSubmit('PUBLISHED')}
                            disabled={submitting}
                        >
                            <CheckCircle2 size={16} /> {submitting ? 'Publishing...' : 'Publish Book to Catalog'}
                        </button>
                    </div>
                )}
            </div>

            {/* Page Preview Modal */}
            <Modal
                isOpen={!!pagePreviewUrl}
                onClose={() => setPagePreviewUrl(null)}
                title="Page Preview"
            >
                {pagePreviewUrl && (
                    <div style={{ textAlign: 'center', background: '#000', padding: '12px', borderRadius: '8px' }}>
                        <img src={pagePreviewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
                    </div>
                )}
            </Modal>
        </div>
    );
};
