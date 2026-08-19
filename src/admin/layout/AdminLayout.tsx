import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Layers,
    FolderKanban,
    FileText,
    FileImage,
    Users,
    Coins,
    LogOut,
    ArrowLeft,
    Menu,
    X,
    Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import styles from './AdminLayout.module.css';

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { path: '/admin/books', label: 'Books', icon: <BookOpen size={18} /> },
        { path: '/admin/series', label: 'Series', icon: <Layers size={18} /> },
        { path: '/admin/volumes', label: 'Volumes', icon: <FolderKanban size={18} /> },
        { path: '/admin/chapters', label: 'Chapters', icon: <FileText size={18} /> },
        { path: '/admin/pages', label: 'Pages & DRM', icon: <FileImage size={18} /> },
        { path: '/admin/users', label: 'Users & Roles', icon: <Users size={18} /> },
        { path: '/admin/pricing', label: 'Pricing & Coins', icon: <Coins size={18} /> },
    ];

    // Current page title derived from path
    const currentNavItem = navItems.find((item) => location.pathname.startsWith(item.path));
    const pageTitle = currentNavItem ? currentNavItem.label : 'Admin Portal';

    return (
        <div className={styles.adminContainer}>
            {/* Mobile Backdrop */}
            <div
                className={`${styles.mobileOverlay} ${mobileOpen ? styles.mobileOverlayOpen : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* CMS Sidebar */}
            <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarBrand}>
                    <div className={styles.brandLogoGroup} onClick={() => { setMobileOpen(false); navigate('/admin/dashboard'); }} style={{ cursor: 'pointer' }}>
                        <div className={styles.brandLogo}>黒</div>
                        <div className={styles.brandText}>
                            <div className={styles.brandName}>Kuro<span>Yomi</span></div>
                            <div className={styles.adminTag}><Shield size={10} style={{ display: 'inline', marginRight: 3 }} />CMS Portal</div>
                        </div>
                    </div>
                    <button
                        className={styles.sidebarCloseBtn}
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className={styles.navSection}>
                    <div className={styles.navLabel}>Catalog Management</div>
                    {navItems.slice(0, 6).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <div className={styles.navLabel} style={{ marginTop: '12px' }}>Platform Operations</div>
                    {navItems.slice(6).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.readerBackLink} onClick={() => navigate('/')}>
                        <ArrowLeft size={16} />
                        <span>Return to Reader App</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={styles.mainWrapper}>
                {/* Header */}
                <header className={styles.topHeader}>
                    <div className={styles.headerLeft}>
                        <button
                            className={styles.mobileMenuToggle}
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle Navigation"
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                        <div className={styles.headerTitle}>{pageTitle}</div>
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.adminProfilePill}>
                            <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop"
                                alt="Admin Avatar"
                                className={styles.adminAvatar}
                            />
                            <div className={styles.adminInfo}>
                                <span className={styles.adminEmail}>{user?.email || 'admin@kuroyomi.com'}</span>
                                <span className={styles.adminRoleBadge}>Administrator</span>
                            </div>
                        </div>

                        <button className={styles.btnLogout} onClick={handleLogout} title="Sign Out">
                            <LogOut size={14} />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                {/* Main View Area */}
                <main className={styles.pageBody}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
