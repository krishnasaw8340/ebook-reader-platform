import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    UploadCloud,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    FileArchive,
    Eye,
    RotateCcw
} from 'lucide-react';
import {
    adminUploadService,
    adminSeriesService,
    adminVolumeService
} from '../../services/admin/adminServices';
import type { UploadJob, BookSeries, Volume } from '../../types';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner,
    Modal,
    CustomSelect
} from '../components/AdminUI';
import styles from './AdminUploads.module.css';
import uiStyles from '../components/AdminUI.module.css';

const STAGES = [
    'Uploading',
    'Processing',
    'Extracting',
    'Validating',
    'Generating PDF preview',
    'Completed'
];

export const AdminUploads: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialAction = searchParams.get('action');

    const [jobs, setJobs] = useState<UploadJob[]>([]);
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [volumesList, setVolumesList] = useState<Volume[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Ingestion Modal State
    const [uploadModalOpen, setUploadModalOpen] = useState(initialAction === 'new');
    const [selectedSeriesId, setSelectedSeriesId] = useState('');
    const [volumeOption, setVolumeOption] = useState<'none' | 'existing'>('none');
    const [selectedVolumeId, setSelectedVolumeId] = useState('');
    const [bookTitle, setBookTitle] = useState('');
    const [language, setLanguage] = useState('English');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Active Processing & Review
    const [activeJob, setActiveJob] = useState<UploadJob | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [errorModalJob, setErrorModalJob] = useState<UploadJob | null>(null);
    const [publishingJobId, setPublishingJobId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [jList, sList, vList] = await Promise.all([
                adminUploadService.getAllJobs(),
                adminSeriesService.getAll(),
                adminVolumeService.getAll()
            ]);
            setJobs(jList);
            setSeriesList(sList);
            setVolumesList(vList);
            if (sList.length > 0 && !selectedSeriesId) {
                setSelectedSeriesId(sList[0].id);
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load upload jobs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setUploadModalOpen(true);
        }
    }, [searchParams]);

    // Handle Start Upload Pipeline
    const handleStartUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorMessage('Please select a ZIP/archive file to upload.');
            return;
        }
        if (!selectedSeriesId) {
            setErrorMessage('Please choose a parent franchise series.');
            return;
        }
        if (!bookTitle.trim()) {
            setErrorMessage('Book title is required.');
            return;
        }

        const seriesObj = seriesList.find(s => s.id === selectedSeriesId);
        const volumeObj = volumesList.find(v => v.id === selectedVolumeId);

        try {
            const created = await adminUploadService.createJob({
                file: { name: selectedFile.name, size: selectedFile.size },
                seriesId: selectedSeriesId,
                seriesTitle: seriesObj?.title || 'Franchise',
                volumeId: volumeOption === 'existing' ? selectedVolumeId : null,
                volumeTitle: volumeOption === 'existing' ? volumeObj?.title : null,
                bookTitle,
                language
            });

            setUploadModalOpen(false);
            setSelectedFile(null);
            setBookTitle('');
            setSuccessMessage(`Package ${created.file_name} uploaded. Pipeline processing started.`);
            loadData();

            // Open review / progress for this job
            setActiveJob(created);
            setReviewModalOpen(true);

            // Simulate progression
            simulatePipelineStages(created.id);
        } catch (err: any) {
            setErrorMessage(err.message || 'Upload initialization failed.');
        }
    };

    // Simulated ingestion steps
    const simulatePipelineStages = async (jobId: string) => {
        const stageOrder: Array<UploadJob['stage']> = [
            'Uploading',
            'Processing',
            'Extracting',
            'Validating',
            'Generating PDF preview',
            'Completed'
        ];

        for (let i = 0; i < stageOrder.length; i++) {
            const stage = stageOrder[i];
            const progress = Math.round(((i + 1) / stageOrder.length) * 100);
            await new Promise(r => setTimeout(r, 600));

            const isDone = i === stageOrder.length - 1;
            const updated = await adminUploadService.updateJob(jobId, {
                stage,
                progress,
                status: isDone ? 'COMPLETED' : 'PROCESSING',
                chapters_detected: 12,
                pdf_pages_detected: 248,
                warnings: [
                    'Chapter 7 contains duplicate scan: 014_rev.jpg (auto-filtered)',
                    'Chapter 10 is missing page 15 placeholder (sequence continuous)'
                ]
            });

            setActiveJob(prev => (prev?.id === jobId ? updated : prev));
            setJobs(prevJobs => prevJobs.map(j => (j.id === jobId ? updated : j)));
        }
    };

    // Retry a failed job
    const handleRetryJob = async (jobId: string) => {
        try {
            const retried = await adminUploadService.retryJob(jobId);
            setSuccessMessage(`Job ${retried.file_name} requeued for pipeline execution.`);
            loadData();
            simulatePipelineStages(jobId);
        } catch (err: any) {
            setErrorMessage(err.message || 'Retry failed.');
        }
    };

    // Publish detected structure
    const handlePublishJob = async (jobId: string) => {
        setPublishingJobId(jobId);
        setErrorMessage(null);
        try {
            const createdBook = await adminUploadService.publishJob(jobId);
            setSuccessMessage(`Book "${createdBook.title}" successfully ingested and published to catalog!`);
            setReviewModalOpen(false);
            loadData();
            navigate(`/admin/books/${createdBook.id}`);
        } catch (err: any) {
            setErrorMessage(err.message || 'Publishing failed.');
        } finally {
            setPublishingJobId(null);
        }
    };

    const filteredJobs = jobs.filter(j => {
        const matchesQuery = j.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (j.book_title && j.book_title.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = !statusFilter || j.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    const seriesVolumes = volumesList.filter(v => v.series_id === selectedSeriesId);

    return (
        <div className={styles.container}>
            <PageHeader
                title="Complete Book Upload & Ingestion Monitor"
                subtitle="Upload complete multi-chapter ZIP archives, track automated extraction & DRM processing, and inspect detected catalog structures."
                breadcrumbs={[
                    { label: 'Admin', path: '/admin/dashboard' },
                    { label: 'Uploads & Ingestion' }
                ]}
                actions={
                    <button
                        className={uiStyles.btnPrimary}
                        onClick={() => setUploadModalOpen(true)}
                    >
                        <UploadCloud size={16} /> + Upload Book Package
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Filter & Search */}
            <div className={uiStyles.filterBar}>
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by file name or book title..."
                />

                <div className={uiStyles.filterGroup} style={{ minWidth: '220px' }}>
                    <CustomSelect
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        options={[
                            { value: '', label: `All Statuses (${jobs.length})` },
                            { value: 'COMPLETED', label: 'COMPLETED' },
                            { value: 'PROCESSING', label: 'PROCESSING' },
                            { value: 'FAILED', label: 'FAILED' },
                            { value: 'PUBLISHED', label: 'PUBLISHED' },
                            { value: 'QUEUED', label: 'QUEUED' }
                        ]}
                    />
                </div>
            </div>

            {/* Ingestion Jobs Table */}
            <div className={uiStyles.tableCard}>
                {loading ? (
                    <LoadingState message="Loading upload ingestion jobs..." />
                ) : filteredJobs.length === 0 ? (
                    <EmptyState
                        title="No upload jobs found"
                        description="Upload your first complete manga ZIP package to begin automated ingestion."
                        action={
                            <button className={uiStyles.btnPrimary} onClick={() => setUploadModalOpen(true)}>
                                <UploadCloud size={14} /> Upload Book Package
                            </button>
                        }
                    />
                ) : (
                    <div className={uiStyles.tableWrapper}>
                        <table className={uiStyles.dataTable}>
                            <thead>
                                <tr>
                                    <th>File Package</th>
                                    <th>Target Book & Series</th>
                                    <th>Status</th>
                                    <th>Pipeline Stage</th>
                                    <th>Detected Structure</th>
                                    <th>Started</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.map((job) => (
                                    <tr key={job.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileArchive size={16} color="var(--primary)" />
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                                                        {job.file_name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {job.file_size ? `${(job.file_size / (1024 * 1024)).toFixed(1)} MB` : 'Archive'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                                                {job.book_title || 'Untitled Book'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                {job.series_title || 'Series'} {job.volume_title ? `• ${job.volume_title}` : '• Direct Series'}
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={job.status} />
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '110px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>{job.stage || job.status}</span>
                                                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{job.progress}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{
                                                            width: `${job.progress}%`,
                                                            height: '100%',
                                                            background: job.status === 'FAILED' ? '#ef4444' : job.status === 'COMPLETED' ? '#10b981' : 'var(--primary)',
                                                            transition: 'width 0.3s'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                                {job.chapters_detected} Ch • {job.pdf_pages_detected || 0} PDF Pgs
                                            </span>
                                            {job.warnings && job.warnings.length > 0 && (
                                                <div style={{ fontSize: '10px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                                    <AlertTriangle size={10} /> {job.warnings.length} warning(s)
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(job.started_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                {job.status === 'FAILED' ? (
                                                    <>
                                                        <button
                                                            className={uiStyles.btnSecondary}
                                                            style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444' }}
                                                            onClick={() => setErrorModalJob(job)}
                                                        >
                                                            View Error
                                                        </button>
                                                        <button
                                                            className={uiStyles.btnSecondary}
                                                            style={{ padding: '4px 8px', fontSize: '11px' }}
                                                            onClick={() => handleRetryJob(job.id)}
                                                        >
                                                            <RotateCcw size={12} /> Retry
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className={uiStyles.btnSecondary}
                                                        style={{ padding: '4px 8px', fontSize: '11px' }}
                                                        onClick={() => {
                                                            setActiveJob(job);
                                                            setReviewModalOpen(true);
                                                        }}
                                                    >
                                                        <Eye size={12} /> Review Structure
                                                    </button>
                                                )}

                                                {job.status === 'COMPLETED' && (
                                                    <button
                                                        className={uiStyles.btnPrimary}
                                                        style={{ padding: '4px 8px', fontSize: '11px' }}
                                                        onClick={() => handlePublishJob(job.id)}
                                                        disabled={publishingJobId === job.id}
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ============================================================ */}
            {/* INGESTION MODAL: UPLOAD COMPLETE BOOK PACKAGE */}
            {/* ============================================================ */}
            <Modal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                title="Upload Complete Book Package (ZIP Ingestion)"
                maxWidth="640px"
                footer={
                    <>
                        <button className={uiStyles.btnSecondary} onClick={() => setUploadModalOpen(false)}>
                            Cancel
                        </button>
                        <button className={uiStyles.btnPrimary} onClick={handleStartUpload}>
                            <UploadCloud size={14} /> Start Automated Ingestion
                        </button>
                    </>
                }
            >
                <form onSubmit={handleStartUpload}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Upload a compressed archive (ZIP) containing chapter folders and sequential page images. Our ingestion worker will extract, validate, and compile deterministic DRM pages.
                    </p>

                    <div className={uiStyles.formGroup}>
                        <CustomSelect
                            label="Target Franchise Series *"
                            value={selectedSeriesId}
                            onChange={(val) => setSelectedSeriesId(val)}
                            options={seriesList.map(s => ({ value: s.id, label: s.title }))}
                            placeholder="Select Target Series"
                        />
                    </div>

                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Volume Assignment (Optional)</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <button
                                type="button"
                                className={`${uiStyles.btnSecondary} ${volumeOption === 'none' ? uiStyles.btnPrimary : ''}`}
                                style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                                onClick={() => setVolumeOption('none')}
                            >
                                Direct Series (No Volume)
                            </button>
                            <button
                                type="button"
                                className={`${uiStyles.btnSecondary} ${volumeOption === 'existing' ? uiStyles.btnPrimary : ''}`}
                                style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                                onClick={() => setVolumeOption('existing')}
                            >
                                Select Volume
                            </button>
                        </div>

                        {volumeOption === 'existing' && (
                            <CustomSelect
                                value={selectedVolumeId}
                                onChange={(val) => setSelectedVolumeId(val)}
                                options={[
                                    { value: '', label: '-- Choose Volume --' },
                                    ...seriesVolumes.map(v => ({ value: v.id, label: `Vol. ${v.volume_no}: ${v.title}` }))
                                ]}
                                placeholder="Choose Volume"
                            />
                        )}
                    </div>

                    <div className={uiStyles.formGrid}>
                        <div className={uiStyles.formGroup}>
                            <label className={uiStyles.formLabel}>Book Release Title *</label>
                            <input
                                type="text"
                                className={uiStyles.formInput}
                                placeholder="e.g. Volume 1 Digital English Release"
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className={uiStyles.formGroup}>
                            <CustomSelect
                                label="Language"
                                value={language}
                                onChange={(val) => setLanguage(val)}
                                options={[
                                    { value: 'English', label: 'English' },
                                    { value: 'Japanese', label: 'Japanese' },
                                    { value: 'Spanish', label: 'Spanish' },
                                    { value: 'French', label: 'French' }
                                ]}
                            />
                        </div>
                    </div>

                    {/* ZIP Dropzone */}
                    <div className={uiStyles.formGroup}>
                        <label className={uiStyles.formLabel}>Book ZIP / Package Archive *</label>
                        <div
                            style={{
                                border: '2px dashed var(--glass-border)',
                                borderRadius: '8px',
                                padding: '24px',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                cursor: 'pointer'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".zip,.tar,.gz,.cbz"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setSelectedFile(e.target.files[0]);
                                        if (!bookTitle) {
                                            const base = e.target.files[0].name.replace(/\.[^/.]+$/, '');
                                            setBookTitle(base.replace(/[-_]+/g, ' '));
                                        }
                                    }
                                }}
                            />
                            <FileArchive size={36} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                            {selectedFile ? (
                                <div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '14px' }}>
                                        {selectedFile.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB ready to ingest
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>
                                        Click or drop <strong>book.zip</strong> package archive
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Supports ZIP, CBZ with folder structure (chapter-001/001.jpg)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ============================================================ */}
            {/* UPLOAD REVIEW SCREEN MODAL */}
            {/* ============================================================ */}
            <Modal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                title={`Detected Structure Review: ${activeJob?.file_name || 'Book Package'}`}
                maxWidth="760px"
                footer={
                    <>
                        <button className={uiStyles.btnSecondary} onClick={() => setReviewModalOpen(false)}>
                            Close Review
                        </button>
                        {activeJob?.status === 'COMPLETED' && (
                            <button
                                className={uiStyles.btnPrimary}
                                onClick={() => activeJob && handlePublishJob(activeJob.id)}
                                disabled={publishingJobId === activeJob?.id}
                            >
                                <CheckCircle2 size={14} /> {publishingJobId ? 'Publishing...' : 'Publish to Catalog'}
                            </button>
                        )}
                    </>
                }
            >
                {activeJob && (
                    <div>
                        {/* Progress Stepper for Ingestion */}
                        <div className={styles.stagesList}>
                            {STAGES.map((s, idx) => {
                                const currentIndex = STAGES.indexOf(activeJob.stage || 'Completed');
                                const isDone = idx < currentIndex || activeJob.status === 'COMPLETED' || activeJob.status === 'PUBLISHED';
                                const isActive = idx === currentIndex && activeJob.status === 'PROCESSING';

                                return (
                                    <div key={s} className={styles.stageItem}>
                                        <div className={`${styles.stageDot} ${isActive ? styles.stageDotActive : ''} ${isDone ? styles.stageDotDone : ''}`}>
                                            {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                                        </div>
                                        <span className={`${styles.stageLabel} ${isActive ? styles.stageLabelActive : ''}`}>{s}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Detected Metadata Grid */}
                        <div className={styles.detectedGrid}>
                            <div className={styles.detectedItem}>
                                <div className={styles.detectedLabel}>Franchise Series</div>
                                <div className={styles.detectedVal}>{activeJob.series_title || 'Direct Series'}</div>
                            </div>
                            <div className={styles.detectedItem}>
                                <div className={styles.detectedLabel}>Volume Grouping</div>
                                <div className={styles.detectedVal}>{activeJob.volume_title || 'No Volume'}</div>
                            </div>
                            <div className={styles.detectedItem}>
                                <div className={styles.detectedLabel}>Book Release</div>
                                <div className={styles.detectedVal}>{activeJob.book_title || 'Untitled'}</div>
                            </div>
                            <div className={styles.detectedItem}>
                                <div className={styles.detectedLabel}>Chapters Detected</div>
                                <div className={styles.detectedVal}>{activeJob.chapters_detected} Chapters</div>
                            </div>
                            <div className={styles.detectedItem}>
                                <div className={styles.detectedLabel}>Pages Detected</div>
                                <div className={styles.detectedVal}>{activeJob.pdf_pages_detected || 0} PDF Pages</div>
                            </div>
                            <div className={styles.detectedItem}>
                                <div className={styles.detectedLabel}>Ingestion Status</div>
                                <div className={styles.detectedVal}><StatusBadge status={activeJob.status} /></div>
                            </div>
                        </div>

                        {/* Validation Warnings Alert Box */}
                        {activeJob.warnings && activeJob.warnings.length > 0 && (
                            <div className={styles.warningBox}>
                                <div className={styles.warningTitle}>
                                    <AlertTriangle size={16} /> Extraction & Parsing Warnings
                                </div>
                                <ul className={styles.warningList}>
                                    {activeJob.warnings.map((w, idx) => (
                                        <li key={idx}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Detected Chapter List */}
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                            Detected Chapters Hierarchy
                        </h4>
                        <div className={styles.chapterCardList}>
                            {activeJob.detected_structure?.chapters.map((ch) => (
                                <div key={ch.chapter_no} className={styles.chapterPreviewItem}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{ch.chapter_no}</span>
                                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{ch.title}</span>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)' }}>{ch.pdf_page_count || 24} PDF pages</span>
                                </div>
                            )) || (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px' }}>
                                    Structure analysis complete. Ready for publishing.
                                </div>
                            )}
                        </div>

                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ⚠️ Never automatically publish invalid or corrupt packages. Verify detected structure before approving.
                        </p>
                    </div>
                )}
            </Modal>

            {/* Error Inspection Dialog */}
            <Modal
                isOpen={!!errorModalJob}
                onClose={() => setErrorModalJob(null)}
                title="Ingestion Error Details"
                footer={
                    <>
                        <button className={uiStyles.btnSecondary} onClick={() => setErrorModalJob(null)}>
                            Close
                        </button>
                        <button
                            className={uiStyles.btnPrimary}
                            onClick={() => {
                                if (errorModalJob) handleRetryJob(errorModalJob.id);
                                setErrorModalJob(null);
                            }}
                        >
                            <RotateCcw size={14} /> Retry Ingestion Pipeline
                        </button>
                    </>
                }
            >
                {errorModalJob && (
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <XCircle size={28} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                                Ingestion Failed on {errorModalJob.file_name}
                            </div>
                            <p style={{ fontSize: '13px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)', fontFamily: 'monospace' }}>
                                {errorModalJob.error || 'Unknown ingestion pipeline crash. Please check archive file integrity.'}
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                                Resuming or retrying will reload the package without requiring a repeat upload if stored on the backend.
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
