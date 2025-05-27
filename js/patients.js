// Patient Management System
class PatientManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize any necessary setup
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Patient form submission
        document.addEventListener('DOMContentLoaded', () => {
            const patientForm = document.getElementById('patientForm');
            if (patientForm) {
                patientForm.addEventListener('submit', (e) => this.handlePatientFormSubmit(e));
            }

            const clearFormBtn = document.getElementById('clearFormBtn');
            if (clearFormBtn) {
                clearFormBtn.addEventListener('click', () => this.clearPatientForm());
            }

            const closeModalBtn = document.getElementById('closeModalBtn');
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => this.closePatientModal());
            }

            // Photo capture buttons
            const startPhotoCameraBtn = document.getElementById('startPhotoCamera');
            if (startPhotoCameraBtn) {
                startPhotoCameraBtn.addEventListener('click', () => this.startPhotoCamera());
            }

            const uploadPhotoFileBtn = document.getElementById('uploadPhotoFile');
            if (uploadPhotoFileBtn) {
                uploadPhotoFileBtn.addEventListener('click', () => this.triggerFileUpload());
            }

            const capturePhotoBtn = document.getElementById('capturePhotoBtn');
            if (capturePhotoBtn) {
                capturePhotoBtn.addEventListener('click', () => this.capturePhoto());
            }

            const cancelCameraBtn = document.getElementById('cancelCameraBtn');
            if (cancelCameraBtn) {
                cancelCameraBtn.addEventListener('click', () => this.closeCameraModal());
            }

            // File input change
            const patientPhoto = document.getElementById('patientPhoto');
            if (patientPhoto) {
                patientPhoto.addEventListener('change', (e) => this.handleFileSelect(e));
            }

            // Modal background click to close
            const modal = document.getElementById('patientModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closePatientModal();
                    }
                });
            }

            const cameraModal = document.getElementById('photoCameraModal');
            if (cameraModal) {
                cameraModal.addEventListener('click', (e) => {
                    if (e.target === cameraModal) {
                        this.closeCameraModal();
                    }
                });
            }
        });
    }

    async handlePatientFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        try {
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Get form data
            const formData = new FormData(form);
            const patientData = this.extractPatientData(formData);

            // Validate patient data
            const validation = this.validatePatientData(patientData);
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return;
            }

            // Check for duplicate NIK
            const existingPatient = storageManager.getPatientByNIK(patientData.nik);
            if (existingPatient) {
                this.showMessage('A patient with this NIK already exists in the system.', 'error');
                return;
            }

            // Handle photo upload if present
            if (this.capturedPhoto) {
                patientData.photo = this.capturedPhoto;
            } else if (formData.get('photo') && formData.get('photo').size > 0) {
                patientData.photo = await this.processPatientPhoto(formData.get('photo'));
            }

            // Add patient to storage
            const newPatient = storageManager.addPatient(patientData);
            
            if (newPatient) {
                this.showMessage('Patient added successfully!', 'success');
                this.clearPatientForm();
                
                // Navigate to patient record or dashboard
                setTimeout(() => {
                    if (window.router) {
                        window.router.navigateTo('dashboard');
                    }
                }, 1500);
            } else {
                throw new Error('Failed to add patient to database');
            }

        } catch (error) {
            console.error('Error adding patient:', error);
            this.showMessage('Failed to add patient. Please try again.', 'error');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    extractPatientData(formData) {
        return {
            name: formData.get('name')?.trim(),
            nik: formData.get('nik')?.trim(),
            dob: formData.get('dob'),
            gender: formData.get('gender'),
            address: formData.get('address')?.trim(),
            phone: formData.get('phone')?.trim(),
            email: formData.get('email')?.trim()
        };
    }

    validatePatientData(data) {
        const errors = [];

        // Name validation
        if (!data.name || data.name.length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }

        // NIK validation (Indonesian ID format: 16 digits)
        if (!data.nik || !/^\d{16}$/.test(data.nik)) {
            errors.push('NIK must be exactly 16 digits');
        }

        // Date of birth validation
        if (!data.dob) {
            errors.push('Date of birth is required');
        } else {
            const dobDate = new Date(data.dob);
            const today = new Date();
            const age = today.getFullYear() - dobDate.getFullYear();
            
            if (dobDate > today) {
                errors.push('Date of birth cannot be in the future');
            } else if (age > 150) {
                errors.push('Please enter a valid date of birth');
            }
        }

        // Gender validation
        if (!data.gender || !['male', 'female'].includes(data.gender)) {
            errors.push('Please select a valid gender');
        }

        // Address validation
        if (!data.address || data.address.length < 10) {
            errors.push('Address must be at least 10 characters long');
        }

        // Phone validation (Indonesian phone format)
        if (!data.phone || !/^(\+62|62|0)[0-9]{8,12}$/.test(data.phone.replace(/[\s-]/g, ''))) {
            errors.push('Please enter a valid Indonesian phone number');
        }

        // Email validation (optional but must be valid if provided)
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Please enter a valid email address');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    async processPatientPhoto(photoFile) {
        return new Promise((resolve, reject) => {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(photoFile.type)) {
                reject(new Error('Please upload a valid image file (JPEG, PNG, or WebP)'));
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (photoFile.size > maxSize) {
                reject(new Error('Photo file size must be less than 5MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Create image element to validate and resize
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set max dimensions for stored image
                        const maxWidth = 400;
                        const maxHeight = 400;
                        
                        let { width, height } = img;
                        
                        // Calculate new dimensions maintaining aspect ratio
                        if (width > height) {
                            if (width > maxWidth) {
                                height = (height * maxWidth) / width;
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = (width * maxHeight) / height;
                                height = maxHeight;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw and compress image
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to base64 with compression
                        const compressedPhoto = canvas.toDataURL('image/jpeg', 0.8);
                        resolve(compressedPhoto);
                    };
                    
                    img.onerror = () => {
                        reject(new Error('Invalid image file'));
                    };
                    
                    img.src = e.target.result;
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read image file'));
            };
            
            reader.readAsDataURL(photoFile);
        });
    }

    showValidationErrors(errors) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        // Create and show new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <div>
                <strong>Please correct the following errors:</strong>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;

        const form = document.getElementById('patientForm');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
        }

        // Scroll to top of form
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        const form = document.getElementById('patientForm');
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    clearPatientForm() {
        const form = document.getElementById('patientForm');
        if (form) {
            form.reset();
            
            // Clear photo preview
            const photoPreview = document.getElementById('photoPreview');
            if (photoPreview) {
                photoPreview.innerHTML = `
                    <i class="fas fa-user"></i>
                    <p>No photo selected</p>
                `;
            }
            
            // Clear captured photo
            this.capturedPhoto = null;
            
            // Remove any error/success messages
            const messages = form.querySelectorAll('.error-message, .success-message');
            messages.forEach(msg => msg.remove());
        }
    }

    // Display patient details in modal
    showPatientDetails(patientId) {
        const patient = storageManager.getPatientById(patientId);
        if (!patient) {
            this.showMessage('Patient not found', 'error');
            return;
        }

        const modal = document.getElementById('patientModal');
        const modalBody = document.getElementById('patientModalBody');
        
        if (!modal || !modalBody) {
            console.error('Patient modal elements not found');
            return;
        }

        // Calculate age
        const age = this.calculateAge(patient.dob);

        modalBody.innerHTML = `
            <div class="patient-card">
                <div class="patient-photo-container">
                    ${patient.photo ? 
                        `<img src="${patient.photo}" alt="Patient Photo" class="patient-photo">` :
                        `<div class="patient-photo-placeholder">
                            <i class="fas fa-user"></i>
                        </div>`
                    }
                </div>
                <div class="patient-details">
                    <h3>${patient.name}</h3>
                    <div class="patient-info">
                        <div class="info-item">
                            <div class="info-label">NIK</div>
                            <div class="info-value">${patient.nik}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Date of Birth</div>
                            <div class="info-value">${this.formatDate(patient.dob)} (${age} years old)</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Gender</div>
                            <div class="info-value">${this.capitalizeFirst(patient.gender)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Phone</div>
                            <div class="info-value">${patient.phone}</div>
                        </div>
                        ${patient.email ? `
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${patient.email}</div>
                        </div>
                        ` : ''}
                        <div class="info-item">
                            <div class="info-label">Address</div>
                            <div class="info-value">${patient.address}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Registered</div>
                            <div class="info-value">${storageManager.formatDateTime(patient.registeredAt)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Last Visit</div>
                            <div class="info-value">${storageManager.formatDateTime(patient.lastVisit)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-actions" style="margin-top: 2rem; text-align: right;">
                <button class="btn btn-success" onclick="queueManager.addPatientToQueue('${patient.id}')">
                    <i class="fas fa-plus"></i>
                    Add to Queue
                </button>
            </div>
        `;

        modal.classList.add('active');
        
        // Update last visit time
        storageManager.updatePatient(patient.id, { lastVisit: new Date().toISOString() });
    }

    closePatientModal() {
        const modal = document.getElementById('patientModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Photo capture methods
    async startPhotoCamera() {
        try {
            const cameraModal = document.getElementById('photoCameraModal');
            const cameraVideo = document.getElementById('cameraVideo');
            
            if (!cameraModal || !cameraVideo) {
                throw new Error('Camera elements not found');
            }

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            cameraVideo.srcObject = stream;
            cameraModal.classList.add('active');
            this.cameraStream = stream;

        } catch (error) {
            console.error('Error starting camera:', error);
            let errorMessage = 'Failed to access camera. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else {
                errorMessage += 'Please check your camera and try again.';
            }
            
            this.showMessage(errorMessage, 'error');
        }
    }

    capturePhoto() {
        try {
            const cameraVideo = document.getElementById('cameraVideo');
            const photoPreview = document.getElementById('photoPreview');
            
            if (!cameraVideo || !photoPreview) {
                throw new Error('Camera or preview elements not found');
            }

            // Create canvas to capture frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = cameraVideo.videoWidth;
            canvas.height = cameraVideo.videoHeight;
            
            // Draw video frame to canvas
            ctx.drawImage(cameraVideo, 0, 0);
            
            // Convert to base64
            const photoData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Update preview
            photoPreview.innerHTML = `<img src="${photoData}" alt="Patient Photo">`;
            
            // Store photo data
            this.capturedPhoto = photoData;
            
            // Close camera modal
            this.closeCameraModal();
            
            this.showMessage('Photo captured successfully!', 'success');

        } catch (error) {
            console.error('Error capturing photo:', error);
            this.showMessage('Failed to capture photo. Please try again.', 'error');
        }
    }

    closeCameraModal() {
        try {
            const cameraModal = document.getElementById('photoCameraModal');
            
            if (this.cameraStream) {
                const tracks = this.cameraStream.getTracks();
                tracks.forEach(track => track.stop());
                this.cameraStream = null;
            }

            if (cameraModal) {
                cameraModal.classList.remove('active');
            }

        } catch (error) {
            console.error('Error closing camera modal:', error);
        }
    }

    triggerFileUpload() {
        const fileInput = document.getElementById('patientPhoto');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processPatientPhoto(file)
                .then(photoData => {
                    const photoPreview = document.getElementById('photoPreview');
                    if (photoPreview) {
                        photoPreview.innerHTML = `<img src="${photoData}" alt="Patient Photo">`;
                    }
                    this.capturedPhoto = photoData;
                    this.showMessage('Photo uploaded successfully!', 'success');
                })
                .catch(error => {
                    console.error('Error processing uploaded photo:', error);
                    this.showMessage('Failed to process uploaded photo. Please try again.', 'error');
                });
        }
    }

    // Search patients by various criteria
    searchPatients(query) {
        const patients = storageManager.getPatients();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            return patients;
        }

        return patients.filter(patient => 
            patient.name.toLowerCase().includes(searchTerm) ||
            patient.nik.includes(searchTerm) ||
            patient.phone.includes(searchTerm) ||
            (patient.email && patient.email.toLowerCase().includes(searchTerm))
        );
    }

    // Get patients by gender
    getPatientsByGender(gender) {
        const patients = storageManager.getPatients();
        return patients.filter(patient => patient.gender === gender);
    }

    // Get patients by age range
    getPatientsByAgeRange(minAge, maxAge) {
        const patients = storageManager.getPatients();
        return patients.filter(patient => {
            const age = this.calculateAge(patient.dob);
            return age >= minAge && age <= maxAge;
        });
    }

    // Utility methods
    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Export patient data for backup
    exportPatientData() {
        const patients = storageManager.getPatients();
        const csvContent = this.convertToCSV(patients);
        this.downloadCSV(csvContent, 'patients_export.csv');
    }

    convertToCSV(patients) {
        const headers = ['Name', 'NIK', 'Date of Birth', 'Gender', 'Phone', 'Email', 'Address', 'Registered At'];
        const csvRows = [headers.join(',')];

        patients.forEach(patient => {
            const row = [
                this.escapeCSV(patient.name),
                this.escapeCSV(patient.nik),
                patient.dob,
                patient.gender,
                this.escapeCSV(patient.phone),
                this.escapeCSV(patient.email || ''),
                this.escapeCSV(patient.address),
                patient.registeredAt
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    escapeCSV(str) {
        if (str && str.includes(',')) {
            return `"${str.replace(/"/g, '""')}"`;
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
}

// Create global instance
window.patientManager = new PatientManager();
