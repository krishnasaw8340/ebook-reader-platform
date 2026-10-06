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
    Save,
    BookOpen,
    Sparkles,
    AlertCircle,
    Coins,
    HelpCircle,
    RefreshCw,
    Unlock,
    Lock
} from 'lucide-react';
import {
    adminSeriesService,
    adminBookService,
    adminChapterService
} from '../../services/admin/adminServices';
import { chapterService } from '../../services/chapterService';
import { storeChapterPdf } from '../../utils/pdfStorage';
import type { BookSeries, PricingModel } from '../../types';
import { catalogService, type CatalogLanguage, type CatalogCategory, type CatalogGenre, type CatalogTag } from '../../services/catalogService';
import {
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import { generateSlug } from '../../services/seriesService';
import { BookCoverUploader, uploadBookCover, extractApiError } from './BookCoverUploader';
import styles from './BookWizard.module.css';
import uiStyles from '../components/AdminUI.module.css';

const STEPS = [
    { number: 1, title: 'Details & Mode' },
    { number: 2, title: 'Chapter PDFs' },
    { number: 3, title: 'Review & Publish' }
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

export interface ChapterPdfItem {
    id: string;
    fileName: string;
    fileSize: number;
    pageCount: number;
    file?: File;
}

export interface WizardChapter {
    tempId: string;
    chapterNo: number;
    title: string;
    accessType: 'FREE' | 'PAID';
    coinCost: number;
    published: boolean;
    pdfFiles: ChapterPdfItem[];
}

/**
 * Intelligent file name parser that extracts chapter numbers and titles
 */
function parseChapterFromFilename(filename: string, fallbackNumber: number): { chapterNo: number; title: string } {
    const cleanName = filename.replace(/\.[^/.]+$/, '').trim();
    
    const match = cleanName.match(/(?:chapter|ch|ep|episode)?[_.\s-]*(\d+)(?:[_.\s:-]+(.*))?$/i) 
               || cleanName.match(/^(\d+)(?:[_.\s:-]+(.*))?$/i);
    
    if (match) {
        const num = parseInt(match[1], 10);
        const subTitle = match[2]?.trim()?.replace(/^[-:_.]+\s*/, '');
        if (subTitle && subTitle.length > 0) {
            return {
                chapterNo: isNaN(num) ? fallbackNumber : num,
                title: `Chapter ${num}: ${subTitle}`
            };
        }
        return {
            chapterNo: isNaN(num) ? fallbackNumber : num,
            title: `Chapter ${num}`
        };
    }
    
    return {
        chapterNo: fallbackNumber,
        title: cleanName.length > 0 ? cleanName : `Chapter ${fallbackNumber}`
    };
}

export const BookWizard: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitProgressStep, setSubmitProgressStep] = useState<number>(0);
    const [submitStatusText, setSubmitStatusText] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // =========================================================================
    // STEP 1 STATE: MODE & BOOK DETAILS
    // =========================================================================
    const [creationMode, setCreationMode] = useState<'STANDALONE' | 'FRANCHISE'>('STANDALONE');
    
    // Series list for Option B (Franchise)
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [isCreatingSeriesInline, setIsCreatingSeriesInline] = useState(false);
    const [inlineSeriesTitle, setInlineSeriesTitle] = useState('');
    const [inlineSeriesDesc, setInlineSeriesDesc] = useState('');

    // Book Metadata
    const [bookTitle, setBookTitle] = useState('');
    const [japaneseTitle, setJapaneseTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [artist, setArtist] = useState('');
    const [languageId, setLanguageId] = useState('aa47e99c-8a1a-4d5e-970c-db916528b199');
    const [categoryId, setCategoryId] = useState('00142c6a-cf97-4d2f-ab9f-7ad6499f6e26');
    const [selectedGenres, setSelectedGenres] = useState<string[]>(['5d3ab5fb-19eb-40c2-9922-a1d5846578ed']);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    
    // Cover artwork
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    
    // Pricing Defaults: 2 Simple Options: 'FREE' or 'PAID'
    const [pricingType, setPricingType] = useState<'FREE' | 'PAID'>('PAID');
    const [defaultChapterCoinCost, setDefaultChapterCoinCost] = useState<number>(2);
    const [defaultFreeChapters, setDefaultFreeChapters] = useState<number>(2);
    const [isPremium, setIsPremium] = useState<boolean>(true);

    // Catalog Lists
    const [languages, setLanguages] = useState<CatalogLanguage[]>(DEFAULT_LANGUAGES_INIT);
    const [categories, setCategories] = useState<CatalogCategory[]>(DEFAULT_CATEGORIES_INIT);
    const [genres, setGenres] = useState<CatalogGenre[]>(DEFAULT_GENRES_INIT);
    const [tags, setTags] = useState<CatalogTag[]>(DEFAULT_TAGS_INIT);

    // =========================================================================
    // STEP 2 STATE: CHAPTERS & MULTI-PDF UPLOADS
    // =========================================================================
    const [chapters, setChapters] = useState<WizardChapter[]>([
        {
            tempId: 'temp-c1',
            chapterNo: 1,
            title: 'Chapter 1: The Beginning',
            accessType: 'FREE',
            coinCost: 0,
            published: true,
            pdfFiles: [
                {
                    id: 'pdf-c1-1',
                    fileName: 'chapter-001.pdf',
                    pageCount: 32,
                    fileSize: 18500000
                }
            ]
        },
        {
            tempId: 'temp-c2',
            chapterNo: 2,
            title: 'Chapter 2: The Awakening',
            accessType: 'FREE',
            coinCost: 0,
            published: true,
            pdfFiles: [
                {
                    id: 'pdf-c2-1',
                    fileName: 'chapter-002.pdf',
                    pageCount: 28,
                    fileSize: 16000000
                }
            ]
        }
    ]);
    const [isDragOver, setIsDragOver] = useState(false);
    const bulkPdfInputRef = useRef<HTMLInputElement>(null);
    
    // Specific chapter attachment ref
    const targetChapterPdfInputRef = useRef<HTMLInputElement>(null);
    const [targetChapterIndex, setTargetChapterIndex] = useState<number | null>(null);
    const [isReplaceMode, setIsReplaceMode] = useState<boolean>(false);
    const [targetPdfIndex, setTargetPdfIndex] = useState<number | null>(null);

    const releaseDate = new Date().toISOString().split('T')[0];
    const slug = generateSlug(bookTitle);

    // Cover preview hook
    useEffect(() => {
        if (!pendingCoverFile) { setCoverPreview(''); return; }
        const url = URL.createObjectURL(pendingCoverFile);
        setCoverPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingCoverFile]);

    // Load initial series & metadata
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [sList, meta] = await Promise.all([
                    adminSeriesService.getAll(),
                    catalogService.getMetadata().catch(() => null)
                ]);
                setSeriesList(sList);
                if (sList.length > 0 && !selectedSeriesId) {
                    setSelectedSeriesId(sList[0].id);
                }
                if (meta) {
                    if (meta.languages?.length) {
                        setLanguages(meta.languages);
                        setLanguageId(meta.languages[0].id);
                    }
                    if (meta.categories?.length) {
                        setCategories(meta.categories);
                        setCategoryId(meta.categories[0].id);
                    }
                    if (meta.genres?.length) setGenres(meta.genres);
                    if (meta.tags?.length) setTags(meta.tags);
                }
            } catch (err: any) {
                console.warn('[BookWizard] Initial load failed:', err);
            }
        };
        loadInitial();
    }, []);

    const selectedSeriesObj = seriesList.find(s => s.id === selectedSeriesId);

    // Genre toggle helper
    const toggleGenre = (id: string) => {
        if (selectedGenres.includes(id)) {
            setSelectedGenres(selectedGenres.filter(g => g !== id));
        } else {
            setSelectedGenres([...selectedGenres, id]);
        }
    };

    // Inline Series Creation for Option B
    const handleCreateSeriesInline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inlineSeriesTitle.trim()) return;
        try {
            const created = await adminSeriesService.create({
                name: inlineSeriesTitle,
                description: inlineSeriesDesc || undefined,
                cover_image: coverPreview || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&width=800',
                status: 'ONGOING'
            });
            setSeriesList([created, ...seriesList]);
            setSelectedSeriesId(created.id);
            setIsCreatingSeriesInline(false);
            setSuccessMessage(`Franchise series "${created.title}" registered.`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to create franchise series.');
        }
    };

    // =========================================================================
    // BULK CHAPTER PDF PROCESSING
    // =========================================================================
    const processUploadedPdfFiles = (files: FileList | File[]) => {
        const fileArray = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (fileArray.length === 0) {
            setErrorMessage('No valid PDF files selected. Please upload .pdf files.');
            return;
        }

        // Sort files by natural alphanumeric filename
        fileArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        const newChapterItems: WizardChapter[] = fileArray.map((file, idx) => {
            const currentTotal = chapters.length;
            const parsed = parseChapterFromFilename(file.name, currentTotal + idx + 1);
            const chapterNo = currentTotal + idx + 1;
            const isFree = pricingType === 'FREE' || (chapterNo <= defaultFreeChapters);

            return {
                tempId: `temp-pdf-${Date.now()}-${idx}`,
                chapterNo: chapterNo,
                title: parsed.title,
                accessType: isFree ? 'FREE' : 'PAID',
                coinCost: isFree ? 0 : defaultChapterCoinCost,
                published: true,
                pdfFiles: [
                    {
                        id: `pdf-${Date.now()}-${idx}`,
                        fileName: file.name,
                        pageCount: 30,
                        fileSize: file.size,
                        file: file
                    }
                ]
            };
        });

        // If user already had only the default sample chapters, replace them; otherwise append
        const isDefaultState = chapters.length === 2 && chapters[0].tempId === 'temp-c1' && !chapters[0].pdfFiles[0]?.file;
        if (isDefaultState) {
            setChapters(newChapterItems.map((c, i) => ({ ...c, chapterNo: i + 1 })));
        } else {
            setChapters([...chapters, ...newChapterItems]);
        }

        setSuccessMessage(`Successfully added ${newChapterItems.length} chapter PDF(s).`);
    };

    const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processUploadedPdfFiles(e.target.files);
            if (bulkPdfInputRef.current) bulkPdfInputRef.current.value = '';
        }
    };

    // Add or Replace a PDF for a specific chapter
    const handleTargetChapterPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && targetChapterIndex !== null && chapters[targetChapterIndex]) {
            const updated = [...chapters];
            const ch = updated[targetChapterIndex];

            if (isReplaceMode && targetPdfIndex !== null && ch.pdfFiles[targetPdfIndex]) {
                // Replace single PDF
                const file = files[0];
                ch.pdfFiles[targetPdfIndex] = {
                    ...ch.pdfFiles[targetPdfIndex],
                    fileName: file.name,
                    fileSize: file.size,
                    file: file
                };
            } else {
                // Add additional PDF(s) to this chapter
                const newPdfs: ChapterPdfItem[] = Array.from(files).map((f, i) => ({
                    id: `pdf-${Date.now()}-${i}`,
                    fileName: f.name,
                    fileSize: f.size,
                    pageCount: 30,
                    file: f
                }));
                ch.pdfFiles = [...ch.pdfFiles, ...newPdfs];
            }

            setChapters(updated);
            setTargetChapterIndex(null);
            setTargetPdfIndex(null);
            setIsReplaceMode(false);
        }
        if (targetChapterPdfInputRef.current) targetChapterPdfInputRef.current.value = '';
    };

    // Remove single PDF from a chapter
    const handleRemovePdfFromChapter = (chIndex: number, pdfIndex: number) => {
        const updated = [...chapters];
        updated[chIndex].pdfFiles.splice(pdfIndex, 1);
        setChapters(updated);
    };

    // Batch Action: Apply Free chapters count
    const handleApplyFreeChaptersCount = (count: number) => {
        setDefaultFreeChapters(count);
        const updated = chapters.map((c, idx) => {
            const isFree = pricingType === 'FREE' || ((idx + 1) <= count);
            return {
                ...c,
                accessType: isFree ? 'FREE' as const : 'PAID' as const,
                coinCost: isFree ? 0 : (defaultChapterCoinCost || 2)
            };
        });
        setChapters(updated);
    };

    // Batch Action: Apply Coin cost
    const handleApplyCoinCost = (cost: number) => {
        setDefaultChapterCoinCost(cost);
        const updated = chapters.map(c => {
            if (c.accessType === 'PAID') {
                return { ...c, coinCost: cost };
            }
            return c;
        });
        setChapters(updated);
    };

    // Switch overall pricing type (FREE vs PAID)
    const handlePricingTypeChange = (type: 'FREE' | 'PAID') => {
        setPricingType(type);
        if (type === 'FREE') {
            const updated = chapters.map(c => ({
                ...c,
                accessType: 'FREE' as const,
                coinCost: 0
            }));
            setChapters(updated);
        } else {
            const updated = chapters.map((c, idx) => {
                const isFree = (idx + 1) <= defaultFreeChapters;
                return {
                    ...c,
                    accessType: isFree ? 'FREE' as const : 'PAID' as const,
                    coinCost: isFree ? 0 : defaultChapterCoinCost
                };
            });
            setChapters(updated);
        }
    };

    // Chapter Management Helpers
    const handleAddManualChapter = () => {
        const nextNo = chapters.length + 1;
        const isFree = pricingType === 'FREE' || (nextNo <= defaultFreeChapters);
        const newCh: WizardChapter = {
            tempId: `temp-manual-${Date.now()}`,
            chapterNo: nextNo,
            title: `Chapter ${nextNo}`,
            accessType: isFree ? 'FREE' : 'PAID',
            coinCost: isFree ? 0 : defaultChapterCoinCost,
            published: true,
            pdfFiles: []
        };
        setChapters([...chapters, newCh]);
    };

    const handleDeleteChapter = (index: number) => {
        const remaining = chapters.filter((_, i) => i !== index);
        const reordered = remaining.map((c, idx) => ({ ...c, chapterNo: idx + 1 }));
        setChapters(reordered);
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

    // =========================================================================
    // NAVIGATION GUARDS
    // =========================================================================
    const handleNext = () => {
        setErrorMessage(null);
        if (currentStep === 1) {
            if (!bookTitle.trim()) {
                setErrorMessage('Please enter a manga title to continue.');
                return;
            }
            if (creationMode === 'FRANCHISE' && !selectedSeriesId) {
                setErrorMessage('Please choose a franchise series or switch to Standalone mode.');
                return;
            }
        }
        if (currentStep === 2) {
            if (chapters.length === 0) {
                setErrorMessage('Please add at least one chapter before proceeding to Review.');
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };

    const handleBack = () => {
        setErrorMessage(null);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // =========================================================================
    // FINAL MULTI-STEP SUBMISSION
    // =========================================================================
    const handleSubmit = async (targetStatus: 'PUBLISHED' | 'DRAFT') => {
        setSubmitting(true);
        setErrorMessage(null);

        try {
            let finalSeriesId = selectedSeriesId;

            // Step 1: Create Series automatically if Option A (Standalone)
            if (creationMode === 'STANDALONE') {
                setSubmitProgressStep(1);
                setSubmitStatusText('Creating manga franchise series...');
                const createdSeries = await adminSeriesService.create({
                    name: bookTitle,
                    description: description || undefined,
                    cover_image: coverPreview || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&width=800',
                    status: 'ONGOING'
                });
                finalSeriesId = createdSeries.id;
            }

            // Step 2: Create Book Record (Books are always free; restrictions are in chapters)
            setSubmitProgressStep(2);
            setSubmitStatusText('Registering manga book release...');
            const newBook = await adminBookService.create({
                series_id: finalSeriesId,
                volume_id: null,
                title: bookTitle,
                japanese_title: japaneseTitle || null,
                slug,
                languageId,
                categoryId,
                release_date: releaseDate,
                pricing_model: 'PER_CHAPTER',
                coin_price: 0,
                default_chapter_coin_cost: defaultChapterCoinCost,
                default_free_chapters: pricingType === 'FREE' ? chapters.length : defaultFreeChapters,
                is_premium: isPremium,
                status: targetStatus,
                chapter_count: chapters.length
            });

            // Step 3: Upload Cover Artwork if file provided
            if (pendingCoverFile) {
                setSubmitProgressStep(3);
                setSubmitStatusText('Uploading cover artwork to cloud storage...');
                try {
                    await uploadBookCover(newBook.id, pendingCoverFile);
                } catch (coverErr: any) {
                    console.warn('[BookWizard] Cover upload warning:', coverErr);
                }
            }

            // Step 4: Register & Upload Chapter PDFs
            setSubmitProgressStep(4);
            setSubmitStatusText(`Uploading ${chapters.length} chapter assets...`);
            
            for (let i = 0; i < chapters.length; i++) {
                const ch = chapters[i];
                setSubmitStatusText(`Processing Chapter ${ch.chapterNo} of ${chapters.length}: ${ch.title}...`);
                
                const primaryPdf = ch.pdfFiles[0];
                const totalPageCount = ch.pdfFiles.reduce((sum, p) => sum + (p.pageCount || 30), 0) || 30;
                const totalFileSize = ch.pdfFiles.reduce((sum, p) => sum + (p.fileSize || 0), 0);

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
                    pdfFileName: primaryPdf?.fileName || `chapter-${ch.chapterNo}.pdf`,
                    pdf_file_name: primaryPdf?.fileName || `chapter-${ch.chapterNo}.pdf`,
                    pdfPageCount: totalPageCount,
                    pdf_page_count: totalPageCount,
                    pdfFileSize: totalFileSize,
                    pdf_file_size: totalFileSize,
                    contentStatus: 'READY',
                    published: ch.published
                });

                // Store PDF files locally in IndexedDB and upload to S3
                for (const pdfItem of ch.pdfFiles) {
                    if (pdfItem.file) {
                        await storeChapterPdf(createdChapter.id, pdfItem.file, pdfItem.fileName);

                        // Try remote S3 upload
                        try {
                            const { uploadUrl, key } = await chapterService.getUploadUrl(createdChapter.id, {
                                fileName: pdfItem.file.name,
                                fileSize: pdfItem.file.size,
                                contentType: pdfItem.file.type || 'application/pdf'
                            });
                            if (uploadUrl) {
                                await chapterService.uploadPdfToS3(uploadUrl, pdfItem.file);
                                await chapterService.uploadComplete(createdChapter.id, {
                                    fileName: pdfItem.file.name,
                                    fileSize: pdfItem.file.size,
                                    key: key || pdfItem.file.name,
                                    pageCount: pdfItem.pageCount || 30
                                });
                            }
                        } catch (pdfErr) {
                            console.warn(`[BookWizard] Remote S3 upload for chapter ${ch.chapterNo} skipped/stored locally:`, pdfErr);
                        }
                    }
                }
            }

            // Step 5: Finalize
            setSubmitProgressStep(5);
            setSubmitStatusText('Finalizing and publishing manga...');
            
            setTimeout(() => {
                setSubmitting(false);
                navigate(`/admin/books/${newBook.id}`);
            }, 800);

        } catch (err: any) {
            setSubmitting(false);
            setErrorMessage(extractApiError(err, err?.message || 'Failed to create and publish manga.'));
        }
    };

    return (
        <div className={styles.wizardContainer}>
            {/* Header Stepper */}
            <div className={styles.stepperHeader}>
                <div className={styles.stepperMeta}>
                    <div className={styles.stepTitleBig}>
                        {STEPS[currentStep - 1].title} — Step {currentStep} of {STEPS.length}
                    </div>
                    <div className={styles.stepCounter}>Step {currentStep} / {STEPS.length}</div>
                </div>

                <div className={styles.stepperProgressTrack}>
                    <div
                        className={styles.stepperProgressBar}
                        style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    />
                </div>

                <div className={styles.stepsList}>
                    {STEPS.map((s) => (
                        <button
                            key={s.number}
                            type="button"
                            onClick={() => {
                                if (s.number < currentStep) setCurrentStep(s.number);
                            }}
                            className={`${styles.stepPill} ${
                                currentStep === s.number
                                    ? styles.stepPillActive
                                    : s.number < currentStep
                                    ? styles.stepPillCompleted
                                    : ''
                            }`}
                        >
                            <span className={styles.stepPillDot}>
                                {s.number < currentStep ? <Check size={11} strokeWidth={3} /> : s.number}
                            </span>
                            <span>{s.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Banners */}
            {errorMessage && <div style={{ marginBottom: '16px' }}><ErrorBanner message={errorMessage} /></div>}
            {successMessage && <div style={{ marginBottom: '16px' }}><SuccessBanner message={successMessage} /></div>}

            {/* ============================================================ */}
            {/* STEP 1: DETAILS & MODE SELECTION */}
            {/* ============================================================ */}
            {currentStep === 1 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 1 — Manga Details & Creation Mode</h2>
                        <p className={styles.stepCardSubtitle}>
                            Choose whether this is a standalone title or part of an existing franchise, then provide basic catalog information.
                        </p>
                    </div>

                    {/* Mode Cards */}
                    <div className={styles.modeGrid}>
                        <div
                            className={`${styles.modeCard} ${creationMode === 'STANDALONE' ? styles.modeCardActive : ''}`}
                            onClick={() => setCreationMode('STANDALONE')}
                        >
                            <div className={styles.modeIconA}><BookOpen size={24} /></div>
                            <div className={styles.modeContent}>
                                <div className={styles.modeHeader}>
                                    <span className={styles.modeTitle}>Standalone Manga / Book</span>
                                    <span className={styles.modeBadgeRecommended}>Recommended</span>
                                </div>
                                <p className={styles.modeDesc}>
                                    For standalone manga, one-shots, webcomics, or single novels (e.g. <em>Solo Leveling, Death Note, Chainsaw Man</em>). Creates the franchise automatically.
                                </p>
                            </div>
                        </div>

                        <div
                            className={`${styles.modeCard} ${creationMode === 'FRANCHISE' ? styles.modeCardActive : ''}`}
                            onClick={() => setCreationMode('FRANCHISE')}
                        >
                            <div className={styles.modeIconB}><Layers size={24} /></div>
                            <div className={styles.modeContent}>
                                <div className={styles.modeHeader}>
                                    <span className={styles.modeTitle}>Part of Existing Franchise</span>
                                    <span className={styles.modeBadgeFranchise}>Sequel / Season</span>
                                </div>
                                <p className={styles.modeDesc}>
                                    For multi-part series, seasons, or sequels (e.g. <em>Solo Leveling - Season 2</em>). Links directly to an existing franchise.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Franchise Selector if Option B */}
                    {creationMode === 'FRANCHISE' && (
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label className={uiStyles.formLabel} style={{ color: '#60a5fa', fontWeight: 700, margin: 0 }}>
                                    Select Target Franchise Series *
                                </label>
                                <button
                                    type="button"
                                    className={uiStyles.btnSecondary}
                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                    onClick={() => setIsCreatingSeriesInline(!isCreatingSeriesInline)}
                                >
                                    {isCreatingSeriesInline ? 'Choose Existing' : '+ Create New Franchise'}
                                </button>
                            </div>

                            {!isCreatingSeriesInline ? (
                                <select
                                    className={uiStyles.formSelect}
                                    value={selectedSeriesId}
                                    onChange={(e) => setSelectedSeriesId(e.target.value)}
                                >
                                    <option value="" disabled>-- Choose Existing Franchise --</option>
                                    {seriesList.map(s => (
                                        <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
                                    ))}
                                </select>
                            ) : (
                                <form onSubmit={handleCreateSeriesInline} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        placeholder="New Franchise Title (e.g. Solo Leveling Universe)"
                                        value={inlineSeriesTitle}
                                        onChange={(e) => setInlineSeriesTitle(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="text"
                                        className={uiStyles.formInput}
                                        placeholder="Franchise Description (optional)"
                                        value={inlineSeriesDesc}
                                        onChange={(e) => setInlineSeriesDesc(e.target.value)}
                                    />
                                    <button type="submit" className={uiStyles.btnPrimary} style={{ alignSelf: 'flex-start' }}>
                                        Save & Use Franchise
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Book Basic Info Form */}
                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Manga / Book Title *</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="e.g. Solo Leveling, Omniscient Reader, Death Note"
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Japanese / Alternate Title</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="e.g. 나 혼자만 레벨업 (Optional)"
                                value={japaneseTitle}
                                onChange={(e) => setJapaneseTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Synopsis / Description</label>
                        <textarea
                            className={uiStyles.formTextarea}
                            rows={3}
                            placeholder="Write an engaging synopsis for the storefront and catalog reader..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
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
                            <label className={uiStyles.formLabel}>Language</label>
                            <select
                                className={uiStyles.formSelect}
                                value={languageId}
                                onChange={(e) => setLanguageId(e.target.value)}
                            >
                                {languages.map(l => (
                                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
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
                                placeholder="e.g. Chugong"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Artist / Studio</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="e.g. DUBU (REDICE Studio)"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Genres Selection */}
                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Genres</label>
                        <div className={styles.chipsContainer}>
                            {genres.map(g => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => toggleGenre(g.id)}
                                    className={`${styles.chip} ${selectedGenres.includes(g.id) ? styles.chipSelected : ''}`}
                                >
                                    {selectedGenres.includes(g.id) && <Check size={12} />}
                                    {g.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cover Artwork Uploader */}
                    <BookCoverUploader
                        pendingFile={pendingCoverFile}
                        onFileSelected={setPendingCoverFile}
                        onError={setErrorMessage}
                    />

                    {/* 2-Option Monetization Rules: FREE vs PAID */}
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border-subtle)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                            Chapter Monetization Model
                        </h3>

                        <div className={styles.pricingToggleGrid}>
                            <div
                                className={`${styles.pricingToggleCard} ${pricingType === 'FREE' ? styles.pricingToggleActiveFree : ''}`}
                                onClick={() => handlePricingTypeChange('FREE')}
                            >
                                <div className={styles.pricingIconFree}><Unlock size={20} /></div>
                                <div>
                                    <div className={styles.pricingToggleTitle}>100% FREE</div>
                                    <div className={styles.pricingToggleDesc}>All chapters free to read without coins</div>
                                </div>
                            </div>

                            <div
                                className={`${styles.pricingToggleCard} ${pricingType === 'PAID' ? styles.pricingToggleActivePaid : ''}`}
                                onClick={() => handlePricingTypeChange('PAID')}
                            >
                                <div className={styles.pricingIconPaid}><Coins size={20} /></div>
                                <div>
                                    <div className={styles.pricingToggleTitle}>PAID (Coins)</div>
                                    <div className={styles.pricingToggleDesc}>Chapters unlock with Coins (e.g. 2 Coins/chapter)</div>
                                </div>
                            </div>
                        </div>

                        {pricingType === 'PAID' && (
                            <div className={uiStyles.formGrid} style={{ marginTop: '14px' }}>
                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Default Paid Chapter Cost (Coins)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={uiStyles.formInput}
                                        value={defaultChapterCoinCost}
                                        onChange={(e) => handleApplyCoinCost(parseInt(e.target.value) || 1)}
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coins required per locked chapter</p>
                                </div>

                                <div className={uiStyles.formGroup}>
                                    <label className={uiStyles.formLabel}>Free Preview Chapters Count</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className={uiStyles.formInput}
                                        value={defaultFreeChapters}
                                        onChange={(e) => handleApplyFreeChaptersCount(parseInt(e.target.value) || 0)}
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Initial chapters available for free</p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                            <input
                                type="checkbox"
                                id="premiumToggle"
                                checked={isPremium}
                                onChange={(e) => setIsPremium(e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                            />
                            <label htmlFor="premiumToggle" style={{ fontSize: '13px', color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                                Feature in Storefront Spotlight & Top Trending Carousels
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: CHAPTER PDFS & MULTI-PDF MANAGEMENT */}
            {/* ============================================================ */}
            {currentStep === 2 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <h2 className={styles.stepCardTitle}>Step 2 — Upload Chapter PDFs</h2>
                                <p className={styles.stepCardSubtitle}>
                                    Upload chapter PDFs. You can attach multiple PDF files to a single chapter (e.g. Part 1 & Part 2).
                                </p>
                            </div>
                            <button
                                type="button"
                                className={uiStyles.btnPrimary}
                                onClick={handleAddManualChapter}
                            >
                                <Plus size={14} /> Add Empty Chapter
                            </button>
                        </div>
                    </div>

                    {/* Bulk Drag & Drop Zone */}
                    <div
                        className={`${styles.bulkDropzone} ${isDragOver ? styles.bulkDropzoneActive : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                processUploadedPdfFiles(e.dataTransfer.files);
                            }
                        }}
                        onClick={() => bulkPdfInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={bulkPdfInputRef}
                            multiple
                            accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={handleBulkFileChange}
                        />
                        <div className={styles.dropzoneIconCircle}>
                            <UploadCloud size={28} />
                        </div>
                        <div className={styles.dropzoneTitle}>Drop your Chapter PDF files here</div>
                        <div className={styles.dropzoneSubtitle}>
                            Select or drop multiple files (e.g. <code>01.pdf</code>, <code>02.pdf</code>, <code>Ch 03 - Awakening.pdf</code>). Automatically sorted into chapters.
                        </div>
                        <div className={styles.dropzoneBrowseBtn}>
                            <Plus size={14} /> Browse PDF Files
                        </div>
                    </div>

                    {/* Hidden Chapter-Specific PDF input */}
                    <input
                        type="file"
                        ref={targetChapterPdfInputRef}
                        multiple={!isReplaceMode}
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleTargetChapterPdfChange}
                    />

                    {/* Batch Actions Toolbar */}
                    <div className={styles.chapterToolbar}>
                        <div className={styles.batchControls}>
                            {pricingType === 'PAID' ? (
                                <>
                                    <div className={styles.batchGroup}>
                                        <span>First</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={chapters.length}
                                            className={styles.batchInput}
                                            value={defaultFreeChapters}
                                            onChange={(e) => handleApplyFreeChaptersCount(parseInt(e.target.value) || 0)}
                                        />
                                        <span>chapters are FREE</span>
                                    </div>

                                    <div className={styles.batchGroup}>
                                        <span>Paid cost:</span>
                                        <input
                                            type="number"
                                            min={1}
                                            className={styles.batchInput}
                                            value={defaultChapterCoinCost}
                                            onChange={(e) => handleApplyCoinCost(parseInt(e.target.value) || 1)}
                                        />
                                        <span>Coins</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Unlock size={14} /> All chapters are set to 100% FREE
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                                Total: {chapters.length} chapters · {chapters.reduce((sum, c) => sum + c.pdfFiles.length, 0)} PDF files
                            </span>
                            {chapters.length > 0 && (
                                <button
                                    type="button"
                                    className={uiStyles.btnSecondary}
                                    style={{ fontSize: '11px', padding: '4px 8px', color: '#ef4444' }}
                                    onClick={() => setChapters([])}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Chapter Cards List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {chapters.map((ch, idx) => (
                            <div key={ch.tempId} className={styles.chapterCardItem}>
                                <div className={styles.chapterRowMain}>
                                    <div className={styles.chapterInfoGroup}>
                                        <span className={styles.chapterNumBadge}>#{ch.chapterNo}</span>
                                        <input
                                            type="text"
                                            className={styles.chapterTitleInput}
                                            value={ch.title}
                                            onChange={(e) => {
                                                const updated = [...chapters];
                                                updated[idx].title = e.target.value;
                                                setChapters(updated);
                                            }}
                                            placeholder={`Chapter ${ch.chapterNo}`}
                                        />
                                    </div>

                                    <div className={styles.chapterPricingGroup}>
                                        <select
                                            className={uiStyles.formSelect}
                                            style={{ width: '100px', padding: '5px 8px', fontSize: '12px' }}
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
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className={uiStyles.formInput}
                                                    style={{ width: '55px', padding: '5px 6px', fontSize: '12px', textAlign: 'center' }}
                                                    value={ch.coinCost}
                                                    onChange={(e) => {
                                                        const updated = [...chapters];
                                                        updated[idx].coinCost = parseInt(e.target.value) || 1;
                                                        setChapters(updated);
                                                    }}
                                                />
                                                <Coins size={13} color="#fbbf24" />
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.chapterActionsGroup}>
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
                                            style={{ color: '#ef4444' }}
                                            title="Delete Chapter"
                                            onClick={() => handleDeleteChapter(idx)}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Multiple PDF Files Attached to this Chapter */}
                                <div className={styles.chapterPdfSection}>
                                    <div className={styles.chapterPdfSectionHeader}>
                                        <span>Attached PDF Files ({ch.pdfFiles.length})</span>
                                        {ch.pdfFiles.length > 0 && (
                                            <span>
                                                Total Size: {(ch.pdfFiles.reduce((s, p) => s + p.fileSize, 0) / (1024 * 1024)).toFixed(1)} MB
                                            </span>
                                        )}
                                    </div>

                                    {ch.pdfFiles.length > 0 ? (
                                        <div className={styles.pdfFileList}>
                                            {ch.pdfFiles.map((pdfItem, pdfIdx) => (
                                                <div key={pdfItem.id} className={styles.pdfFileItem}>
                                                    <div className={styles.pdfFileNameGroup}>
                                                        <FileText size={14} color="#38bdf8" />
                                                        <span>{pdfItem.fileName}</span>
                                                    </div>

                                                    <div className={styles.pdfFileMetaGroup}>
                                                        <span className={styles.pdfMetaText}>
                                                            {(pdfItem.fileSize / (1024 * 1024)).toFixed(1)} MB · ~{pdfItem.pageCount || 30} pgs
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className={uiStyles.btnSecondary}
                                                            style={{ padding: '2px 8px', fontSize: '11px' }}
                                                            onClick={() => {
                                                                setTargetChapterIndex(idx);
                                                                setTargetPdfIndex(pdfIdx);
                                                                setIsReplaceMode(true);
                                                                targetChapterPdfInputRef.current?.click();
                                                            }}
                                                        >
                                                            <RefreshCw size={10} /> Replace
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={uiStyles.btnIcon}
                                                            style={{ padding: '2px 4px', color: '#ef4444' }}
                                                            title="Remove this PDF"
                                                            onClick={() => handleRemovePdfFromChapter(idx, pdfIdx)}
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                                            No PDF attached yet. Add a PDF file below.
                                        </div>
                                    )}

                                    {/* Add another PDF to this Chapter */}
                                    <button
                                        type="button"
                                        className={styles.btnAddPdfToChapter}
                                        onClick={() => {
                                            setTargetChapterIndex(idx);
                                            setTargetPdfIndex(null);
                                            setIsReplaceMode(false);
                                            targetChapterPdfInputRef.current?.click();
                                        }}
                                    >
                                        <Plus size={12} /> {ch.pdfFiles.length > 0 ? 'Add Another PDF to this Chapter' : 'Attach PDF File'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: REVIEW & PUBLISH */}
            {/* ============================================================ */}
            {currentStep === 3 && (
                <div className={styles.stepCard}>
                    <div className={styles.stepCardHeader}>
                        <h2 className={styles.stepCardTitle}>Step 3 — Review & Publish</h2>
                        <p className={styles.stepCardSubtitle}>
                            Validate final catalog attributes, inspect chapter structures, and publish or save as draft.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {/* Summary Card */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                                {coverPreview ? (
                                    <img src={coverPreview} alt={bookTitle} style={{ width: '80px', height: '115px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                ) : (
                                    <div style={{ width: '80px', height: '115px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        No cover
                                    </div>
                                )}
                                <div>
                                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                        {bookTitle}
                                    </h3>
                                    {japaneseTitle && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{japaneseTitle}</div>}
                                    <div style={{ fontSize: '12px', color: creationMode === 'STANDALONE' ? '#10b981' : 'var(--primary)', fontWeight: 700 }}>
                                        {creationMode === 'STANDALONE' ? '🟢 Standalone Manga' : `🔵 Franchise: ${selectedSeriesObj?.title || 'Selected'}`}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{categories.find(c => c.id === categoryId)?.name || 'Manga'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Language:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{languages.find(l => l.id === languageId)?.name || 'English'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Monetization:</span>
                                    <span style={{ color: pricingType === 'FREE' ? '#10b981' : '#fbbf24', fontWeight: 700 }}>
                                        {pricingType === 'FREE' ? '100% FREE' : `PAID (${defaultChapterCoinCost} Coins)`}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Chapters:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{chapters.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Attached PDFs:</span>
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                                        {chapters.reduce((sum, c) => sum + c.pdfFiles.length, 0)} files
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Free Chapters:</span>
                                    <span style={{ color: '#10b981', fontWeight: 700 }}>
                                        {chapters.filter(c => c.accessType === 'FREE').length} free
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Pre-Flight Checklist */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '14px' }}>
                                Pre-Flight Readiness Checklist
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#10b981' }}>
                                    <CheckCircle2 size={16} />
                                    <span>{creationMode === 'STANDALONE' ? 'Automatic Franchise registration ready' : 'Franchise link verified'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: bookTitle ? '#10b981' : '#ef4444' }}>
                                    <CheckCircle2 size={16} />
                                    <span>Manga title & synopsis verified</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: pendingCoverFile ? '#10b981' : '#f59e0b' }}>
                                    <CheckCircle2 size={16} />
                                    <span>{pendingCoverFile ? 'Custom artwork selected' : 'Default cover artwork will be applied'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: chapters.length > 0 ? '#10b981' : '#ef4444' }}>
                                    <CheckCircle2 size={16} />
                                    <span>{chapters.length} chapters configured ({chapters.reduce((sum, c) => sum + c.pdfFiles.length, 0)} PDF assets)</span>
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
                    {currentStep < 3 ? (
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
                                <Sparkles size={14} /> Publish Manga Book
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Live Multi-Step Submission Progress Modal */}
            {submitting && (
                <div className={styles.progressModalOverlay}>
                    <div className={styles.progressModalCard}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Sparkles size={24} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                            Publishing {bookTitle}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                            {submitStatusText || 'Executing creation pipeline...'}
                        </p>

                        <div className={styles.progressList}>
                            <div className={`${styles.progressItem} ${submitProgressStep >= 1 ? styles.progressItemDone : ''}`}>
                                <Check size={14} />
                                <span>1. Registering Franchise Series</span>
                            </div>
                            <div className={`${styles.progressItem} ${submitProgressStep >= 2 ? styles.progressItemDone : submitProgressStep === 1 ? styles.progressItemActive : ''}`}>
                                <Check size={14} />
                                <span>2. Creating Book Record & Metadata</span>
                            </div>
                            <div className={`${styles.progressItem} ${submitProgressStep >= 3 ? styles.progressItemDone : submitProgressStep === 2 ? styles.progressItemActive : ''}`}>
                                <Check size={14} />
                                <span>3. Uploading Cover Artwork</span>
                            </div>
                            <div className={`${styles.progressItem} ${submitProgressStep >= 4 ? styles.progressItemDone : submitProgressStep === 3 ? styles.progressItemActive : ''}`}>
                                <Check size={14} />
                                <span>4. Registering Chapters & Uploading PDFs</span>
                            </div>
                            <div className={`${styles.progressItem} ${submitProgressStep >= 5 ? styles.progressItemDone : submitProgressStep === 4 ? styles.progressItemActive : ''}`}>
                                <Check size={14} />
                                <span>5. Finalizing Storefront Publication</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
