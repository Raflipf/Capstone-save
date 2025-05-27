// Queue Management System
class QueueManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const refreshQueueBtn = document.getElementById('refreshQueueBtn');
            if (refreshQueueBtn) {
                refreshQueueBtn.addEventListener('click', () => this.refreshQueue());
            }
        });
    }

    // Add patient to queue
    addPatientToQueue(patientId) {
        try {
            const patient = storageManager.getPatientById(patientId);
            if (!patient) {
                this.showMessage('Patient not found', 'error');
                return false;
            }

            // Check if patient is already in queue
            const currentQueue = storageManager.getQueue();
            const existingEntry = currentQueue.find(entry => 
                entry.patientId === patientId && entry.status !== 'completed'
            );

            if (existingEntry) {
                this.showMessage(`${patient.name} is already in the queue (#${existingEntry.queueNumber})`, 'warning');
                return false;
            }

            // Add to queue
            const queueEntry = storageManager.addToQueue(patient);
            if (queueEntry) {
                this.showMessage(`${patient.name} has been added to the queue (#${queueEntry.queueNumber})`, 'success');
                this.refreshQueue();
                this.updateDashboardStats();
                
                // Close patient modal if open
                const modal = document.getElementById('patientModal');
                if (modal && modal.classList.contains('active')) {
                    patientManager.closePatientModal();
                }
                
                return true;
            } else {
                this.showMessage('Failed to add patient to queue', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error adding patient to queue:', error);
            this.showMessage('An error occurred while adding patient to queue', 'error');
            return false;
        }
    }

    // Update queue status
    updateQueueStatus(queueId, newStatus) {
        try {
            const validStatuses = ['waiting', 'in-progress', 'completed'];
            if (!validStatuses.includes(newStatus)) {
                this.showMessage('Invalid queue status', 'error');
                return false;
            }

            const updatedEntry = storageManager.updateQueueStatus(queueId, newStatus);
            if (updatedEntry) {
                this.refreshQueue();
                this.updateDashboardStats();
                
                const statusMessage = {
                    'waiting': 'moved back to waiting',
                    'in-progress': 'consultation started',
                    'completed': 'consultation completed'
                };
                
                this.showMessage(
                    `Queue #${updatedEntry.queueNumber} ${statusMessage[newStatus]}`, 
                    'success'
                );
                return true;
            } else {
                this.showMessage('Failed to update queue status', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error updating queue status:', error);
            this.showMessage('An error occurred while updating queue status', 'error');
            return false;
        }
    }

    // Remove patient from queue
    removeFromQueue(queueId) {
        try {
            const removedEntry = storageManager.removeFromQueue(queueId);
            if (removedEntry) {
                this.refreshQueue();
                this.updateDashboardStats();
                this.showMessage(
                    `Queue #${removedEntry.queueNumber} has been removed`, 
                    'success'
                );
                return true;
            } else {
                this.showMessage('Failed to remove from queue', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error removing from queue:', error);
            this.showMessage('An error occurred while removing from queue', 'error');
            return false;
        }
    }

    // Refresh queue display
    refreshQueue() {
        try {
            const queueTableBody = document.getElementById('queueTableBody');
            if (!queueTableBody) {
                console.error('Queue table body not found');
                return;
            }

            const queue = storageManager.getQueue();
            
            if (queue.length === 0) {
                queueTableBody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="7">
                            <div class="empty-state">
                                <i class="fas fa-users-slash"></i>
                                <p>No patients in queue</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            // Sort queue by queue number
            const sortedQueue = queue.sort((a, b) => a.queueNumber - b.queueNumber);

            queueTableBody.innerHTML = sortedQueue.map(entry => {
                const arrivalTime = storageManager.formatTime(entry.arrivalTime);
                const waitingTime = this.calculateWaitingTime(entry.arrivalTime, entry.status);
                const doctorInfo = entry.doctorName ? entry.doctorName : 'Not assigned';
                const priorityDisplay = entry.priority ? this.capitalizeFirst(entry.priority) : 'Normal';
                const priorityClass = entry.priority || 'normal';
                
                return `
                    <tr class="queue-row" data-queue-id="${entry.id}">
                        <td>
                            <span class="queue-number">#${entry.queueNumber}</span>
                        </td>
                        <td>
                            <div class="patient-info">
                                <span class="patient-name">${entry.patientName}</span>
                                <small class="waiting-time">${waitingTime}</small>
                            </div>
                        </td>
                        <td class="doctor-info">${doctorInfo}</td>
                        <td>
                            <span class="priority-badge priority-${priorityClass}">${priorityDisplay}</span>
                        </td>
                        <td>${arrivalTime}</td>
                        <td>
                            <span class="status-badge status-${entry.status}">
                                ${this.getStatusDisplay(entry.status)}
                            </span>
                        </td>
                        <td>
                            <div class="queue-actions">
                                ${this.generateActionButtons(entry)}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Add enhanced styles for queue table
            this.addQueueStyles();

        } catch (error) {
            console.error('Error refreshing queue:', error);
            this.showMessage('Failed to refresh queue display', 'error');
        }
    }

    generateActionButtons(entry) {
        const buttons = [];

        switch (entry.status) {
            case 'waiting':
                buttons.push(`
                    <button class="btn btn-sm btn-primary" onclick="queueManager.updateQueueStatus('${entry.id}', 'in-progress')" title="Start Consultation">
                        <i class="fas fa-play"></i>
                    </button>
                `);
                break;
            case 'in-progress':
                buttons.push(`
                    <button class="btn btn-sm btn-success" onclick="queueManager.updateQueueStatus('${entry.id}', 'completed')" title="Complete Consultation">
                        <i class="fas fa-check"></i>
                    </button>
                `);
                buttons.push(`
                    <button class="btn btn-sm btn-secondary" onclick="queueManager.updateQueueStatus('${entry.id}', 'waiting')" title="Move Back to Waiting">
                        <i class="fas fa-undo"></i>
                    </button>
                `);
                break;
            case 'completed':
                // No action buttons for completed entries
                break;
        }

        // Always show remove button (except for completed entries that are old)
        if (entry.status !== 'completed' || this.isRecentEntry(entry)) {
            buttons.push(`
                <button class="btn btn-sm btn-danger" onclick="queueManager.confirmRemoveFromQueue('${entry.id}', '${entry.queueNumber}')" title="Remove from Queue">
                    <i class="fas fa-trash"></i>
                </button>
            `);
        }

        // Show patient details button
        buttons.push(`
            <button class="btn btn-sm btn-info" onclick="patientManager.showPatientDetails('${entry.patientId}')" title="View Patient Details">
                <i class="fas fa-user"></i>
            </button>
        `);

        return buttons.join('');
    }

    confirmRemoveFromQueue(queueId, queueNumber) {
        if (confirm(`Are you sure you want to remove Queue #${queueNumber} from the queue?`)) {
            this.removeFromQueue(queueId);
        }
    }

    getStatusDisplay(status) {
        const statusMap = {
            'waiting': 'Waiting',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return statusMap[status] || status;
    }

    calculateWaitingTime(arrivalTime, status) {
        try {
            const arrival = new Date(arrivalTime);
            const now = new Date();
            const diffMs = now - arrival;
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (status === 'completed') {
                return 'Completed';
            }

            if (diffMins < 1) {
                return 'Just arrived';
            } else if (diffMins < 60) {
                return `${diffMins} min ago`;
            } else {
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                return `${hours}h ${mins}m ago`;
            }
        } catch (error) {
            console.error('Error calculating waiting time:', error);
            return 'Unknown';
        }
    }

    isRecentEntry(entry) {
        try {
            const entryTime = new Date(entry.arrivalTime);
            const now = new Date();
            const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
            return hoursDiff < 24; // Consider entries within 24 hours as recent
        } catch (error) {
            return true; // Default to showing remove button if we can't calculate
        }
    }

    // Get queue statistics
    getQueueStats() {
        try {
            const queue = storageManager.getQueue();
            const stats = {
                total: queue.length,
                waiting: queue.filter(entry => entry.status === 'waiting').length,
                inProgress: queue.filter(entry => entry.status === 'in-progress').length,
                completed: queue.filter(entry => entry.status === 'completed').length,
                averageWaitTime: this.calculateAverageWaitTime(queue)
            };
            return stats;
        } catch (error) {
            console.error('Error getting queue stats:', error);
            return {
                total: 0,
                waiting: 0,
                inProgress: 0,
                completed: 0,
                averageWaitTime: 0
            };
        }
    }

    calculateAverageWaitTime(queue) {
        try {
            const waitingEntries = queue.filter(entry => entry.status === 'waiting');
            if (waitingEntries.length === 0) return 0;

            const totalWaitTime = waitingEntries.reduce((total, entry) => {
                const arrival = new Date(entry.arrivalTime);
                const now = new Date();
                const waitTimeMs = now - arrival;
                return total + waitTimeMs;
            }, 0);

            const averageMs = totalWaitTime / waitingEntries.length;
            return Math.floor(averageMs / (1000 * 60)); // Return in minutes
        } catch (error) {
            console.error('Error calculating average wait time:', error);
            return 0;
        }
    }

    // Update dashboard statistics
    updateDashboardStats() {
        try {
            const stats = storageManager.updateStats();
            
            // Update dashboard display
            const totalPatientsEl = document.getElementById('totalPatients');
            const queueLengthEl = document.getElementById('queueLength');
            const todayCheckinsEl = document.getElementById('todayCheckins');

            if (totalPatientsEl) totalPatientsEl.textContent = stats.totalPatients;
            if (queueLengthEl) queueLengthEl.textContent = stats.queueLength;
            if (todayCheckinsEl) todayCheckinsEl.textContent = stats.todayCheckins;

        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }

    // Show queue-specific messages
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.queue-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `queue-message ${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        const queueContainer = document.querySelector('.queue-container');
        if (queueContainer) {
            queueContainer.insertBefore(messageDiv, queueContainer.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    addQueueStyles() {
        if (document.querySelector('#queue-styles')) {
            return; // Styles already added
        }

        const styles = document.createElement('style');
        styles.id = 'queue-styles';
        styles.textContent = `
            .queue-row {
                transition: background-color 0.2s ease;
            }

            .queue-row:hover {
                background-color: hsl(var(--surface-secondary)) !important;
            }

            .queue-number {
                font-weight: 600;
                color: hsl(var(--primary-color));
                font-size: 1.1rem;
            }

            .patient-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .patient-name {
                font-weight: 500;
                color: hsl(var(--text-primary));
            }

            .waiting-time {
                color: hsl(var(--text-secondary));
                font-size: 0.8rem;
            }

            .queue-actions {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .btn-sm {
                padding: 0.4rem 0.6rem;
                font-size: 0.875rem;
                min-width: auto;
            }

            .btn-sm i {
                font-size: 0.8rem;
            }

            .queue-message {
                padding: 1rem;
                border-radius: 6px;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                border: 1px solid;
            }

            .queue-message.success-message {
                background-color: hsl(var(--success-color) / 0.1);
                color: hsl(var(--success-color));
                border-color: hsl(var(--success-color) / 0.2);
            }

            .queue-message.error-message {
                background-color: hsl(var(--danger-color) / 0.1);
                color: hsl(var(--danger-color));
                border-color: hsl(var(--danger-color) / 0.2);
            }

            .queue-message.warning-message {
                background-color: hsl(var(--warning-color) / 0.1);
                color: hsl(var(--warning-color));
                border-color: hsl(var(--warning-color) / 0.2);
            }

            .queue-message.info-message {
                background-color: hsl(var(--primary-color) / 0.1);
                color: hsl(var(--primary-color));
                border-color: hsl(var(--primary-color) / 0.2);
            }

            @media (max-width: 768px) {
                .queue-actions {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .btn-sm {
                    width: 100%;
                    justify-content: center;
                }

                .patient-info {
                    text-align: left;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Export queue data
    exportQueueData() {
        try {
            const queue = storageManager.getQueue();
            const csvContent = this.convertQueueToCSV(queue);
            this.downloadCSV(csvContent, 'queue_export.csv');
        } catch (error) {
            console.error('Error exporting queue data:', error);
            this.showMessage('Failed to export queue data', 'error');
        }
    }

    convertQueueToCSV(queue) {
        const headers = ['Queue Number', 'Patient Name', 'Arrival Time', 'Status', 'Waiting Time'];
        const csvRows = [headers.join(',')];

        queue.forEach(entry => {
            const waitingTime = this.calculateWaitingTime(entry.arrivalTime, entry.status);
            const row = [
                entry.queueNumber,
                this.escapeCSV(entry.patientName),
                entry.arrivalTime,
                entry.status,
                this.escapeCSV(waitingTime)
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    escapeCSV(str) {
        if (str && str.toString().includes(',')) {
            return `"${str.toString().replace(/"/g, '""')}"`;
        }
        return str || '';
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Clear completed entries older than specified hours
    clearOldCompletedEntries(hoursOld = 24) {
        try {
            const queue = storageManager.getQueue();
            const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
            
            const filteredQueue = queue.filter(entry => {
                if (entry.status === 'completed') {
                    const completedTime = new Date(entry.completedAt || entry.arrivalTime);
                    return completedTime > cutoffTime;
                }
                return true; // Keep all non-completed entries
            });

            if (filteredQueue.length < queue.length) {
                storageManager.setQueue(filteredQueue);
                const removedCount = queue.length - filteredQueue.length;
                this.showMessage(`Cleared ${removedCount} old completed entries`, 'success');
                this.refreshQueue();
                this.updateDashboardStats();
            } else {
                this.showMessage('No old completed entries to clear', 'info');
            }
        } catch (error) {
            console.error('Error clearing old entries:', error);
            this.showMessage('Failed to clear old entries', 'error');
        }
    }
}

// Create global instance
window.queueManager = new QueueManager();
