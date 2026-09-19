import React, { useState, useRef, useEffect } from 'react';
import {
    Search,
    X,
    UploadCloud,
    AlertCircle,
    CheckCircle2,
    Trash2,
    Image as ImageIcon,
    ChevronDown,
    Check
} from 'lucide-react';
import styles from './AdminUI.module.css';

// Page Header
export const PageHeader: React.FC<{
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
    <div className={styles.pageHeader}>
        <div className={styles.pageTitleGroup}>
            <h1>{title}</h1>
            {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.headerActions}>{actions}</div>}
    </div>
);

// Stat Card
export const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    trendColor?: string;
}> = ({ title, value, icon, subtitle, trendColor }) => (
    <div className={styles.statCard}>
        <div className={styles.statHeader}>
            <span className={styles.statTitle}>{title}</span>
            <div className={styles.statIconWrap} style={{ color: trendColor || 'var(--primary)' }}>
                {icon}
            </div>
        </div>
        <div className={styles.statValue}>{value}</div>
        {subtitle && (
            <div className={styles.statFooter}>
                <span>{subtitle}</span>
            </div>
        )}
    </div>
);

// Search Bar
export const SearchBar: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => (
    <div className={styles.searchBox}>
        <Search size={16} color="var(--text-muted)" />
        <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        {value && (
            <button
                type="button"
                onClick={() => onChange('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
                <X size={14} />
            </button>
        )}
    </div>
);

// Status Badge
export const StatusBadge: React.FC<{
    status: string;
    type?: 'success' | 'warning' | 'danger' | 'info' | 'coin';
}> = ({ status, type }) => {
    let computedType = type;
    const lower = status.toLowerCase();

    if (!computedType) {
        if (lower === 'ongoing' || lower === 'active' || lower === 'completed' || lower === 'paid') {
            computedType = 'success';
        } else if (lower === 'pending' || lower === 'partial') {
            computedType = 'warning';
        } else if (lower === 'suspended' || lower === 'failed' || lower === 'archived') {
            computedType = 'danger';
        } else if (lower === 'free') {
            computedType = 'info';
        } else {
            computedType = 'info';
        }
    }

    const typeClass =
        computedType === 'success'
            ? styles.badgeSuccess
            : computedType === 'warning'
            ? styles.badgeWarning
            : computedType === 'danger'
            ? styles.badgeDanger
            : computedType === 'coin'
            ? styles.badgeCoin
            : styles.badgeInfo;

    return <span className={`${styles.badge} ${typeClass}`}>{status}</span>;
};

// Modal
export const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}> = ({ isOpen, onClose, title, children, footer, maxWidth }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div
                className={styles.modalContent}
                style={{ maxWidth: maxWidth || '580px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button className={styles.modalClose} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.modalBody}>{children}</div>
                {footer && <div className={styles.modalFooter}>{footer}</div>}
            </div>
        </div>
    );
};

// Confirm Modal
export const ConfirmDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = true }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <button className={styles.btnSecondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={danger ? styles.btnDanger : styles.btnPrimary}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {danger && <Trash2 size={14} />} {confirmText}
                    </button>
                </>
            }
        >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ color: danger ? '#ef4444' : '#f59e0b', marginTop: '2px' }}>
                    <AlertCircle size={24} />
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {message}
                </p>
            </div>
        </Modal>
    );
};

// File Upload Dropzone
export const FileUploadDropzone: React.FC<{
    onFileSelected: (url: string, file: File) => void;
    currentUrl?: string | null;
    label?: string;
    accept?: string;
}> = ({ onFileSelected, currentUrl, label = 'Upload Image', accept = 'image/*' }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        setFileName(file.name);
        // Create local object URL for instant preview without large state overhead
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        onFileSelected(objectUrl, file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className={styles.formGroup}>
            {label && <label className={styles.formLabel}>{label}</label>}
            <div
                className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={inputRef}
                    style={{ display: 'none' }}
                    accept={accept}
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleFile(e.target.files[0]);
                        }
                    }}
                />
                {previewUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                        <img
                            src={previewUrl}
                            alt="Preview"
                            style={{ width: '56px', height: '74px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                {fileName || 'Selected Cover Image'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Click or drop to replace image
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <UploadCloud size={32} className={styles.dropzoneIcon} />
                        <div className={styles.dropzoneText}>
                            Drag & drop image here, or <strong>browse file</strong>
                        </div>
                        <div className={styles.dropzoneHint}>Supports PNG, JPG, WEBP (Max 10MB)</div>
                    </>
                )}
            </div>
        </div>
    );
};

// Loading State
export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
    <div className={styles.stateContainer}>
        <div className={styles.spinner} />
        <p style={{ fontSize: '13px' }}>{message}</p>
    </div>
);

// Empty State
export const EmptyState: React.FC<{
    title: string;
    description?: string;
    action?: React.ReactNode;
}> = ({ title, description, action }) => (
    <div className={styles.stateContainer}>
        <ImageIcon size={40} color="var(--text-muted)" />
        <h3 style={{ fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>{title}</h3>
        {description && <p style={{ fontSize: '13px', maxWidth: '380px' }}>{description}</p>}
        {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
);

// Alert Banners
export const SuccessBanner: React.FC<{ message: string }> = ({ message }) => (
    <div className={styles.alertSuccess}>
        <CheckCircle2 size={16} />
        <span>{message}</span>
    </div>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
    <div className={styles.alertError}>
        <AlertCircle size={16} />
        <span>{message}</span>
    </div>
);

// Reusable Custom Select Component
export interface CustomSelectOption {
    value: string;
    label: string;
    sublabel?: string;
}

export const CustomSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: CustomSelectOption[] | string[];
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
}> = ({
    value,
    onChange,
    options,
    placeholder = 'Select an option...',
    label,
    disabled = false,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const normalizedOptions: CustomSelectOption[] = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const selectedOption = normalizedOptions.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className={`${styles.customSelectWrapper} ${className || ''}`} ref={wrapperRef}>
            {label && <label className={styles.formLabel}>{label}</label>}
            <button
                type="button"
                disabled={disabled}
                className={`${styles.customSelectTrigger} ${isOpen ? styles.customSelectTriggerActive : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={selectedOption ? styles.customSelectValue : styles.customSelectPlaceholder}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`${styles.customSelectChevron} ${isOpen ? styles.customSelectChevronOpen : ''}`}
                />
            </button>

            {isOpen && (
                <div className={styles.customSelectDropdown} role="listbox">
                    {normalizedOptions.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <div
                                key={opt.value}
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.customSelectOption} ${isSelected ? styles.customSelectOptionSelected : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                <div className={styles.customSelectOptionContent}>
                                    <span>{opt.label}</span>
                                    {opt.sublabel && (
                                        <span className={styles.customSelectOptionSublabel}>{opt.sublabel}</span>
                                    )}
                                </div>
                                {isSelected && <Check size={14} color="var(--primary)" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

