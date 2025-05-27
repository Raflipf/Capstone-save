// Main Application Controller for Hospital Management System
class HospitalApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Hospital Management System...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startInitialization());
            } else {
                this.startInitialization();
            }

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    async startInitialization() {
        try {
            // Show loading indicator
            this.showLoadingIndicator();

            // Initialize core modules in order
            await this.initializeModules();

            // Set up global event listeners
            this.setupGlobalEventListeners();

            // Initialize authentication monitoring
            this.initializeAuthMonitoring();

            // Set up periodic tasks
            this.setupPeriodicTasks();

            // Mark as initialized
            this.isInitialized = true;

            // Hide loading indicator
            this.hideLoadingIndicator();

            console.log('Hospital Management System initialized successfully');

            // Show welcome message if first time user
            this.checkFirstTimeUser();

        } catch (error) {
            console.error('Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeModules() {
        try {
            // Storage Manager (already initialized)
            this.modules.storage = window.storageManager;
            console.log('✓ Storage Manager initialized');

            // Authentication Manager (already initialized)
            this.modules.auth = window.authManager;
            console.log('✓ Authentication Manager initialized');

            // Patient Manager (already initialized)
            this.modules.patients = window.patientManager;
            console.log('✓ Patient Manager initialized');

            // Face Recognition Manager (already initialized)
            this.modules.faceRecognition = window.faceRecognitionManager;
            console.log('✓ Face Recognition Manager initialized');

            // Queue Manager (already initialized)
            this.modules.queue = window.queueManager;
            console.log('✓ Queue Manager initialized');

            // Router (already initialized)
            this.modules.router = window.router;
            console.log('✓ Router initialized');

            // Initialize additional app-specific functionality
            this.initializeFormsValidation();
            this.initializeKeyboardShortcuts();
            this.initializeAccessibility();

        } catch (error) {
            throw new Error(`Module initialization failed: ${error.message}`);
        }
    }

    setupGlobalEventListeners() {
        try {
            // Login form handler
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }

            // Logout button handler
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }

            // Global error handler
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                this.handleGlobalError(event.error);
            });

            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                this.handleGlobalError(event.reason);
            });

            // Online/offline status
            window.addEventListener('online', () => this.handleOnlineStatus(true));
            window.addEventListener('offline', () => this.handleOnlineStatus(false));

            // Before unload warning for unsaved changes
            window.addEventListener('beforeunload', (event) => {
                if (this.hasUnsavedChanges()) {
                    event.preventDefault();
                    event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                    return event.returnValue;
                }
            });

            console.log('✓ Global event listeners set up');

        } catch (error) {
            console.error('Error setting up global event listeners:', error);
        }
    }

    initializeAuthMonitoring() {
        try {
            // Start session monitoring
            if (this.modules.auth) {
                this.modules.auth.startSessionMonitoring();
            }

            // Check authentication status periodically
            setInterval(() => {
                if (this.modules.auth && !this.modules.auth.isAuthenticated() && 
                    this.modules.router && this.modules.router.getCurrentRoute() !== 'login') {
                    this.modules.router.navigateTo('login');
                }
            }, 60000); // Check every minute

            console.log('✓ Authentication monitoring initialized');

        } catch (error) {
            console.error('Error initializing auth monitoring:', error);
        }
    }

    setupPeriodicTasks() {
        try {
            // Update dashboard statistics every 30 seconds
            setInterval(() => {
                if (this.modules.router && this.modules.router.getCurrentRoute() === 'dashboard') {
                    this.modules.storage.updateStats();
                    if (this.modules.router.updateDashboardDisplay) {
                        this.modules.router.updateDashboardDisplay();
                    }
                }
            }, 30000);

            // Refresh queue display every 15 seconds when on queue page
            setInterval(() => {
                if (this.modules.router && this.modules.router.getCurrentRoute() === 'queue') {
                    if (this.modules.queue) {
                        this.modules.queue.refreshQueue();
                    }
                }
            }, 15000);

            // Auto-save form data every 30 seconds
            setInterval(() => {
                this.autoSaveFormData();
            }, 30000);

            console.log('✓ Periodic tasks initialized');

        } catch (error) {
            console.error('Error setting up periodic tasks:', error);
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            const username = form.username.value.trim();
            const password = form.password.value;

            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Clear previous errors
            this.clearLoginErrors();

            // Validate input
            const validation = this.modules.auth.validateLoginForm(username, password);
            if (!validation.isValid) {
                this.showLoginErrors(validation.errors);
                return;
            }

            // Attempt login
            const result = await this.modules.auth.login(username, password);

            if (result.success) {
                // Successful login
                this.showLoginSuccess('Login successful! Redirecting...');
                
                // Clear form
                form.reset();
                
                // Navigate to dashboard
                setTimeout(() => {
                    this.modules.router.navigateTo('dashboard');
                }, 1000);

            } else {
                // Login failed
                this.showLoginErrors([result.error]);
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showLoginErrors(['An unexpected error occurred. Please try again.']);
        } finally {
            // Remove loading state
            const submitBtn = event.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    handleLogout() {
        try {
            if (confirm('Are you sure you want to logout?')) {
                const result = this.modules.auth.logout();
                
                if (result.success) {
                    // Clear any cached data
                    this.clearCachedData();
                    
                    // Navigate to login
                    this.modules.router.navigateTo('login');
                    
                    // Show logout message
                    setTimeout(() => {
                        this.showMessage('You have been logged out successfully.', 'info');
                    }, 500);
                } else {
                    this.showMessage('Error during logout. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('An error occurred during logout.', 'error');
        }
    }

    // Login form helpers
    showLoginErrors(errors) {
        this.clearLoginErrors();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'login-error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-circle"></i>
                <div class="error-text">
                    ${errors.length === 1 ? 
                        `<p>${errors[0]}</p>` : 
                        `<ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>`
                    }
                </div>
            </div>
        `;

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.insertBefore(errorDiv, loginForm.firstChild);
        }

        // Add error styles
        this.addLoginErrorStyles();
    }

    showLoginSuccess(message) {
        this.clearLoginErrors();

        const successDiv = document.createElement('div');
        successDiv.className = 'login-success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <p>${message}</p>
            </div>
        `;

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.insertBefore(successDiv, loginForm.firstChild);
        }

        // Add success styles
        this.addLoginSuccessStyles();
    }

    clearLoginErrors() {
        const existingErrors = document.querySelectorAll('.login-error-message, .login-success-message');
        existingErrors.forEach(error => error.remove());
    }

    addLoginErrorStyles() {
        if (document.querySelector('#login-error-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'login-error-styles';
        styles.textContent = `
            .login-error-message {
                background-color: hsl(var(--danger-color) / 0.1);
                border: 1px solid hsl(var(--danger-color) / 0.2);
                border-radius: 6px;
                padding: 1rem;
                margin-bottom: 1rem;
                color: hsl(var(--danger-color));
            }

            .login-success-message {
                background-color: hsl(var(--success-color) / 0.1);
                border: 1px solid hsl(var(--success-color) / 0.2);
                border-radius: 6px;
                padding: 1rem;
                margin-bottom: 1rem;
                color: hsl(var(--success-color));
            }

            .error-content, .success-content {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
            }

            .error-content i, .success-content i {
                margin-top: 0.125rem;
                flex-shrink: 0;
            }

            .error-text ul {
                margin: 0;
                padding-left: 1rem;
            }

            .error-text li {
                margin-bottom: 0.25rem;
            }

            .error-text p, .success-content p {
                margin: 0;
            }
        `;

        document.head.appendChild(styles);
    }

    addLoginSuccessStyles() {
        // Success styles are included in addLoginErrorStyles
        this.addLoginErrorStyles();
    }

    // Additional initialization methods
    initializeFormsValidation() {
        try {
            // Add real-time validation to forms
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => this.clearFieldError(input));
                });
            });

            console.log('✓ Forms validation initialized');
        } catch (error) {
            console.error('Error initializing forms validation:', error);
        }
    }

    initializeKeyboardShortcuts() {
        try {
            document.addEventListener('keydown', (event) => {
                // Only handle shortcuts when not in input fields
                if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                    return;
                }

                // Ctrl/Cmd + key shortcuts
                if (event.ctrlKey || event.metaKey) {
                    switch (event.key.toLowerCase()) {
                        case 'd':
                            event.preventDefault();
                            this.modules.router.navigateTo('dashboard');
                            break;
                        case 'f':
                            event.preventDefault();
                            this.modules.router.navigateTo('face-recognition');
                            break;
                        case 'n':
                            event.preventDefault();
                            this.modules.router.navigateTo('add-patient');
                            break;
                        case 'q':
                            event.preventDefault();
                            this.modules.router.navigateTo('queue');
                            break;
                    }
                }

                // Escape key to close modals
                if (event.key === 'Escape') {
                    const modal = document.querySelector('.modal.active');
                    if (modal) {
                        modal.classList.remove('active');
                    }
                }
            });

            console.log('✓ Keyboard shortcuts initialized');
        } catch (error) {
            console.error('Error initializing keyboard shortcuts:', error);
        }
    }

    initializeAccessibility() {
        try {
            // Add skip navigation link
            this.addSkipNavigation();

            // Improve focus management
            this.improveFocusManagement();

            // Add ARIA labels where needed
            this.addAriaLabels();

            console.log('✓ Accessibility features initialized');
        } catch (error) {
            console.error('Error initializing accessibility:', error);
        }
    }

    // Utility methods
    validateField(field) {
        // Basic field validation
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        
        if (isRequired && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }

        // Type-specific validation
        switch (field.type) {
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
            case 'tel':
                if (value && !/^(\+62|62|0)[0-9]{8,12}$/.test(value.replace(/[\s-]/g, ''))) {
                    this.showFieldError(field, 'Please enter a valid phone number');
                    return false;
                }
                break;
        }

        this.clearFieldError(field);
        return true;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
        field.classList.add('error');
    }

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.classList.remove('error');
    }

    autoSaveFormData() {
        try {
            // Auto-save patient form data
            const patientForm = document.getElementById('patientForm');
            if (patientForm && this.modules.router.getCurrentRoute() === 'add-patient') {
                const formData = new FormData(patientForm);
                const data = Object.fromEntries(formData.entries());
                localStorage.setItem('hospital_patient_form_draft', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error auto-saving form data:', error);
        }
    }

    hasUnsavedChanges() {
        // Check if there are any unsaved changes in forms
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const inputs = form.querySelectorAll('input:not([type="submit"]):not([type="button"]), select, textarea');
            for (const input of inputs) {
                if (input.value.trim() && input.defaultValue !== input.value) {
                    return true;
                }
            }
        }
        return false;
    }

    clearCachedData() {
        try {
            // Clear any temporary cached data
            localStorage.removeItem('hospital_patient_form_draft');
        } catch (error) {
            console.error('Error clearing cached data:', error);
        }
    }

    // Accessibility helpers
    addSkipNavigation() {
        const skipLink = document.createElement('a');
        skipLink.href = '#mainContent';
        skipLink.className = 'skip-nav';
        skipLink.textContent = 'Skip to main content';
        
        const skipStyles = document.createElement('style');
        skipStyles.textContent = `
            .skip-nav {
                position: absolute;
                top: -40px;
                left: 6px;
                background: hsl(var(--primary-color));
                color: white;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 10000;
            }
            .skip-nav:focus {
                top: 6px;
            }
        `;
        
        document.head.appendChild(skipStyles);
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    improveFocusManagement() {
        // Trap focus in modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                const modal = document.querySelector('.modal.active');
                if (modal) {
                    this.trapFocus(event, modal);
                }
            }
        });
    }

    trapFocus(event, container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    addAriaLabels() {
        // Add missing ARIA labels
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon && !button.textContent.trim()) {
                // Button only has icon, add aria-label based on icon class
                const iconClass = icon.className;
                if (iconClass.includes('fa-play')) button.setAttribute('aria-label', 'Start');
                if (iconClass.includes('fa-stop')) button.setAttribute('aria-label', 'Stop');
                if (iconClass.includes('fa-camera')) button.setAttribute('aria-label', 'Capture');
                if (iconClass.includes('fa-plus')) button.setAttribute('aria-label', 'Add');
                if (iconClass.includes('fa-edit')) button.setAttribute('aria-label', 'Edit');
                if (iconClass.includes('fa-trash')) button.setAttribute('aria-label', 'Delete');
            }
        });
    }

    // Error handling
    handleGlobalError(error) {
        console.error('Global error handled:', error);
        
        // Show user-friendly error message
        this.showMessage('An unexpected error occurred. Please refresh the page and try again.', 'error');
    }

    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Show critical error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: #f5f5f5;">
                <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
                    <h2 style="margin-bottom: 1rem; color: #1f2937;">Application Failed to Load</h2>
                    <p style="margin-bottom: 1.5rem; color: #6b7280;">
                        The hospital management system could not be initialized. Please check your internet connection and try refreshing the page.
                    </p>
                    <button onclick="window.location.reload()" style="background: #2563eb; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }

    handleOnlineStatus(isOnline) {
        const message = isOnline ? 
            'Connection restored. All features are now available.' : 
            'Connection lost. Some features may not work properly.';
        
        this.showMessage(message, isOnline ? 'success' : 'warning');
    }

    showMessage(message, type = 'info') {
        // Create and show a temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = `app-message ${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add message styles
        if (!document.querySelector('#app-message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'app-message-styles';
            styles.textContent = `
                .app-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }

                .app-message.success-message {
                    background: hsl(var(--success-color));
                    color: white;
                }

                .app-message.error-message {
                    background: hsl(var(--danger-color));
                    color: white;
                }

                .app-message.warning-message {
                    background: hsl(var(--warning-color));
                    color: white;
                }

                .app-message.info-message {
                    background: hsl(var(--primary-color));
                    color: white;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 5000);
    }

    showLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'app-loading';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>Loading Hospital Management System...</p>
            </div>
        `;

        const loadingStyles = document.createElement('style');
        loadingStyles.textContent = `
            #app-loading {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .loading-content {
                text-align: center;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid hsl(var(--primary-color));
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(loadingStyles);
        document.body.appendChild(loadingDiv);
    }

    hideLoadingIndicator() {
        const loadingDiv = document.getElementById('app-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    checkFirstTimeUser() {
        const hasVisitedBefore = localStorage.getItem('hospital_has_visited');
        if (!hasVisitedBefore) {
            localStorage.setItem('hospital_has_visited', 'true');
            
            // Show welcome message after a short delay
            setTimeout(() => {
                if (this.modules.auth.isAuthenticated()) {
                    this.showWelcomeMessage();
                }
            }, 1000);
        }
    }

    showWelcomeMessage() {
        this.showMessage('Welcome to MediCare Hospital Management System! Use Ctrl+D for Dashboard, Ctrl+F for Face Recognition, Ctrl+N for New Patient, and Ctrl+Q for Queue.', 'info');
    }

    // Public API
    getModules() {
        return this.modules;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize the application
window.hospitalApp = new HospitalApp();
