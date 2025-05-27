// Face Recognition Simulation System
class FaceRecognitionManager {
    constructor() {
        this.isCapturing = false;
        this.cameraStream = null;
        this.videoElement = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const startCameraBtn = document.getElementById('startCameraBtn');
            if (startCameraBtn) {
                startCameraBtn.addEventListener('click', () => this.startCamera());
            }

            const captureBtn = document.getElementById('captureBtn');
            if (captureBtn) {
                captureBtn.addEventListener('click', () => this.captureAndIdentify());
            }
        });

        // Handle page visibility change to stop camera when not needed
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.cameraStream) {
                this.stopCamera();
            }
        });
    }

    async startCamera() {
        try {
            const startBtn = document.getElementById('startCameraBtn');
            const captureBtn = document.getElementById('captureBtn');
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');

            if (!startBtn || !captureBtn || !cameraPlaceholder) {
                throw new Error('Required camera elements not found');
            }

            // Show loading state
            startBtn.classList.add('loading');
            startBtn.disabled = true;

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            this.cameraStream = stream;

            // Create video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
            this.videoElement.style.objectFit = 'cover';
            this.videoElement.style.borderRadius = '8px';

            // Replace placeholder with video
            cameraPlaceholder.innerHTML = '';
            cameraPlaceholder.appendChild(this.videoElement);

            // Update button states
            startBtn.style.display = 'none';
            captureBtn.style.display = 'inline-flex';

            this.isCapturing = true;

            // Add activity log
            storageManager.addActivity('Camera started for face recognition');

        } catch (error) {
            console.error('Error starting camera:', error);
            this.handleCameraError(error);
        } finally {
            const startBtn = document.getElementById('startCameraBtn');
            if (startBtn) {
                startBtn.classList.remove('loading');
                startBtn.disabled = false;
            }
        }
    }

    stopCamera() {
        try {
            if (this.cameraStream) {
                const tracks = this.cameraStream.getTracks();
                tracks.forEach(track => track.stop());
                this.cameraStream = null;
            }

            const startBtn = document.getElementById('startCameraBtn');
            const captureBtn = document.getElementById('captureBtn');
            const cameraPlaceholder = document.getElementById('cameraPlaceholder');

            if (startBtn && captureBtn && cameraPlaceholder) {
                // Reset UI
                startBtn.style.display = 'inline-flex';
                captureBtn.style.display = 'none';
                
                cameraPlaceholder.innerHTML = `
                    <i class="fas fa-camera"></i>
                    <p>Camera Feed</p>
                `;
            }

            this.isCapturing = false;
            this.videoElement = null;

        } catch (error) {
            console.error('Error stopping camera:', error);
        }
    }

    async captureAndIdentify() {
        try {
            if (!this.videoElement || !this.isCapturing) {
                throw new Error('Camera not active');
            }

            const captureBtn = document.getElementById('captureBtn');
            if (captureBtn) {
                captureBtn.classList.add('loading');
                captureBtn.disabled = true;
            }

            // Capture frame from video
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            
            ctx.drawImage(this.videoElement, 0, 0);
            const capturedImage = canvas.toDataURL('image/jpeg', 0.8);

            // Simulate face recognition processing
            await this.delay(2000);

            // Perform face recognition simulation
            const recognitionResult = await this.simulateFaceRecognition(capturedImage);

            // Display results
            this.displayRecognitionResults(recognitionResult);

            // Stop camera after successful capture
            this.stopCamera();

        } catch (error) {
            console.error('Error during capture and identification:', error);
            this.displayError('Failed to capture and identify. Please try again.');
        } finally {
            const captureBtn = document.getElementById('captureBtn');
            if (captureBtn) {
                captureBtn.classList.remove('loading');
                captureBtn.disabled = false;
            }
        }
    }

    async simulateFaceRecognition(capturedImage) {
        // Simulate face recognition processing
        await this.delay(1500);

        const patients = storageManager.getPatients();
        
        // Simulate different recognition scenarios
        const randomOutcome = Math.random();
        
        if (patients.length === 0) {
            return {
                success: false,
                type: 'no_database',
                message: 'No patients in database for comparison',
                confidence: 0
            };
        }

        if (randomOutcome < 0.7 && patients.length > 0) {
            // 70% chance of successful recognition
            const recognizedPatient = patients[Math.floor(Math.random() * patients.length)];
            const confidence = 85 + Math.random() * 15; // 85-100% confidence

            return {
                success: true,
                type: 'patient_found',
                patient: recognizedPatient,
                confidence: confidence.toFixed(1),
                capturedImage: capturedImage,
                message: `Patient successfully identified with ${confidence.toFixed(1)}% confidence`
            };
        } else if (randomOutcome < 0.85) {
            // 15% chance of no match found
            return {
                success: false,
                type: 'no_match',
                message: 'No matching patient found in database',
                confidence: 0,
                capturedImage: capturedImage,
                suggestion: 'Patient may need to be registered in the system'
            };
        } else {
            // 15% chance of low confidence/unclear image
            return {
                success: false,
                type: 'low_confidence',
                message: 'Face detection confidence too low',
                confidence: 30 + Math.random() * 40, // 30-70% confidence
                capturedImage: capturedImage,
                suggestion: 'Please ensure good lighting and face the camera directly'
            };
        }
    }

    displayRecognitionResults(result) {
        const resultsContainer = document.getElementById('recognitionResults');
        if (!resultsContainer) {
            console.error('Recognition results container not found');
            return;
        }

        let resultHTML = '';

        if (result.success) {
            // Successful recognition
            const patient = result.patient;
            const age = this.calculateAge(patient.dob);

            resultHTML = `
                <div class="recognition-success">
                    <div class="result-header">
                        <i class="fas fa-check-circle"></i>
                        <h3>Patient Identified</h3>
                        <span class="confidence-badge success">
                            ${result.confidence}% Match
                        </span>
                    </div>
                    
                    <div class="patient-result-card">
                        <div class="captured-image">
                            <img src="${result.capturedImage}" alt="Captured Image" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">
                            <p>Captured Image</p>
                        </div>
                        
                        <div class="patient-result-info">
                            <h4>${patient.name}</h4>
                            <div class="patient-details-grid">
                                <div class="detail-item">
                                    <span class="label">NIK:</span>
                                    <span class="value">${patient.nik}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Age:</span>
                                    <span class="value">${age} years</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Gender:</span>
                                    <span class="value">${patient.gender}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Phone:</span>
                                    <span class="value">${patient.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="result-actions">
                        <button class="btn btn-success" onclick="faceRecognitionManager.confirmPatientIdentity('${patient.id}', true)">
                            <i class="fas fa-check"></i>
                            Yes, This is Correct
                        </button>
                        <button class="btn btn-danger" onclick="faceRecognitionManager.confirmPatientIdentity('${patient.id}', false)">
                            <i class="fas fa-times"></i>
                            No, This is Wrong
                        </button>
                    </div>
                </div>
            `;

            // Add to activity log
            storageManager.addActivity(`Patient ${patient.name} identified via face recognition`);

        } else {
            // Failed recognition
            let iconClass, statusClass, actionButtons = '';

            switch (result.type) {
                case 'no_match':
                    iconClass = 'fas fa-user-slash';
                    statusClass = 'warning';
                    actionButtons = `
                        <button class="btn btn-primary" onclick="router.navigateTo('add-patient')">
                            <i class="fas fa-user-plus"></i>
                            Register New Patient
                        </button>
                    `;
                    break;
                case 'low_confidence':
                    iconClass = 'fas fa-exclamation-triangle';
                    statusClass = 'warning';
                    actionButtons = `
                        <button class="btn btn-secondary" onclick="faceRecognitionManager.startCamera()">
                            <i class="fas fa-redo"></i>
                            Try Again
                        </button>
                    `;
                    break;
                case 'no_database':
                    iconClass = 'fas fa-database';
                    statusClass = 'info';
                    actionButtons = `
                        <button class="btn btn-primary" onclick="router.navigateTo('add-patient')">
                            <i class="fas fa-user-plus"></i>
                            Add First Patient
                        </button>
                    `;
                    break;
                default:
                    iconClass = 'fas fa-times-circle';
                    statusClass = 'error';
            }

            resultHTML = `
                <div class="recognition-failed ${statusClass}">
                    <div class="result-header">
                        <i class="${iconClass}"></i>
                        <h3>Recognition ${result.type === 'no_database' ? 'Not Possible' : 'Failed'}</h3>
                        ${result.confidence > 0 ? `
                        <span class="confidence-badge ${statusClass}">
                            ${result.confidence}% Confidence
                        </span>
                        ` : ''}
                    </div>
                    
                    <div class="result-message">
                        <p>${result.message}</p>
                        ${result.suggestion ? `<p class="suggestion"><i class="fas fa-lightbulb"></i> ${result.suggestion}</p>` : ''}
                    </div>
                    
                    ${result.capturedImage ? `
                    <div class="captured-image-failed">
                        <img src="${result.capturedImage}" alt="Captured Image" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px;">
                        <p>Captured Image</p>
                    </div>
                    ` : ''}
                    
                    <div class="result-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;

            // Add to activity log
            storageManager.addActivity(`Face recognition failed: ${result.message}`);
        }

        resultsContainer.innerHTML = resultHTML;

        // Add CSS styles for recognition results if not already present
        this.addRecognitionStyles();
    }

    addRecognitionStyles() {
        if (document.querySelector('#face-recognition-styles')) {
            return; // Styles already added
        }

        const styles = document.createElement('style');
        styles.id = 'face-recognition-styles';
        styles.textContent = `
            .recognition-success, .recognition-failed {
                background: hsl(var(--surface));
                border-radius: 12px;
                padding: 2rem;
                border: 1px solid hsl(var(--border));
            }

            .recognition-success {
                border-left: 4px solid hsl(var(--success-color));
            }

            .recognition-failed.warning {
                border-left: 4px solid hsl(var(--warning-color));
            }

            .recognition-failed.error {
                border-left: 4px solid hsl(var(--danger-color));
            }

            .recognition-failed.info {
                border-left: 4px solid hsl(var(--primary-color));
            }

            .result-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .result-header i {
                font-size: 1.5rem;
            }

            .result-header h3 {
                flex: 1;
                margin: 0;
                font-size: 1.25rem;
            }

            .confidence-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 600;
            }

            .confidence-badge.success {
                background: hsl(var(--success-color) / 0.1);
                color: hsl(var(--success-color));
            }

            .confidence-badge.warning {
                background: hsl(var(--warning-color) / 0.1);
                color: hsl(var(--warning-color));
            }

            .patient-result-card {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
                padding: 1.5rem;
                background: hsl(var(--surface-secondary));
                border-radius: 8px;
            }

            .captured-image {
                text-align: center;
            }

            .captured-image p {
                margin-top: 0.5rem;
                font-size: 0.875rem;
                color: hsl(var(--text-secondary));
            }

            .patient-result-info h4 {
                margin: 0 0 1rem 0;
                font-size: 1.25rem;
                color: hsl(var(--text-primary));
            }

            .patient-details-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 0.75rem;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
            }

            .detail-item .label {
                font-size: 0.875rem;
                color: hsl(var(--text-secondary));
                font-weight: 500;
            }

            .detail-item .value {
                color: hsl(var(--text-primary));
                font-weight: 500;
            }

            .result-message {
                margin-bottom: 1.5rem;
                text-align: center;
            }

            .result-message p {
                margin: 0 0 0.5rem 0;
                color: hsl(var(--text-primary));
            }

            .suggestion {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-style: italic;
                color: hsl(var(--text-secondary)) !important;
            }

            .captured-image-failed {
                text-align: center;
                margin-bottom: 1.5rem;
            }

            .captured-image-failed p {
                margin-top: 0.5rem;
                font-size: 0.875rem;
                color: hsl(var(--text-secondary));
            }

            .result-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }

            @media (max-width: 768px) {
                .patient-result-card {
                    grid-template-columns: 1fr;
                    text-align: center;
                }

                .patient-details-grid {
                    grid-template-columns: 1fr;
                }

                .result-actions {
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    displayError(message) {
        const resultsContainer = document.getElementById('recognitionResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="recognition-error">
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error</h3>
                        <p>${message}</p>
                        <button class="btn btn-secondary" onclick="faceRecognitionManager.startCamera()">
                            <i class="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        }
    }

    handleCameraError(error) {
        let errorMessage = 'Failed to access camera. ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage += 'Camera access is not supported by this browser.';
        } else {
            errorMessage += 'Please check your camera settings and try again.';
        }

        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        if (cameraPlaceholder) {
            cameraPlaceholder.innerHTML = `
                <div class="camera-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${errorMessage}</p>
                    <button class="btn btn-secondary" onclick="faceRecognitionManager.startCamera()">
                        <i class="fas fa-redo"></i>
                        Retry
                    </button>
                </div>
            `;
        }

        console.error('Camera error:', error);
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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Patient identity confirmation
    confirmPatientIdentity(patientId, isCorrect) {
        if (isCorrect) {
            // Navigate to medical records page
            if (window.medicalRecordsManager) {
                medicalRecordsManager.loadPatientRecord(patientId);
            }
            if (window.router) {
                router.navigateTo('medical-records');
            }
            storageManager.addActivity(`Patient identity confirmed via face recognition`);
        } else {
            // Reset recognition and allow retry
            const resultsContainer = document.getElementById('recognitionResults');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="recognition-failed warning">
                        <div class="result-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Identity Not Confirmed</h3>
                        </div>
                        <div class="result-message">
                            <p>Patient identity was not confirmed. Please try face recognition again or register the patient.</p>
                        </div>
                        <div class="result-actions">
                            <button class="btn btn-primary" onclick="faceRecognitionManager.startCamera()">
                                <i class="fas fa-redo"></i>
                                Try Again
                            </button>
                            <button class="btn btn-secondary" onclick="router.navigateTo('add-patient')">
                                <i class="fas fa-user-plus"></i>
                                Register New Patient
                            </button>
                        </div>
                    </div>
                `;
            }
            storageManager.addActivity(`Patient identity rejected - face recognition retry needed`);
        }
    }

    // Clean up resources
    cleanup() {
        this.stopCamera();
    }
}

// Create global instance
window.faceRecognitionManager = new FaceRecognitionManager();
