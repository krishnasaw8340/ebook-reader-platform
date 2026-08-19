import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    FolderKanban,
    Layers,
    FileText,
    ArrowUpDown
} from 'lucide-react';
import {
    adminBookService,
    adminSeriesService,
    adminChapterService
} from '../../services/admin/adminServices';
import type { Book, BookSeries, Chapter } from '../../types';
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
    const [volumes, setVolumes] = useState<Book[]>([]);
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingVolume, setEditingVolume] = useState<Book | null>(null);
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formVolumeNo, setFormVolumeNo] = useState(1);
    const [formPrice, setFormPrice] = useState(0);
    const [formStatus, setFormStatus] = useState<'ONGOING' | 'COMPLETED'>('ONGOING');

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sList, bList, cList] = await Promise.all([
                adminSeriesService.getAll(),
                adminBookService.getAll({ seriesId: selectedSeriesId || undefined }),
                adminChapterService.getAll()
            ]);
            setSeriesList(sList);
            setVolumes(bList);
            setChapters(cList);
            if (!selectedSeriesId && sList.length > 0) {
                // Keep default or first
            }
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
        setFormSeriesId(selectedSeriesId || seriesList[0]?.id || '');
        const currentSeriesCount = volumes.filter(v => !selectedSeriesId || v.series_id === (selectedSeriesId || seriesList[0]?.id)).length;
        setFormVolumeNo(currentSeriesCount + 1);
        setFormTitle(`Volume ${currentSeriesCount + 1}`);
        setFormPrice(0);
        setFormStatus('ONGOING');
        setModalOpen(true);
    };

    const openEditModal = (volume: Book) => {
        setEditingVolume(volume);
        setFormSeriesId(volume.series_id);
        setFormTitle(volume.title);
        // Extract volume number if present
        const match = volume.title.match(/Volume\s+(\d+)/i);
        setFormVolumeNo(match ? parseInt(match[1]) : 1);
        setFormPrice(volume.coin_price || 0);
        setFormStatus(volume.status || 'ONGOING');
        setModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            if (editingVolume) {
                await adminBookService.update(editingVolume.id, {
                    series_id: formSeriesId,
                    title: formTitle,
                    coin_price: Number(formPrice),
                    status: formStatus
                });
                setSuccessMessage(`Volume "${formTitle}" updated.`);
            } else {
                await adminBookService.create({
                    series_id: formSeriesId,
                    title: formTitle,
                    summary: `Volume compiled release for series.`,
                    cover_image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400",
                    coin_price: Number(formPrice),
                    status: formStatus
                });
                setSuccessMessage(`Volume "${formTitle}" created.`);
            }
            setModalOpen(false);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save volume.');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminBookService.delete(deleteTarget.id);
            setSuccessMessage(`Volume "${deleteTarget.title}" deleted.`);
            setDeleteTarget(null);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to delete volume.');
        }
    };

    return (
        <div>
            <PageHeader
                title="Volume & Release Ordering"
                subtitle="Organize series into ordered volumes and maintain deterministic release numbering."
                actions={
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={16} /> New Volume
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Series:</label>
                    <select
                        className={styles.selectInput}
                        value={selectedSeriesId}
                        onChange={(e) => setSelectedSeriesId(e.target.value)}
                    >
                        <option value="">All Series ({seriesList.length})</option>
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
                    <LoadingState message="Loading volumes..." />
                ) : volumes.length === 0 ? (
                    <EmptyState
                        title="No volumes found"
                        description="No volumes found for the selected series."
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
                                    <th>Volume Title</th>
                                    <th>Series</th>
                                    <th>Chapters Count</th>
                                    <th>Volume Price</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volumes.map((vol) => {
                                    const parentSeries = seriesList.find((s) => s.id === vol.series_id);
                                    const volChapters = chapters.filter((c) => c.book_id === vol.id);

                                    return (
                                        <tr key={vol.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <FolderKanban size={16} color="var(--primary)" />
                                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{vol.title}</span>
                                                </div>
                                            </td>
                                            <td>{parentSeries?.title || 'Unknown Series'}</td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: '#ffffff' }}>
                                                    {volChapters.length} Chapter(s)
                                                </span>
                                            </td>
                                            <td>
                                                {vol.coin_price > 0 ? (
                                                    <StatusBadge status={`${vol.coin_price} Coins`} type="coin" />
                                                ) : (
                                                    <StatusBadge status="FREE" type="info" />
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge status={vol.status} />
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <button
                                                        className={styles.btnSecondary}
                                                        style={{ padding: '6px 10px', fontSize: '12px' }}
                                                        onClick={() => navigate('/admin/chapters')}
                                                    >
                                                        <FileText size={12} /> Chapters
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Edit Volume"
                                                        onClick={() => openEditModal(vol)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        style={{ color: '#ef4444' }}
                                                        title="Delete Volume"
                                                        onClick={() => setDeleteTarget(vol)}
                                                    >
                                                        <Trash2 size={14} />
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

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Volume Unlock Cost (Coins)</label>
                            <input
                                type="number"
                                min={0}
                                className={styles.formInput}
                                value={formPrice}
                                onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Status</label>
                            <select
                                className={styles.formSelect}
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value as 'ONGOING' | 'COMPLETED')}
                            >
                                <option value="ONGOING">ONGOING</option>
                                <option value="COMPLETED">COMPLETED</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Volume"
                message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
                confirmText="Delete Volume"
            />
        </div>
    );
};
