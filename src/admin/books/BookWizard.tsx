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
import { chapterService } from '../../services/chapterService';
import { storeChapterPdf } from '../../utils/pdfStorage';
import type { BookSeries, Volume, PricingModel } from '../../types';
import { catalogService, type CatalogLanguage, type CatalogCategory, type CatalogGenre, type CatalogTag } from '../../services/catalogService';
import {
    PageHeader,
    FileUploadDropzone,
    Modal,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import { generateSlug } from '../../services/seriesService';
import { BookCoverUploader, uploadBookCover, extractApiError } from './BookCoverUploader';
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

const DEFAULT_LANGUAGES_INIT: CatalogLanguage[] = [
    { id: 'aa47e99c-8a1a-4d5e-970c-db916528b199', name: 'English', code: 'en' },
    { id: '830f6493-88c4-4fd0-b922-c96d459f844e', name: 'Japanese', code: 'ja' },
    { id: 'c7c3a0d9-f32d-4968-bdec-092f05c09d23', name: 'French', code: 'fr' },
    { id: 'cd418489-4799-4606-a0b6-6d8e958c7959', name: 'German', code: 'de' },
];

const DEFAULT_CATEGORIES_INIT: CatalogCategory[] = [
    { id: '00142c6a-cf97-4d2f-ab9f-7ad6499f6e26', name: 'Manga', slug: 'manga' },
    { id: 'bc94a884-e419-4022-aec6-c3579a20f8d5', name: 'Manhwa', slug: 'manhwa' },
    { id: '45af38b8-eb85-442f-92e8-440d3abba462', name: 'Manhua', slug: 'manhua' },
    { id: '8899aeb1-e17e-479f-89aa-51d348af3cf7', name: 'Novel', slug: 'novel' },
    { id: '0d480761-e69f-48a4-9e84-d0e9b1e053c4', name: 'Light Novel', slug: 'light-novel' },
];

const DEFAULT_GENRES_INIT: CatalogGenre[] = [
    { id: '5d3ab5fb-19eb-40c2-9922-a1d5846578ed', name: 'Action', slug: 'action' },
    { id: 'abd96397-6387-4c2d-a451-f0fb7744aa51', name: 'Adventure', slug: 'adventure' },
    { id: '5cf3a7e8-21a5-4da8-9b19-ae34df65e991', name: 'Comedy', slug: 'comedy' },
    { id: '67cbe159-2168-417c-964a-2b3d064c8e7c', name: 'Drama', slug: 'drama' },
    { id: '70f3900f-42eb-43da-94f7-7ae3405c829c', name: 'Fantasy', slug: 'fantasy' },
    { id: '2b9d22d9-412d-42ac-a824-a9bf9d47e348', name: 'Romance', slug: 'romance' },
    { id: 'b86ae00d-f34d-44ca-bd3e-85677f61dd3c', name: 'Horror', slug: 'horror' },
    { id: '70c88542-b603-448e-84f6-ba1665e9484a', name: 'Mystery', slug: 'mystery' },
    { id: 'db2fb621-a540-4cc0-9701-64441881c1bc', name: 'Sci-Fi', slug: 'sci-fi' },
];

const DEFAULT_TAGS_INIT: CatalogTag[] = [
    { id: 'b1ab7696-dda1-49e2-a035-264a2972ced9', name: 'School', slug: 'school' },
    { id: '962adf53-a653-4b19-97f4-dedbb9019d6f', name: 'Magic', slug: 'magic' },
    { id: '2d624a75-b2e4-404d-97fd-d25d268ca921', name: 'Revenge', slug: 'revenge' },
    { id: '0144c50e-0c27-462a-9235-d22dc0bee967', name: 'Time Travel', slug: 'time-travel' },
    { id: '3895728e-86bc-48a8-a3c4-03a9ce87f0f4', name: 'Pirates', slug: 'pirates' },
    { id: '22709ac7-527a-4991-a743-73f5c07dc33a', name: 'Supernatural', slug: 'supernatural' },
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

    // Catalog Metadata
    const [languages, setLanguages] = useState<CatalogLanguage[]>(DEFAULT_LANGUAGES_INIT);
    const [categories, setCategories] = useState<CatalogCategory[]>(DEFAULT_CATEGORIES_INIT);
    const [genres, setGenres] = useState<CatalogGenre[]>(DEFAULT_GENRES_INIT);
    const [tags, setTags] = useState<CatalogTag[]>(DEFAULT_TAGS_INIT);

    // STEP 3 — BOOK INFO STATE
    const [bookTitle, setBookTitle] = useState('');
    const [japaneseTitle, setJapaneseTitle] = useState('');
    const [languageId, setLanguageId] = useState('aa47e99c-8a1a-4d5e-970c-db916528b199');
    const [author, setAuthor] = useState('');
    const [artist, setArtist] = useState('');
    const [categoryId, setCategoryId] = useState('00142c6a-cf97-4d2f-ab9f-7ad6499f6e26');
    // Cover is uploaded AFTER the book exists (object key contains the book ID).
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const releaseDate = new Date().toISOString().split('T')[0];
    const slug = generateSlug(bookTitle);

    useEffect(() => {
        if (!pendingCoverFile) { setCoverPreview(''); return; }
        const url = URL.createObjectURL(pendingCoverFile);
        setCoverPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingCoverFile]);

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
        pdfFile?: File;
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

    // Load initial series, volumes & catalog metadata
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [sList, vList, meta] = await Promise.all([
                    adminSeriesService.getAll(),
                    adminVolumeService.getAll(),
                    catalogService.getMetadata().catch(() => null)
                ]);
                setSeriesList(sList);
                setVolumesList(vList);
                if (sList.length > 0) {
                    setSelectedSeriesId(sList[0].id);
                }
                if (meta) {
                    if (meta.languages && meta.languages.length > 0) {
                        setLanguages(meta.languages);
                        setLanguageId(meta.languages[0].id);
                    }
                    if (meta.categories && meta.categories.length > 0) {
                        setCategories(meta.categories);
                        setCategoryId(meta.categories[0].id);
                    }
                    if (meta.genres && meta.genres.length > 0) setGenres(meta.genres);
                    if (meta.tags && meta.tags.length > 0) setTags(meta.tags);
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
                    pdfPageCount: c.pdfPageCount || 35,
                    pdfFile: file
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
                slug,
                languageId,
                categoryId,
                release_date: releaseDate,
                pricing_model: pricingModel,
                coin_price: coinPrice,
                default_chapter_coin_cost: defaultChapterCoinCost,
                default_free_chapters: defaultFreeChapters,
                is_premium: isPremium,
                status: targetStatus,
                chapter_count: chapters.length
            });

            // 2b. Upload cover (book ID now exists): React -> S3 direct, then complete.
            if (pendingCoverFile) {
                try {
                    await uploadBookCover(newBook.id, pendingCoverFile);
                } catch (coverErr: any) {
                    setErrorMessage(`Book created, but cover upload failed: ${extractApiError(coverErr, coverErr?.message || 'unknown error')}. You can retry from the book's Media tab.`);
                }
            }

            // 3. Create Chapters with PDF Content Metadata
            for (const ch of chapters) {
                const createdChapter = await adminChapterService.create({
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

                if (ch.pdfFile) {
                    try {
                        // Store in IndexedDB for immediate, guaranteed offline and local reading
                        await storeChapterPdf(createdChapter.id, ch.pdfFile, ch.pdfFileName);

                        // Upload to S3 if backend S3 endpoint is configured
                        const { uploadUrl, key } = await chapterService.getUploadUrl(createdChapter.id, {
                            fileName: ch.pdfFile.name,
                            fileSize: ch.pdfFile.size,
                            contentType: ch.pdfFile.type || 'application/pdf',
                        });
                        await chapterService.uploadPdfToS3(uploadUrl, ch.pdfFile);
                        await chapterService.uploadComplete(createdChapter.id, {
                            key,
                            fileSize: ch.pdfFile.size,
                            pageCount: ch.pdfPageCount || 30
                        });
                    } catch (pdfErr) {
                        console.warn(`[BookWizard] Chapter ${ch.chapterNo} PDF remote sync notice:`, pdfErr);
                    }
                }
            }

            // 4. Navigate to central book workspace
            navigate(`/admin/books/${newBook.id}`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to finalize book creation.');
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.wizardContainer}>
            <PageHeader
                title="Create Manga Book"
                subtitle="Just follow the steps — it only takes a minute."
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

                    <div className={styles.choiceGrid}>
                        <div
                            onClick={() => setVolumeChoice('none')}
                            className={`${styles.choiceCard} ${volumeChoice === 'none' ? styles.choiceCardActive : ''}`}
                        >
                            <Layers size={24} />
                            <div className={styles.choiceTitle}>No Volume</div>
                            <div className={styles.choiceDesc}>Skip this (recommended)</div>
                        </div>

                        <div
                            onClick={() => setVolumeChoice('existing')}
                            className={`${styles.choiceCard} ${volumeChoice === 'existing' ? styles.choiceCardActive : ''}`}
                        >
                            <FolderKanban size={24} />
                            <div className={styles.choiceTitle}>Existing Volume</div>
                            <div className={styles.choiceDesc}>{seriesVolumes.length} available</div>
                        </div>

                        <div
                            onClick={() => setVolumeChoice('new')}
                            className={`${styles.choiceCard} ${volumeChoice === 'new' ? styles.choiceCardActive : ''}`}
                        >
                            <Plus size={24} />
                            <div className={styles.choiceTitle}>New Volume</div>
                            <div className={styles.choiceDesc}>Create one now</div>
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
                        <h2 className={styles.stepCardTitle}>Step 3 — Book Info</h2>
                        <p className={styles.stepCardSubtitle}>
                            Basic book details and cover image. The cover is uploaded right after the book is created.
                        </p>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Book Title *</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="e.g. The Last Ember - Volume 1"
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Japanese Title</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="Optional"
                                value={japaneseTitle}
                                onChange={(e) => setJapaneseTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>URL Slug (automatic)</label>
                            <input type="text" className={uiStyles.formInput} value={slug} readOnly disabled />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Language</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                value={languages.find(l => l.id === languageId)?.name || 'English'}
                                readOnly
                                disabled
                            />
                        </div>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Author</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="Optional"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Artist / Illustrator</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="Optional"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Primary Category *</label>
                            <select
                                className={uiStyles.formSelect}
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Release Date</label>
                            <input type="date" className={uiStyles.formInput} value={releaseDate} readOnly disabled />
                        </div>
                    </div>

                    <BookCoverUploader
                        pendingFile={pendingCoverFile}
                        onFileSelected={setPendingCoverFile}
                        onError={setErrorMessage}
                    />
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
                                    <label className={uiStyles.formLabel}>PDF File</label>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        value={currentChapter.pdfFileName}
                                        readOnly
                                        placeholder="No PDF attached yet"
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        {(currentChapter.pdfFileSize / (1024 * 1024)).toFixed(1)} MB · {currentChapter.pdfPageCount} pages
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
                                {coverPreview ? (<img src={coverPreview} alt={bookTitle} style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />) : (<div style={{ width: '70px', height: '100px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>No cover</div>)}
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
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{languages.find(l => l.id === languageId)?.name || 'English'}</span>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: pendingCoverFile ? '#10b981' : '#f59e0b' }}>
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
