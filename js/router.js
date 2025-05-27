// Client-side Router for Hospital Management SPA
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.defaultRoute = 'login';
        this.init();
    }

    init() {
        // Define application routes
        this.defineRoutes();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Handle initial page load
        this.handleInitialLoad();
    }

    defineRoutes() {
        // Define all available routes and their handlers
        this.routes.set('login', {
            page: 'login-page',
            title: 'Login - MediCare Hospital',
            requiresAuth: false,
            handler: () => this.handleLoginRoute()
        });

        this.routes.set('dashboard', {
            page: 'dashboard-page',
            title: 'Dashboard - MediCare Hospital',
            requiresAuth: true,
            handler: () => this.handleDashboardRoute()
        });

        this.routes.set('face-recognition', {
            page: 'face-recognition-page',
            title: 'Face Recognition - MediCare Hospital',
            requiresAuth: true,
            handler: () => this.handleFaceRecognitionRoute()
        });

        this.routes.set('add-patient', {
            page: 'add-patient-page',
            title: 'Add Patient - MediCare Hospital',
            requiresAuth: true,
            handler: () => this.handleAddPatientRoute()
        });

        this.routes.set('patients', {
            page: 'patients-page',
            title: 'All Patients - MediCare Hospital',
            requiresAuth: true,
            handler: () => this.handlePatientsRoute()
        });

        this.routes.set('medical-records', {
            page: 'medical-records-page',
            title: 'Medical Records - MediCare Hospital',
            requiresAuth: true,
            handler: () => this.handleMedicalRecordsRoute()
        });

        this.routes.set('queue', {
            page: 'queue-page',
            title: 'Patient Queue - MediCare Hospital',
            requiresAuth: true,
            handler: () => this.handleQueueRoute()
        });
    }

    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            const route = event.state?.route || this.getRouteFromHash();
            this.navigateTo(route, false);
        });

        // Handle navigation link clicks
        document.addEventListener('click', (event) => {
            const link = event.target.closest('[data-route]');
            if (link) {
                event.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigateTo(route);
            }
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const route = this.getRouteFromHash();
            this.navigateTo(route, false);
        });
    }

    handleInitialLoad() {
        // Determine initial route
        let initialRoute = this.getRouteFromHash();
        
        // Check if user is authenticated
        if (!authManager.isAuthenticated()) {
            // Redirect to login if not authenticated and trying to access protected route
            if (initialRoute !== 'login') {
                initialRoute = 'login';
            }
        } else {
            // If authenticated and on login page, redirect to dashboard
            if (initialRoute === 'login' || !initialRoute) {
                initialRoute = 'dashboard';
            }
        }

        this.navigateTo(initialRoute, false);
    }

    navigateTo(routeName, updateHistory = true) {
        try {
            // Validate route exists
            if (!this.routes.has(routeName)) {
                console.warn(`Route '${routeName}' not found, redirecting to default`);
                routeName = this.defaultRoute;
            }

            const route = this.routes.get(routeName);

            // Check authentication requirements
            if (route.requiresAuth && !authManager.isAuthenticated()) {
                this.navigateTo('login');
                return;
            }

            // If trying to access login while authenticated, redirect to dashboard
            if (routeName === 'login' && authManager.isAuthenticated()) {
                this.navigateTo('dashboard');
                return;
            }

            // Hide all pages
            this.hideAllPages();

            // Show target page
            this.showPage(route.page);

            // Update navigation state
            this.updateNavigationState(routeName);

            // Update page title
            document.title = route.title;

            // Update URL and history
            if (updateHistory) {
                this.updateHistory(routeName);
            }

            // Execute route handler
            if (route.handler) {
                route.handler();
            }

            // Update current route
            this.currentRoute = routeName;

            // Add page transition animation
            this.addPageTransition();

        } catch (error) {
            console.error('Navigation error:', error);
            this.handleNavigationError(error);
        }
    }

    hideAllPages() {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });
    }

    showPage(pageId) {
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
        } else {
            console.error(`Page '${pageId}' not found`);
        }
    }

    updateNavigationState(routeName) {
        // Update header visibility
        const header = document.getElementById('header');
        const mainContent = document.getElementById('mainContent');
        
        if (routeName === 'login') {
            if (header) header.style.display = 'none';
            if (mainContent) mainContent.classList.remove('authenticated');
        } else {
            if (header) header.style.display = 'block';
            if (mainContent) mainContent.classList.add('authenticated');
            
            // Update current user display
            this.updateUserDisplay();
        }

        // Update active navigation link
        this.updateActiveNavLink(routeName);
    }

    updateUserDisplay() {
        const currentUserEl = document.getElementById('currentUser');
        if (currentUserEl && authManager.isAuthenticated()) {
            currentUserEl.textContent = authManager.getUserDisplayName();
        }
    }

    updateActiveNavLink(routeName) {
        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current route link
        const activeLink = document.querySelector(`[data-route="${routeName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updateHistory(routeName) {
        const url = routeName === this.defaultRoute ? '/' : `#${routeName}`;
        history.pushState({ route: routeName }, '', url);
    }

    getRouteFromHash() {
        const hash = window.location.hash.substring(1);
        return hash || this.defaultRoute;
    }

    addPageTransition() {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            activePage.classList.add('fade-in');
            setTimeout(() => {
                activePage.classList.remove('fade-in');
            }, 300);
        }
    }

    // Route handlers
    handleLoginRoute() {
        // Focus on username field
        setTimeout(() => {
            const usernameField = document.getElementById('username');
            if (usernameField) {
                usernameField.focus();
            }
        }, 100);
    }

    handleDashboardRoute() {
        // Update dashboard statistics
        this.updateDashboardDisplay();
        
        // Refresh activity feed
        this.updateActivityFeed();
    }

    handleFaceRecognitionRoute() {
        // Reset face recognition interface
        this.resetFaceRecognitionInterface();
    }

    handleAddPatientRoute() {
        // Clear any existing form data and messages
        if (window.patientManager) {
            patientManager.clearPatientForm();
        }
        
        // Focus on name field
        setTimeout(() => {
            const nameField = document.getElementById('patientName');
            if (nameField) {
                nameField.focus();
            }
        }, 100);
    }

    handlePatientsRoute() {
        // Refresh patients display
        if (window.patientsPageManager) {
            patientsPageManager.onPageLoad();
        }
    }

    handleMedicalRecordsRoute() {
        // Medical records page is handled by medicalRecordsManager
        // Patient data is loaded when confirmPatientIdentity is called
    }

    handleQueueRoute() {
        // Refresh queue display
        if (window.queueManager) {
            queueManager.refreshQueue();
        }
    }

    // Dashboard helpers
    updateDashboardDisplay() {
        try {
            const stats = storageManager.getStats();
            
            // Update stat cards
            const totalPatientsEl = document.getElementById('totalPatients');
            const queueLengthEl = document.getElementById('queueLength');
            const todayCheckinsEl = document.getElementById('todayCheckins');

            if (totalPatientsEl) {
                this.animateNumber(totalPatientsEl, stats.totalPatients);
            }
            if (queueLengthEl) {
                this.animateNumber(queueLengthEl, stats.queueLength);
            }
            if (todayCheckinsEl) {
                this.animateNumber(todayCheckinsEl, stats.todayCheckins);
            }

        } catch (error) {
            console.error('Error updating dashboard display:', error);
        }
    }

    updateActivityFeed() {
        try {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;

            const activities = storageManager.getActivity();
            
            if (activities.length === 0) {
                activityList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No recent activity</p>
                    </div>
                `;
                return;
            }

            // Show last 10 activities
            const recentActivities = activities.slice(0, 10);
            
            activityList.innerHTML = recentActivities.map(activity => `
                <div class="activity-item">
                    <div class="activity-content">
                        <span class="activity-message">${activity.message}</span>
                        <span class="activity-time">${this.formatActivityTime(activity.timestamp)}</span>
                    </div>
                </div>
            `).join('');

            // Add activity styles if not present
            this.addActivityStyles();

        } catch (error) {
            console.error('Error updating activity feed:', error);
        }
    }

    resetFaceRecognitionInterface() {
        try {
            // Stop any active camera
            if (window.faceRecognitionManager && faceRecognitionManager.cameraStream) {
                faceRecognitionManager.stopCamera();
            }

            // Reset results display
            const resultsContainer = document.getElementById('recognitionResults');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-slash"></i>
                        <p>No recognition performed yet</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error resetting face recognition interface:', error);
        }
    }

    // Utility methods
    animateNumber(element, targetNumber) {
        if (!element) return;

        const currentNumber = parseInt(element.textContent) || 0;
        const increment = targetNumber > currentNumber ? 1 : -1;
        const duration = Math.abs(targetNumber - currentNumber) * 50; // 50ms per number
        const maxDuration = 1000; // Maximum 1 second

        const animationDuration = Math.min(duration, maxDuration);
        const stepTime = animationDuration / Math.abs(targetNumber - currentNumber);

        let current = currentNumber;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === targetNumber) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    formatActivityTime(timestamp) {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (diffMins < 1) {
                return 'Just now';
            } else if (diffMins < 60) {
                return `${diffMins}m ago`;
            } else if (diffMins < 1440) {
                const hours = Math.floor(diffMins / 60);
                return `${hours}h ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return 'Unknown time';
        }
    }

    addActivityStyles() {
        if (document.querySelector('#activity-styles')) {
            return; // Styles already added
        }

        const styles = document.createElement('style');
        styles.id = 'activity-styles';
        styles.textContent = `
            .activity-item {
                padding: 0.75rem 0;
                border-bottom: 1px solid hsl(var(--border-light));
            }

            .activity-item:last-child {
                border-bottom: none;
            }

            .activity-content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
            }

            .activity-message {
                color: hsl(var(--text-primary));
                font-size: 0.9rem;
                line-height: 1.4;
                flex: 1;
            }

            .activity-time {
                color: hsl(var(--text-secondary));
                font-size: 0.8rem;
                white-space: nowrap;
                opacity: 0.8;
            }

            @media (max-width: 768px) {
                .activity-content {
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .activity-time {
                    align-self: flex-end;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    handleNavigationError(error) {
        console.error('Navigation error occurred:', error);
        
        // Show error message to user
        this.showNavigationError('An error occurred while navigating. Please try again.');
        
        // Fallback to default route
        setTimeout(() => {
            this.navigateTo(this.defaultRoute, false);
        }, 2000);
    }

    showNavigationError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'navigation-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;

        // Add error styles
        const errorStyle = document.createElement('style');
        errorStyle.textContent = `
            .navigation-error {
                position: fixed;
                top: 20px;
                right: 20px;
                background: hsl(var(--danger-color));
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                max-width: 400px;
            }
            .error-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
        `;

        document.head.appendChild(errorStyle);
        document.body.appendChild(errorDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
            if (errorStyle.parentNode) {
                errorStyle.remove();
            }
        }, 3000);
    }

    // Public API methods
    getCurrentRoute() {
        return this.currentRoute;
    }

    isRouteActive(routeName) {
        return this.currentRoute === routeName;
    }

    getAvailableRoutes() {
        return Array.from(this.routes.keys());
    }

    // Redirect helper
    redirectTo(routeName) {
        this.navigateTo(routeName);
    }

    // Go back in history
    goBack() {
        if (history.length > 1) {
            history.back();
        } else {
            this.navigateTo(this.defaultRoute);
        }
    }

    // Refresh current route
    refresh() {
        if (this.currentRoute) {
            this.navigateTo(this.currentRoute, false);
        }
    }
}

// Create global router instance
window.router = new Router();
