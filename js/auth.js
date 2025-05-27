// Authentication Manager for Hospital Management System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = storageManager.getUser();
        if (savedUser && this.isValidSession(savedUser)) {
            this.currentUser = savedUser;
        }
    }

    // Demo authentication - in production this would connect to a real auth system
    async login(username, password) {
        try {
            // Simulate network delay
            await this.delay(500);

            // Demo credentials validation
            const validCredentials = [
                { username: 'admin', password: 'password', name: 'Admin User', role: 'receptionist' },
                { username: 'receptionist', password: 'hospital123', name: 'Receptionist', role: 'receptionist' },
                { username: 'nurse', password: 'nurse123', name: 'Nurse Smith', role: 'nurse' }
            ];

            const user = validCredentials.find(
                cred => cred.username === username && cred.password === password
            );

            if (user) {
                const authenticatedUser = {
                    id: storageManager.generateId(),
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    loginTime: new Date().toISOString(),
                    sessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
                };

                this.currentUser = authenticatedUser;
                storageManager.setUser(authenticatedUser);
                storageManager.addActivity(`User ${user.name} logged in`);

                return {
                    success: true,
                    user: authenticatedUser
                };
            } else {
                return {
                    success: false,
                    error: 'Invalid username or password'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'An error occurred during login. Please try again.'
            };
        }
    }

    logout() {
        try {
            if (this.currentUser) {
                storageManager.addActivity(`User ${this.currentUser.name} logged out`);
            }
            
            this.currentUser = null;
            storageManager.clearUser();
            
            return {
                success: true
            };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: 'An error occurred during logout'
            };
        }
    }

    isAuthenticated() {
        if (!this.currentUser) {
            return false;
        }

        return this.isValidSession(this.currentUser);
    }

    isValidSession(user) {
        try {
            if (!user || !user.sessionExpiry) {
                return false;
            }

            const now = new Date();
            const expiry = new Date(user.sessionExpiry);
            
            return now < expiry;
        } catch (error) {
            console.error('Session validation error:', error);
            return false;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasRole(role) {
        if (!this.isAuthenticated()) {
            return false;
        }

        return this.currentUser.role === role;
    }

    hasPermission(permission) {
        if (!this.isAuthenticated()) {
            return false;
        }

        const rolePermissions = {
            receptionist: [
                'view_patients',
                'add_patient',
                'edit_patient',
                'view_queue',
                'manage_queue',
                'face_recognition'
            ],
            nurse: [
                'view_patients',
                'edit_patient',
                'view_queue',
                'face_recognition'
            ],
            doctor: [
                'view_patients',
                'edit_patient',
                'view_medical_records',
                'edit_medical_records'
            ]
        };

        const userPermissions = rolePermissions[this.currentUser.role] || [];
        return userPermissions.includes(permission);
    }

    refreshSession() {
        try {
            if (!this.isAuthenticated()) {
                return false;
            }

            // Extend session by 8 hours
            this.currentUser.sessionExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
            storageManager.setUser(this.currentUser);
            
            return true;
        } catch (error) {
            console.error('Session refresh error:', error);
            return false;
        }
    }

    // Check session validity periodically
    startSessionMonitoring() {
        // Check every 5 minutes
        setInterval(() => {
            if (this.currentUser && !this.isValidSession(this.currentUser)) {
                this.handleSessionExpiry();
            }
        }, 5 * 60 * 1000);

        // Check every minute for near expiry warning
        setInterval(() => {
            if (this.currentUser) {
                const now = new Date();
                const expiry = new Date(this.currentUser.sessionExpiry);
                const timeUntilExpiry = expiry - now;
                
                // Warn if session expires in 15 minutes
                if (timeUntilExpiry > 0 && timeUntilExpiry < 15 * 60 * 1000) {
                    this.showSessionWarning(Math.floor(timeUntilExpiry / 60000));
                }
            }
        }, 60 * 1000);
    }

    handleSessionExpiry() {
        this.showMessage('Your session has expired. Please log in again.', 'error');
        this.logout();
        
        // Redirect to login page
        if (window.router) {
            window.router.navigateTo('login');
        }
    }

    showSessionWarning(minutesLeft) {
        const message = `Your session will expire in ${minutesLeft} minute(s). Click to extend session.`;
        
        // Create warning notification
        const warning = document.createElement('div');
        warning.className = 'session-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-clock"></i>
                <span>${message}</span>
                <button class="btn-extend" onclick="authManager.refreshSession()">Extend Session</button>
                <button class="btn-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles if not already present
        if (!document.querySelector('#session-warning-styles')) {
            const styles = document.createElement('style');
            styles.id = 'session-warning-styles';
            styles.textContent = `
                .session-warning {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: hsl(45 93% 47% / 0.95);
                    color: white;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    max-width: 400px;
                }
                .warning-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                .btn-extend {
                    background: white;
                    color: hsl(45 93% 47%);
                    border: none;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                }
                .btn-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 1.25rem;
                    margin-left: auto;
                }
            `;
            document.head.appendChild(styles);
        }

        // Remove existing warnings
        const existingWarning = document.querySelector('.session-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        document.body.appendChild(warning);

        // Auto-remove after 30 seconds if not interacted with
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 30000);
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Insert at top of main content
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.insertBefore(messageDiv, mainContent.firstChild);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    // Utility method for simulating network delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get user display information
    getUserDisplayName() {
        return this.currentUser ? this.currentUser.name : 'Unknown User';
    }

    getUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    // Validate form inputs
    validateLoginForm(username, password) {
        const errors = [];

        if (!username || username.trim().length === 0) {
            errors.push('Username is required');
        }

        if (!password || password.length === 0) {
            errors.push('Password is required');
        }

        if (username && username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (password && password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Create global instance
window.authManager = new AuthManager();
