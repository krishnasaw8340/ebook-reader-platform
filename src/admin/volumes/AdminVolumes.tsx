import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    FolderKanban,
    Layers,
    BookOpen,
    ChevronUp,
    ChevronDown,
    Archive,
    CheckCircle2
} from 'lucide-react';
import {
    adminVolumeService,
    adminSeriesService,
    adminBookService
} from '../../services/admin/adminServices';
import type { Volume, BookSeries, Book, VolumeStatus } from '../../types';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    Modal,
    ConfirmDialog,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

export const AdminVolumes: React.FC = () => {
    const navigate = useNavigate();
    const [volumes, setVolumes] = useState<Volume[]>([]);
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Modal state for Create / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingVolume, setEditingVolume] = useState<Volume | null>(null);
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formVolumeNo, setFormVolumeNo] = useState(1);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStatus, setFormStatus] = useState<VolumeStatus>('DRAFT');
    const [formReleaseDate, setFormReleaseDate] = useState(new Date().toISOString().split('T')[0]);

    // Delete / Archive dialog
    const [confirmAction, setConfirmAction] = useState<{
        type: 'delete' | 'archive';
        volume: Volume;
    } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sList, vList, bList] = await Promise.all([
                adminSeriesService.getAll(),
                adminVolumeService.getAll({
                    seriesId: selectedSeriesId || undefined,
                    search: searchQuery || undefined,
                }),
                adminBookService.getAll()
            ]);
            setSeriesList(sList);
            setVolumes(vList);
            setBooks(bList);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Unable to load volumes.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedSeriesId, searchQuery]);

    const openCreateModal = () => {
        setEditingVolume(null);
        const targetSeriesId = selectedSeriesId || seriesList[0]?.id || '';
        setFormSeriesId(targetSeriesId);
        const seriesVolCount = volumes.filter(v => (v.seriesId === targetSeriesId || v.series_id === targetSeriesId)).length;
        setFormVolumeNo(seriesVolCount + 1);
        setFormTitle(`Volume ${seriesVolCount + 1}`);
        setFormDesc('');
        setFormStatus('DRAFT');
        setFormReleaseDate(new Date().toISOString().split('T')[0]);
        setModalOpen(true);
    };

    const openEditModal = (volume: Volume) => {
        setEditingVolume(volume);
        setFormSeriesId(volume.series_id);
        setFormVolumeNo(volume.volume_no);
        setFormTitle(volume.title);
        setFormDesc(volume.description || '');
        setFormStatus(volume.status || 'DRAFT');
        setFormReleaseDate(volume.release_date || new Date().toISOString().split('T')[0]);
        setModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        // Validation against duplicate volume number in the same series
        const duplicate = volumes.some(v =>
            (!editingVolume || v.id !== editingVolume.id) &&
            v.series_id === formSeriesId &&
            v.volume_no === Number(formVolumeNo)
        );

        if (duplicate) {
            setErrorMessage(`Volume ${formVolumeNo} already exists for this series.`);
            return;
        }

        try {
            if (editingVolume) {
                await adminVolumeService.update(editingVolume.id, {
                    seriesId: formSeriesId,
                    volumeNumber: Number(formVolumeNo),
                    title: formTitle,
                    description: formDesc,
                    status: formStatus,
                    releaseDate: formReleaseDate
                });
                setSuccessMessage(`Volume "${formTitle}" updated.`);
            } else {
                await adminVolumeService.create({
                    seriesId: formSeriesId,
                    volumeNumber: Number(formVolumeNo),
                    title: formTitle,
                    description: formDesc,
                    status: formStatus,
                    releaseDate: formReleaseDate
                });
                setSuccessMessage(`Volume "${formTitle}" created.`);
            }
            setModalOpen(false);
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to save volume.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    // Reorder Volume Up / Down
    const handleReorder = async (vol: Volume, direction: 'up' | 'down') => {
        const seriesVolumes = volumes.filter(v => (v.seriesId === vol.series_id || v.series_id === vol.series_id)).sort((a, b) => a.volume_no - b.volume_no);
        const currentIndex = seriesVolumes.findIndex(v => v.id === vol.id);
        if (currentIndex === -1) return;
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === seriesVolumes.length - 1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const copy = [...seriesVolumes];
        const [moved] = copy.splice(currentIndex, 1);
        copy.splice(targetIndex, 0, moved);

        const orderedIds = copy.map(v => v.id);
        try {
            await adminVolumeService.update(vol.id, { sortOrder: targetIndex + 1 });
            setSuccessMessage('Volume sequence reordered.');
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to reorder volume.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        try {
            if (confirmAction.type === 'archive') {
                await adminVolumeService.update(confirmAction.volume.id, { status: 'ARCHIVED' });
                setSuccessMessage(`Volume "${confirmAction.volume.title}" archived.`);
            } else {
                await adminVolumeService.delete(confirmAction.volume.id);
                setSuccessMessage(`Volume "${confirmAction.volume.title}" deleted.`);
            }
            setConfirmAction(null);
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Action failed.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    return (
        <div>
            <PageHeader
                title="Volume Management"
                subtitle="Organize series into canonical volumes, manage volume numbering, and view book compilation counts."
                breadcrumbs={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    { label: 'Volumes' }
                ]}
                actions={
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={16} /> New Volume
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            <div className={styles.filterBar}>
                <SearchBar
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                    placeholder="Search volumes by title or synopsis..."
                />

                <div className={styles.filterGroup}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Franchise:</label>
                    <select
                        className={styles.selectInput}
                        value={selectedSeriesId}
                        onChange={(e) => setSelectedSeriesId(e.target.value)}
                    >
                        <option value="">All Franchises ({seriesList.length})</option>
                        {seriesList.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.tableCard}>
                {loading ? (
                    <LoadingState message="Loading volumes catalog..." />
                ) : volumes.length === 0 ? (
                    <EmptyState
                        title="No volumes found"
                        description="Create volumes to group chapters into official manga tankobon compilations."
                        action={
                            <button className={styles.btnPrimary} onClick={openCreateModal}>
                                <Plus size={14} /> Add Volume
                            </button>
                        }
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Vol #</th>
                                    <th>Volume Title</th>
                                    <th>Parent Series</th>
                                    <th>Books in Volume</th>
                                    <th>Status</th>
                                    <th>Release Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volumes.map((vol) => {
                                    const parentSeries = seriesList.find((s) => s.id === (vol.seriesId || vol.series_id));
                                    const booksInVol = books.filter((b) => (b.volumeId === vol.id || b.volume_id === vol.id));

                                    return (
                                        <tr key={vol.id}>
                                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                                Vol. {vol.volumeNumber ?? vol.volume_no}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FolderKanban size={15} color="var(--primary)" />
                                                    <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{vol.title}</span>
                                                </div>
                                                {vol.description && (
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{vol.description}</div>
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    style={{ fontWeight: 600, color: 'var(--text-secondary)', cursor: parentSeries ? 'pointer' : 'default' }}
                                                    onClick={() => parentSeries && navigate(`/admin/series/${parentSeries.id}`)}
                                                >
                                                    {parentSeries?.title || parentSeries?.name || 'Unknown Series'}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{ fontWeight: 600, color: booksInVol.length > 0 ? 'var(--primary)' : 'var(--color-text-primary)', cursor: booksInVol.length > 0 ? 'pointer' : 'default' }}
                                                    onClick={() => booksInVol.length > 0 && navigate(`/admin/books?seriesId=${vol.seriesId || vol.series_id}&volumeId=${vol.id}`)}
                                                >
                                                    {booksInVol.length} Book(s)
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={vol.status} />
                                            </td>
                                            <td style={{ fontSize: '12px' }}>
                                                {vol.releaseDate || vol.release_date || new Date(vol.createdAt || vol.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '4px' }}>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Move Up in Order"
                                                        onClick={() => handleReorder(vol, 'up')}
                                                    >
                                                        <ChevronUp size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Move Down in Order"
                                                        onClick={() => handleReorder(vol, 'down')}
                                                    >
                                                        <ChevronDown size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Edit Volume"
                                                        onClick={() => openEditModal(vol)}
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Archive Volume"
                                                        onClick={() => setConfirmAction({ type: 'archive', volume: vol })}
                                                    >
                                                        <Archive size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        style={{ color: '#ef4444' }}
                                                        title="Delete Volume"
                                                        onClick={() => setConfirmAction({ type: 'delete', volume: vol })}
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
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingVolume ? `Edit Volume: ${editingVolume.title}` : 'Create New Volume'}
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handleFormSubmit}>
                            {editingVolume ? 'Save Changes' : 'Create Volume'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleFormSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Parent Series *</label>
                        <select
                            className={styles.formSelect}
                            value={formSeriesId}
                            onChange={(e) => setFormSeriesId(e.target.value)}
                            required
                        >
                            {seriesList.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Volume Number *</label>
                            <input
                                type="number"
                                min={1}
                                className={styles.formInput}
                                value={formVolumeNo}
                                onChange={(e) => setFormVolumeNo(parseInt(e.target.value) || 1)}
                                required
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unique sequence number within the series</p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Status</label>
                            <select
                                className={styles.formSelect}
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value as any)}
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="PUBLISHED">PUBLISHED</option>
                                <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Volume Title *</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="e.g. Volume 1: Reality Cracks"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Release Date</label>
                        <input
                            type="date"
                            className={styles.formInput}
                            value={formReleaseDate}
                            onChange={(e) => setFormReleaseDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Description / Notes</label>
                        <textarea
                            className={styles.formTextarea}
                            rows={2}
                            placeholder="Volume overview notes..."
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                        />
                    </div>
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirmAction}
                title={confirmAction?.type === 'archive' ? 'Archive Volume' : 'Delete Volume'}
                message={
                    confirmAction?.type === 'archive'
                        ? `Are you sure you want to archive "${confirmAction?.volume.title}"?`
                        : `Are you sure you want to delete "${confirmAction?.volume.title}"? Associated books will remain in the series without an assigned volume.`
                }
                danger={confirmAction?.type === 'delete'}
                confirmText={confirmAction?.type === 'archive' ? 'Archive Volume' : 'Delete Volume'}
            />
        </div>
    );
};
