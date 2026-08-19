import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    RefreshCw,
    ExternalLink
} from 'lucide-react';
import { adminSeriesService } from '../../services/admin/adminServices';
import type { BookSeries } from '../../types';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    Modal,
    ConfirmDialog,
    FileUploadDropzone,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

export const AdminSeries: React.FC = () => {
    const navigate = useNavigate();
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Create / Edit modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSeries, setEditingSeries] = useState<BookSeries | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formCover, setFormCover] = useState('');
    const [formStatus, setFormStatus] = useState<'ONGOING' | 'COMPLETED'>('ONGOING');

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<BookSeries | null>(null);

    const loadSeries = async () => {
        setLoading(true);
        try {
            const data = await adminSeriesService.getAll(searchQuery);
            setSeriesList(data);
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load series catalog.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSeries();
    }, [searchQuery]);

    const openCreateModal = () => {
        setEditingSeries(null);
        setFormTitle('');
        setFormDesc('');
        setFormCover('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400');
        setFormStatus('ONGOING');
        setModalOpen(true);
    };

    const openEditModal = (series: BookSeries) => {
        setEditingSeries(series);
        setFormTitle(series.title);
        setFormDesc(series.description || '');
        setFormCover(series.cover_image || '');
        setFormStatus(series.status || 'ONGOING');
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!formTitle.trim()) {
            setErrorMessage('Series title is required.');
            return;
        }

        try {
            if (editingSeries) {
                await adminSeriesService.update(editingSeries.id, {
                    title: formTitle,
                    description: formDesc,
                    cover_image: formCover,
                    status: formStatus
                });
                setSuccessMessage(`Series "${formTitle}" updated successfully.`);
            } else {
                await adminSeriesService.create({
                    title: formTitle,
                    description: formDesc,
                    cover_image: formCover,
                    status: formStatus
                });
                setSuccessMessage(`Series "${formTitle}" created successfully.`);
            }
            setModalOpen(false);
            loadSeries();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save series.');
        }
    };

    const handleToggleStatus = async (seriesId: string) => {
        try {
            const updated = await adminSeriesService.toggleStatus(seriesId);
            setSuccessMessage(`Series status updated to ${updated.status}.`);
            loadSeries();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to toggle status.');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminSeriesService.delete(deleteTarget.id);
            setSuccessMessage(`Series "${deleteTarget.title}" deleted.`);
            setDeleteTarget(null);
            loadSeries();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to delete series.');
        }
    };

    return (
        <div>
            <PageHeader
                title="Manga Series Catalog"
                subtitle="Manage franchise titles, overarching descriptions, and serialization statuses."
                actions={
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={16} /> New Series
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            <div className={styles.filterBar}>
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search series by title or plot..."
                />
            </div>

            <div className={styles.tableCard}>
                {loading ? (
                    <LoadingState message="Loading series catalog..." />
                ) : seriesList.length === 0 ? (
                    <EmptyState
                        title="No series found"
                        description={searchQuery ? 'No series match your search query.' : 'Create your first manga series title.'}
                        action={
                            <button className={styles.btnPrimary} onClick={openCreateModal}>
                                <Plus size={14} /> New Series
                            </button>
                        }
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Cover</th>
                                    <th>Series Title</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {seriesList.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <img src={s.cover_image || ''} alt={s.title} className={styles.tableCoverThumb} />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#ffffff' }}>{s.title}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {s.description || 'No description'}
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td style={{ fontSize: '12px' }}>
                                            {new Date(s.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="Toggle Status"
                                                    onClick={() => handleToggleStatus(s.id)}
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="Edit Series"
                                                    onClick={() => openEditModal(s)}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="View in Reader"
                                                    onClick={() => navigate(`/book/${s.id}`)}
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    style={{ color: '#ef4444' }}
                                                    title="Delete Series"
                                                    onClick={() => setDeleteTarget(s)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingSeries ? `Edit Series: ${editingSeries.title}` : 'Create Manga Series'}
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handleSubmit}>
                            {editingSeries ? 'Save Changes' : 'Create Series'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Series Title *</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="e.g. Cyberpunk Neo-Tokyo"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Serialization Status</label>
                        <select
                            className={styles.formSelect}
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as 'ONGOING' | 'COMPLETED')}
                        >
                            <option value="ONGOING">ONGOING</option>
                            <option value="COMPLETED">COMPLETED</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Series Synopsis</label>
                        <textarea
                            className={styles.formTextarea}
                            rows={3}
                            placeholder="Official synopsis and franchise story overview..."
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                        />
                    </div>

                    <FileUploadDropzone
                        label="Series Main Banner / Poster"
                        currentUrl={formCover}
                        onFileSelected={(url) => setFormCover(url)}
                    />
                </form>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Series"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? All associated volumes and chapters will also be affected.`}
                confirmText="Delete Series"
            />
        </div>
    );
};
