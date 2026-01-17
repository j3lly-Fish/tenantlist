import React, { useState } from 'react';
import { TopNavigation } from '@components/TopNavigation';
import { TenantSidebar } from '@components/TenantSidebar';
import {
    PlusIcon,
    EllipsisHorizontalIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import styles from './ManageTeam.module.css';

// Mock data types interface
interface TeamMember {
    id: string;
    name: string;
    avatar?: string;
    businessInitial: string; // Using initial for the mock business logo
    businessName: string;
    listingName: string;
    role: string;
    controls: string;
    email: string;
}

// Mock data mirroring the screenshot
const MOCK_MEMBERS: TeamMember[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        businessInitial: 'R',
        businessName: "Rocco's Taco's",
        listingName: 'San Fran Area',
        role: 'Broker',
        controls: 'View',
        email: 'sarah.johnson@roccostacos.com'
    },
    {
        id: '2',
        name: 'Michael Chen',
        businessInitial: 'R',
        businessName: "Rocco's Taco's",
        listingName: 'Miami Dade',
        role: 'Broker',
        controls: 'Edit',
        email: 'michael.chen@roccostacos.com'
    },
    {
        id: '3',
        name: 'Emily Rodriguez',
        businessInitial: 'R',
        businessName: "Rocco's Taco's",
        listingName: 'Chicago',
        role: 'Marketing',
        controls: 'Admin',
        email: 'emily.rodriguez@roccostacos.com'
    },
    {
        id: '4',
        name: 'David Kim',
        businessInitial: 'R',
        businessName: "Rocco's Taco's",
        listingName: 'Dallas/Forth Worth',
        role: 'Franchisor',
        controls: 'Admin',
        email: 'david.kim@roccostacos.com'
    },
    {
        id: '5',
        name: 'Lisa Thompson',
        businessInitial: 'R',
        businessName: "Rocco's Taco's",
        listingName: 'South Texas',
        role: 'Operations',
        controls: 'Admin',
        email: 'lisa.thompson@roccostacos.com'
    },
    {
        id: '6',
        name: 'Jennifer Martinez',
        businessInitial: 'C',
        businessName: 'Ceviche',
        listingName: 'Northern Virginia',
        role: 'Broker',
        controls: 'View',
        email: 'jennifer.martinez@ceviche.com'
    },
    {
        id: '7',
        name: 'Robert Williams',
        businessInitial: 'C',
        businessName: 'Ceviche',
        listingName: 'Northern Virginia',
        role: 'Broker',
        controls: 'Admin',
        email: 'robert.williams@ceviche.com'
    },
    {
        id: '8',
        name: 'Amanda Clark',
        businessInitial: 'C',
        businessName: 'Ceviche',
        listingName: 'Northern Virginia',
        role: 'Marketing',
        controls: 'View',
        email: 'amanda.clark@ceviche.com'
    },
    {
        id: '9',
        name: 'James Anderson',
        businessInitial: 'C',
        businessName: 'Ceviche',
        listingName: 'Admin',
        role: 'Franchisor',
        controls: 'Admin',
        email: 'james.anderson@ceviche.com'
    }
];

const ManageTeam: React.FC = () => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className={styles.dashboard}>
            {/* Reusing existing layout styles or wrapping in similar structure */}
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--waltre-gray-50)' }}>
                <TopNavigation />

                <div style={{ display: 'flex' }}>
                    <div style={{ width: '280px', flexShrink: 0 }}>
                        <TenantSidebar />
                    </div>

                    <main style={{ flex: 1 }}>
                        <div className={styles.container}>

                            {/* Header */}
                            <div className={styles.header}>
                                <div className={styles.titleGroup}>
                                    <h1>Manage Your Team</h1>
                                    <p>Manage your business account information and preferences</p>
                                </div>
                                <button className={styles.addMemberButton}>
                                    <PlusIcon width={20} height={20} />
                                    Add team member
                                </button>
                            </div>

                            {/* Filters */}
                            <div className={styles.filtersContainer}>
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Search Team Member</label>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email"
                                        className={styles.searchInput}
                                    />
                                </div>
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Business</label>
                                    <select className={styles.selectInput}>
                                        <option>All Businesses</option>
                                    </select>
                                </div>
                                <div className={styles.filterGroup}>
                                    <label className={styles.filterLabel}>Role</label>
                                    <select className={styles.selectInput}>
                                        <option>All Roles</option>
                                    </select>
                                </div>
                            </div>

                            {/* Table */}
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Business</th>
                                            <th>Listing Name</th>
                                            <th>Role</th>
                                            <th>Controls</th>
                                            <th>Email</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MOCK_MEMBERS.map((member) => (
                                            <tr key={member.id}>
                                                <td>
                                                    <div className={styles.memberCell}>
                                                        <div className={styles.avatar}>
                                                            {/* Placeholder avatar logic */}
                                                        </div>
                                                        <span className={styles.memberName}>{member.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.businessCell}>
                                                        <div className={styles.businessIcon}>{member.businessInitial}</div>
                                                        <span>{member.businessName}</span>
                                                    </div>
                                                </td>
                                                <td>{member.listingName}</td>
                                                <td>
                                                    <span className={styles.roleBadge}>{member.role}</span>
                                                </td>
                                                <td>
                                                    <span className={styles.controlsText}>{member.controls}</span>
                                                </td>
                                                <td>
                                                    <span className={styles.emailText}>{member.email}</span>
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <button
                                                        className={styles.actionButton}
                                                        onClick={(e) => toggleMenu(member.id, e)}
                                                    >
                                                        <EllipsisHorizontalIcon width={24} height={24} />
                                                    </button>

                                                    {activeMenu === member.id && (
                                                        <div className={styles.actionMenu}>
                                                            <button className={styles.menuItem}>
                                                                <PencilSquareIcon width={16} height={16} />
                                                                Edit
                                                            </button>
                                                            <button className={`${styles.menuItem} ${styles.deleteItem}`}>
                                                                <TrashIcon width={16} height={16} />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ManageTeam;
