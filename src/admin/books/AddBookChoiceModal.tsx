import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, UploadCloud, ArrowRight, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/AdminUI';
import styles from './AddBookChoiceModal.module.css';

interface AddBookChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddBookChoiceModal: React.FC<AddBookChoiceModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleSelectManual = () => {
        onClose();
        navigate('/admin/books/new');
    };

    const handleSelectUpload = () => {
        onClose();
        navigate('/admin/uploads?action=new');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="How do you want to add content?"
            maxWidth="680px"
        >
            <div className={styles.container}>
                <p className={styles.leadText}>
                    Choose between our multi-step guided creator or our automated archive ingestion pipeline.
                </p>

                <div className={styles.optionsGrid}>
                    {/* Option 1: Manual Guided Workflow */}
                    <div className={styles.optionCard} onClick={handleSelectManual}>
                        <div className={styles.optionHeader}>
                            <div className={`${styles.iconWrap} ${styles.manualIcon}`}>
                                <BookOpen size={24} />
                            </div>
                            <span className={styles.badge}>Guided Wizard</span>
                        </div>

                        <h3 className={styles.optionTitle}>Option 1: Create Manually</h3>
                        <p className={styles.optionDescription}>
                            Build a book step-by-step with complete editorial control over series linking, optional volumes, pricing models, chapter definitions, and DRM page ordering.
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.checkIcon} />
                                <span>7-step structured workflow</span>
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.checkIcon} />
                                <span>Optional volume grouping (Direct Series support)</span>
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.checkIcon} />
                                <span>Granular pricing (Free / Paid / Partial)</span>
                            </div>
                        </div>

                        <button className={styles.btnAction} type="button">
                            <span>Start Manual Creation</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    {/* Option 2: Upload Complete Book / Package */}
                    <div className={styles.optionCard} onClick={handleSelectUpload}>
                        <div className={styles.optionHeader}>
                            <div className={`${styles.iconWrap} ${styles.uploadIcon}`}>
                                <UploadCloud size={24} />
                            </div>
                            <span className={`${styles.badge} ${styles.badgeUpload}`}>Batch Ingestion</span>
                        </div>

                        <h3 className={styles.optionTitle}>Option 2: Upload Complete Book</h3>
                        <p className={styles.optionDescription}>
                            Upload a compressed ZIP archive containing full chapters and page scans. Our ingestion pipeline will automatically extract, validate, and detect content structure.
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.checkIcon} />
                                <span>Fast bulk multi-chapter upload</span>
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.checkIcon} />
                                <span>Automated page detection & validation</span>
                            </div>
                            <div className={styles.featureItem}>
                                <CheckCircle2 size={14} className={styles.checkIcon} />
                                <span>Pre-publish structure review screen</span>
                            </div>
                        </div>

                        <button className={`${styles.btnAction} ${styles.btnUploadAction}`} type="button">
                            <span>Launch Ingestion Pipeline</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
