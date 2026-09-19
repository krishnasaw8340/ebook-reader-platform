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
import type { Volume, BookSeries, Book } from '../../types';
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

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Modal state for Create / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingVolume, setEditingVolume] = useState<Volume | null>(null);
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formVolumeNo, setFormVolumeNo] = useState(1);
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStatus, setFormStatus] = useState<'ONGOING' | 'COMPLETED' | 'DRAFT' | 'ARCHIVED'>('ONGOING');
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
                adminVolumeService.getAll(selectedSeriesId || undefined),
                adminBookService.getAll()
            ]);
            setSeriesList(sList);
            setVolumes(vList);
            setBooks(bList);
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load volumes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedSeriesId]);

    const openCreateModal = () => {
        setEditingVolume(null);
        const targetSeriesId = selectedSeriesId || seriesList[0]?.id || '';
        setFormSeriesId(targetSeriesId);
        const seriesVolCount = volumes.filter(v => v.series_id === targetSeriesId).length;
        setFormVolumeNo(seriesVolCount + 1);
        setFormTitle(`Volume ${seriesVolCount + 1}`);
        setFormDesc('');
        setFormStatus('ONGOING');
        setFormReleaseDate(new Date().toISOString().split('T')[0]);
        setModalOpen(true);
    };

    const openEditModal = (volume: Volume) => {
        setEditingVolume(volume);
        setFormSeriesId(volume.series_id);
        setFormVolumeNo(volume.volume_no);
        setFormTitle(volume.title);
        setFormDesc(volume.description || '');
        setFormStatus(volume.status || 'ONGOING');
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
                    series_id: formSeriesId,
                    volume_no: Number(formVolumeNo),
                    title: formTitle,
                    description: formDesc,
                    status: formStatus,
                    release_date: formReleaseDate
                });
                setSuccessMessage(`Volume "${formTitle}" updated.`);
            } else {
                await adminVolumeService.create({
                    series_id: formSeriesId,
                    volume_no: Number(formVolumeNo),
                    title: formTitle,
                    description: formDesc,
                    status: formStatus,
                    release_date: formReleaseDate
                });
                setSuccessMessage(`Volume "${formTitle}" created.`);
            }
            setModalOpen(false);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save volume.');
        }
    };

    // Reorder Volume Up / Down
    const handleReorder = async (vol: Volume, direction: 'up' | 'down') => {
        const seriesVolumes = volumes.filter(v => v.series_id === vol.series_id).sort((a, b) => a.volume_no - b.volume_no);
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
            await adminVolumeService.reorder(vol.series_id, orderedIds);
            setSuccessMessage('Volume sequence reordered.');
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to reorder volume.');
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
            setErrorMessage(err.message || 'Action failed.');
        }
    };

    return (
        <div>
            <PageHeader
                title="Volume Management"
                subtitle="Organize series into canonical volumes, manage volume numbering, and view book compilation counts."
                actions={
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={16} /> + New Volume
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            <div className={styles.filterBar}>
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
                                {volumes.map((vol, idx) => {
                                    const parentSeries = seriesList.find((s) => s.id === vol.series_id);
                                    const booksInVol = books.filter((b) => b.volume_id === vol.id);

                                    return (
                                        <tr key={vol.id}>
                                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                                Vol. {vol.volume_no}
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
                                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    {parentSeries?.title || 'Unknown Series'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                                    {booksInVol.length} Book(s)
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={vol.status} />
                                            </td>
                                            <td style={{ fontSize: '12px' }}>
                                                {vol.release_date || new Date(vol.created_at).toLocaleDateString()}
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
                                <option value="ONGOING">ONGOING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="DRAFT">DRAFT</option>
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
