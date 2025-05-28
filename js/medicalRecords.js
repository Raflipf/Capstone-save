// Medical Records Manager
class MedicalRecordsManager {
  constructor() {
    this.currentPatientId = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkPatientLoaded();
  }

  checkPatientLoaded() {
    const consultationForm = document.getElementById("consultationForm");
    const medicalRecordsContainer = document.querySelector(
      ".medical-records-container"
    );
    if (!this.currentPatientId) {
      if (consultationForm) {
        consultationForm.style.display = "none";
      }
      if (medicalRecordsContainer) {
        const messageDiv = document.createElement("div");
        messageDiv.className = "no-patient-message";
        messageDiv.innerHTML = `
                    <p>Please select a patient first via face recognition or patient list.</p>
                    <button class="btn btn-primary" id="goToFaceRecognition">Go to Face Recognition</button>
                    <button class="btn btn-secondary" id="reinitDoctorsBtn" style="margin-left: 10px;">Reinitialize Doctors</button>
                    <div id="doctorDebug" style="margin-top: 10px; padding: 10px; border: 1px solid #ccc; background: #f9f9f9; max-height: 200px; overflow-y: auto;"></div>
                `;
        medicalRecordsContainer.insertBefore(
          messageDiv,
          medicalRecordsContainer.firstChild
        );

        const btn = document.getElementById("goToFaceRecognition");
        if (btn && window.router) {
          btn.addEventListener("click", () => {
            router.navigateTo("face-recognition");
          });
        }

        const reinitBtn = document.getElementById("reinitDoctorsBtn");
        if (reinitBtn) {
          reinitBtn.addEventListener("click", () => {
            this.reinitializeDoctors();
          });
        }
      }
    } else {
      if (consultationForm) {
        consultationForm.style.display = "";
      }
      const existingMessage = document.querySelector(".no-patient-message");
      if (existingMessage) {
        existingMessage.remove();
      }
    }
  }

  setupEventListeners() {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOMContentLoaded event fired - calling loadDoctorOptions");
      this.loadDoctorOptions();

      const consultationForm = document.getElementById("consultationForm");
      if (consultationForm) {
        consultationForm.addEventListener("submit", (e) =>
          this.handleConsultationSubmit(e)
        );
      }
    });
  }

  loadPatientRecord(patientId) {
    try {
      this.currentPatientId = patientId;
      const patient = storageManager.getPatientById(patientId);

      if (!patient) {
        this.showMessage("Patient not found", "error");
        return;
      }

      // Load patient summary
      this.displayPatientSummary(patient);

      // Load medical history
      this.loadMedicalHistory(patientId);

      // Load doctors for selection
      this.loadDoctorOptions();
    } catch (error) {
      console.error("Error loading patient record:", error);
      this.showMessage("Failed to load patient record", "error");
    }
  }

  displayPatientSummary(patient) {
    const patientSummary = document.getElementById("patientSummary");
    if (!patientSummary) return;

    const age = this.calculateAge(patient.dob);

    patientSummary.innerHTML = `
            <div class="patient-summary-card">
                <div class="patient-summary-header">
                    ${
                      patient.photo
                        ? `<img src="${patient.photo}" alt="${patient.name}" class="patient-summary-photo">`
                        : `<div class="patient-summary-photo-placeholder">
                            <i class="fas fa-user"></i>
                        </div>`
                    }
                    <div class="patient-summary-info">
                        <h2>${patient.name}</h2>
                        <div class="patient-details">
                            <div class="detail-item">
                                <span class="label">NIK:</span>
                                <span class="value">${patient.nik}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Age:</span>
                                <span class="value">${age} years old</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Gender:</span>
                                <span class="value">${this.capitalizeFirst(
                                  patient.gender
                                )}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Phone:</span>
                                <span class="value">${patient.phone}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="patient-summary-stats">
                    <div class="stat-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>Last Visit: ${this.formatDate(
                          patient.lastVisit
                        )}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-user-clock"></i>
                        <span>Registered: ${this.formatDate(
                          patient.registeredAt
                        )}</span>
                    </div>
                </div>
            </div>
        `;
  }

  loadMedicalHistory(patientId) {
    const historyList = document.getElementById("medicalHistoryList");
    if (!historyList) return;

    const history = storageManager.getPatientMedicalHistory(patientId);

    if (history.length === 0) {
      historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-medical"></i>
                    <p>No medical history found</p>
                </div>
            `;
      return;
    }

    historyList.innerHTML = history
      .map((record) => this.createHistoryCard(record))
      .join("");
  }

  createHistoryCard(record) {
    const doctor = storageManager.getDoctorById(record.doctorId);
    const doctorName = doctor ? doctor.name : "Unknown Doctor";
    const doctorSpec = doctor ? doctor.specialization : "";

    return `
            <div class="history-card">
                <div class="history-header">
                    <div class="history-date">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDateTime(record.createdAt)}</span>
                    </div>
                    <div class="history-doctor">
                        <i class="fas fa-user-md"></i>
                        <span>${doctorName}</span>
                        ${doctorSpec ? `<small>(${doctorSpec})</small>` : ""}
                    </div>
                </div>
                <div class="history-content">
                    <div class="complaint-section">
                        <h4>Chief Complaint:</h4>
                        <p>${record.complaint}</p>
                    </div>
                    ${
                      record.symptoms
                        ? `
                    <div class="symptoms-section">
                        <h4>Additional Symptoms:</h4>
                        <p>${record.symptoms}</p>
                    </div>
                    `
                        : ""
                    }
                    <div class="priority-badge priority-${record.priority}">
                        <i class="fas fa-exclamation-circle"></i>
                        ${this.capitalizeFirst(record.priority)} Priority
                    </div>
                </div>
            </div>
        `;
  }

  loadDoctorOptions() {
    const doctorSelect = document.getElementById("selectedDoctor");
    if (!doctorSelect) {
      console.log("Doctor select element not found");
      return;
    }

    let doctors = storageManager.getDoctors();
    console.log("Doctors loaded:", doctors);
    console.log("Current patient ID:", this.currentPatientId);
    if (!doctors || doctors.length === 0) {
      console.log("No doctors found in storage, initializing doctors...");
      doctors = storageManager.initializeDoctors();
      console.log("Doctors after initialization:", doctors);
    }

    // Clear existing options except the first one
    doctorSelect.innerHTML = '<option value="">Choose a doctor...</option>';

    doctors.forEach((doctor) => {
      if (doctor.available) {
        const option = document.createElement("option");
        option.value = doctor.id;
        option.textContent = `${doctor.name} - ${doctor.specialization} (${doctor.room})`;
        doctorSelect.appendChild(option);
      }
    });

    // Update debug div with doctors data
    const debugDiv = document.getElementById("doctorDebug");
    if (debugDiv) {
      debugDiv.textContent = JSON.stringify(doctors, null, 2);
    }
  }

  reinitializeDoctors() {
    console.log("Manual reinitialization of doctors triggered.");
    storageManager.initializeDoctors();
    this.loadDoctorOptions();
  }

  async handleConsultationSubmit(event) {
    event.preventDefault();

    try {
      const form = event.target;
      const submitBtn = form.querySelector('button[type="submit"]');

      // Show loading state
      submitBtn.classList.add("loading");
      submitBtn.disabled = true;

      const formData = new FormData(form);
      const consultationData = {
        patientId: this.currentPatientId,
        patientName: storageManager.getPatientById(this.currentPatientId)?.name,
        doctorId: formData.get("doctorId"),
        complaint: formData.get("complaint").trim(),
        symptoms: formData.get("symptoms")?.trim() || "",
        priority: formData.get("priority"),
      };

      // Validate data
      const validation = this.validateConsultationData(consultationData);
      if (!validation.isValid) {
        this.showMessage(validation.errors.join(", "), "error");
        return;
      }

      // Add medical record
      const medicalRecord = storageManager.addMedicalRecord(consultationData);

      if (!medicalRecord) {
        throw new Error("Failed to save medical record");
      }

      // Add to queue with doctor assignment
      const doctor = storageManager.getDoctorById(consultationData.doctorId);
      const queueEntry = storageManager.addToQueue({
        id: this.currentPatientId,
        name: consultationData.patientName,
      });

      if (queueEntry) {
        // Update queue entry with doctor and consultation info
        const updatedQueue = storageManager.getQueue();
        const entryIndex = updatedQueue.findIndex(
          (entry) => entry.id === queueEntry.id
        );
        if (entryIndex !== -1) {
          updatedQueue[entryIndex] = {
            ...updatedQueue[entryIndex],
            doctorId: consultationData.doctorId,
            doctorName: doctor?.name || "Unknown",
            complaint: consultationData.complaint,
            priority: consultationData.priority,
          };
          storageManager.setQueue(updatedQueue);
        }
      }

      this.showMessage("Patient added to queue successfully!", "success");

      // Clear form
      form.reset();

      // Reload medical history
      this.loadMedicalHistory(this.currentPatientId);

      // Navigate to queue page after a short delay
      setTimeout(() => {
        if (window.router) {
          router.navigateTo("queue");
        }
      }, 2000);
    } catch (error) {
      console.error("Error submitting consultation:", error);
      this.showMessage(
        "Failed to submit consultation. Please try again.",
        "error"
      );
    } finally {
      const submitBtn = event.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
      }
    }
  }

  validateConsultationData(data) {
    const errors = [];

    if (!data.doctorId) {
      errors.push("Please select a doctor");
    }

    if (!data.complaint || data.complaint.length < 10) {
      errors.push("Chief complaint must be at least 10 characters");
    }

    if (!data.priority) {
      errors.push("Please select priority level");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Utility methods
  calculateAge(dateOfBirth) {
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    } catch (error) {
      return "Unknown";
    }
  }

  formatDate(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Unknown";
    }
  }

  formatDateTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Unknown";
    }
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  showMessage(message, type = "info") {
    // Remove existing messages
    const existingMessages = document.querySelectorAll(".medical-message");
    existingMessages.forEach((msg) => msg.remove());

    const messageDiv = document.createElement("div");
    messageDiv.className = `medical-message ${type}-message`;
    messageDiv.innerHTML = `
            <i class="fas fa-${
              type === "success"
                ? "check-circle"
                : type === "error"
                ? "exclamation-circle"
                : "info-circle"
            }"></i>
            <span>${message}</span>
        `;

    const container = document.querySelector(".medical-records-container");
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }
}

// Create global instance
window.medicalRecordsManager = new MedicalRecordsManager();
