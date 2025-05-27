// Patients Page Manager
class PatientsPageManager {
    constructor() {
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Search input
            const searchInput = document.getElementById('patientSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchQuery = e.target.value;
                    this.refreshPatientsDisplay();
                });
            }

            // Filter buttons
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Remove active class from all buttons
                    filterButtons.forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    
                    this.currentFilter = e.target.dataset.filter;
                    this.refreshPatientsDisplay();
                });
            });

            // Export button
            const exportBtn = document.getElementById('exportPatientsBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportPatientsData());
            }
        });
    }

    refreshPatientsDisplay() {
        try {
            const patientsGrid = document.getElementById('patientsGrid');
            if (!patientsGrid) return;

            let patients = storageManager.getPatients();
            
            // Apply search filter
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase().trim();
                patients = patients.filter(patient => 
                    patient.name.toLowerCase().includes(query) ||
                    patient.nik.includes(query) ||
                    patient.phone.includes(query) ||
                    (patient.email && patient.email.toLowerCase().includes(query))
                );
            }

            // Apply gender filter
            if (this.currentFilter !== 'all') {
                patients = patients.filter(patient => patient.gender === this.currentFilter);
            }

            if (patients.length === 0) {
                patientsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <p>${this.searchQuery || this.currentFilter !== 'all' ? 'No patients match your criteria' : 'No patients found'}</p>
                    </div>
                `;
                return;
            }

            // Sort patients by name
            patients.sort((a, b) => a.name.localeCompare(b.name));

            patientsGrid.innerHTML = patients.map(patient => this.createPatientCard(patient)).join('');

        } catch (error) {
            console.error('Error refreshing patients display:', error);
            patientsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading patients</p>
                </div>
            `;
        }
    }

    createPatientCard(patient) {
        const age = this.calculateAge(patient.dob);
        const lastVisit = this.formatRelativeTime(patient.lastVisit);
        
        return `
            <div class="patient-card-item" onclick="patientManager.showPatientDetails('${patient.id}')">
                <div class="patient-card-header">
                    ${patient.photo ? 
                        `<img src="${patient.photo}" alt="${patient.name}" class="patient-avatar">` :
                        `<div class="patient-avatar-placeholder">
                            <i class="fas fa-user"></i>
                        </div>`
                    }
                    <div class="patient-basic-info">
                        <h3>${patient.name}</h3>
                        <div class="patient-nik">NIK: ${patient.nik}</div>
                    </div>
                </div>
                
                <div class="patient-details-grid">
                    <div class="patient-detail">
                        <div class="patient-detail-label">Age</div>
                        <div class="patient-detail-value">${age} years</div>
                    </div>
                    <div class="patient-detail">
                        <div class="patient-detail-label">Gender</div>
                        <div class="patient-detail-value">${this.capitalizeFirst(patient.gender)}</div>
                    </div>
                    <div class="patient-detail">
                        <div class="patient-detail-label">Phone</div>
                        <div class="patient-detail-value">${patient.phone}</div>
                    </div>
                    <div class="patient-detail">
                        <div class="patient-detail-label">Last Visit</div>
                        <div class="patient-detail-value">${lastVisit}</div>
                    </div>
                </div>
                
                <div class="patient-card-actions">
                    <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); queueManager.addPatientToQueue('${patient.id}')" title="Add to Queue">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); patientManager.showPatientDetails('${patient.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }

    calculateAge(dateOfBirth) {
        try {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age;
        } catch (error) {
            return 'Unknown';
        }
    }

    formatRelativeTime(isoString) {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
            } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return `${months} month${months > 1 ? 's' : ''} ago`;
            } else {
                const years = Math.floor(diffDays / 365);
                return `${years} year${years > 1 ? 's' : ''} ago`;
            }
        } catch (error) {
            return 'Unknown';
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    exportPatientsData() {
        try {
            const patients = storageManager.getPatients();
            if (patients.length === 0) {
                alert('No patients data to export');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'NIK', 'Date of Birth', 'Age', 'Gender', 'Phone', 'Email', 'Address', 'Registered Date'];
            const csvContent = [
                headers.join(','),
                ...patients.map(patient => [
                    `"${patient.name}"`,
                    patient.nik,
                    patient.dob,
                    this.calculateAge(patient.dob),
                    patient.gender,
                    patient.phone,
                    patient.email || '',
                    `"${patient.address}"`,
                    new Date(patient.registeredAt).toLocaleDateString()
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Show success message
                this.showMessage('Patients data exported successfully!', 'success');
            } else {
                throw new Error('Browser does not support file download');
            }

        } catch (error) {
            console.error('Error exporting patients data:', error);
            this.showMessage('Failed to export patients data', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.patients-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `patients-message ${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        const patientsContainer = document.querySelector('.patients-container');
        if (patientsContainer) {
            patientsContainer.insertBefore(messageDiv, patientsContainer.firstChild);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 3000);
        }
    }

    // Method called when navigating to patients page
    onPageLoad() {
        this.refreshPatientsDisplay();
    }
}

// Create global instance
window.patientsPageManager = new PatientsPageManager();