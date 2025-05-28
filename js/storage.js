// Local Storage Manager for Hospital Management System
class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    // Initialize storage with default data if empty
    if (!this.getPatients()) {
      this.setPatients([]);
    }
    if (!this.getQueue()) {
      this.setQueue([]);
    }
    if (!this.getActivity()) {
      this.setActivity([]);
    }
    if (!this.getStats()) {
      this.setStats({
        totalPatients: 0,
        todayCheckins: 0,
        queueLength: 0,
      });
    }
    if (!this.getDoctors()) {
      this.initializeDoctors();
    }
    if (!this.getMedicalRecords()) {
      this.setMedicalRecords([]);
    }
  }

  // Patient Management
  getPatients() {
    try {
      const patients = localStorage.getItem("hospital_patients");
      return patients ? JSON.parse(patients) : [];
    } catch (error) {
      console.error("Error getting patients:", error);
      return [];
    }
  }

  setPatients(patients) {
    try {
      localStorage.setItem("hospital_patients", JSON.stringify(patients));
      this.updateStats();
    } catch (error) {
      console.error("Error setting patients:", error);
    }
  }

  addPatient(patient) {
    try {
      const patients = this.getPatients();
      const newPatient = {
        id: this.generateId(),
        ...patient,
        registeredAt: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
      };
      patients.push(newPatient);
      this.setPatients(patients);
      this.addActivity(`New patient registered: ${patient.name}`);
      return newPatient;
    } catch (error) {
      console.error("Error adding patient:", error);
      return null;
    }
  }

  getPatientById(id) {
    try {
      const patients = this.getPatients();
      return patients.find((patient) => patient.id === id);
    } catch (error) {
      console.error("Error getting patient by ID:", error);
      return null;
    }
  }

  getPatientByNIK(nik) {
    try {
      const patients = this.getPatients();
      return patients.find((patient) => patient.nik === nik);
    } catch (error) {
      console.error("Error getting patient by NIK:", error);
      return null;
    }
  }

  updatePatient(id, updates) {
    try {
      const patients = this.getPatients();
      const index = patients.findIndex((patient) => patient.id === id);
      if (index !== -1) {
        patients[index] = { ...patients[index], ...updates };
        this.setPatients(patients);
        return patients[index];
      }
      return null;
    } catch (error) {
      console.error("Error updating patient:", error);
      return null;
    }
  }

  // Queue Management
  getQueue() {
    try {
      const queue = localStorage.getItem("hospital_queue");
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error("Error getting queue:", error);
      return [];
    }
  }

  setQueue(queue) {
    try {
      localStorage.setItem("hospital_queue", JSON.stringify(queue));
      this.updateStats();
    } catch (error) {
      console.error("Error setting queue:", error);
    }
  }

  addToQueue(patient) {
    try {
      const queue = this.getQueue();
      const queueNumber = queue.length + 1;
      const newQueueEntry = {
        id: this.generateId(),
        patientId: patient.id,
        patientName: patient.name,
        queueNumber: queueNumber,
        arrivalTime: new Date().toISOString(),
        status: "waiting",
      };
      queue.push(newQueueEntry);
      this.setQueue(queue);
      this.addActivity(
        `Patient ${patient.name} added to queue (#${queueNumber})`
      );
      return newQueueEntry;
    } catch (error) {
      console.error("Error adding to queue:", error);
      return null;
    }
  }

  updateQueueStatus(queueId, status) {
    try {
      const queue = this.getQueue();
      const index = queue.findIndex((entry) => entry.id === queueId);
      if (index !== -1) {
        const oldStatus = queue[index].status;
        queue[index].status = status;

        if (status === "completed") {
          queue[index].completedAt = new Date().toISOString();
        } else if (status === "in-progress") {
          queue[index].startedAt = new Date().toISOString();
        }

        this.setQueue(queue);
        this.addActivity(
          `Queue #${queue[index].queueNumber} status changed from ${oldStatus} to ${status}`
        );
        return queue[index];
      }
      return null;
    } catch (error) {
      console.error("Error updating queue status:", error);
      return null;
    }
  }

  removeFromQueue(queueId) {
    try {
      const queue = this.getQueue();
      const index = queue.findIndex((entry) => entry.id === queueId);
      if (index !== -1) {
        const removedEntry = queue.splice(index, 1)[0];
        this.setQueue(queue);
        this.addActivity(`Queue #${removedEntry.queueNumber} removed`);
        return removedEntry;
      }
      return null;
    } catch (error) {
      console.error("Error removing from queue:", error);
      return null;
    }
  }

  // Activity Log
  getActivity() {
    try {
      const activity = localStorage.getItem("hospital_activity");
      return activity ? JSON.parse(activity) : [];
    } catch (error) {
      console.error("Error getting activity:", error);
      return [];
    }
  }

  setActivity(activity) {
    try {
      localStorage.setItem("hospital_activity", JSON.stringify(activity));
    } catch (error) {
      console.error("Error setting activity:", error);
    }
  }

  addActivity(message) {
    try {
      const activity = this.getActivity();
      const newActivity = {
        id: this.generateId(),
        message: message,
        timestamp: new Date().toISOString(),
      };
      activity.unshift(newActivity); // Add to beginning

      // Keep only last 50 activities
      if (activity.length > 50) {
        activity.splice(50);
      }

      this.setActivity(activity);
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  }

  // Statistics
  getStats() {
    try {
      const stats = localStorage.getItem("hospital_stats");
      return stats
        ? JSON.parse(stats)
        : {
            totalPatients: 0,
            todayCheckins: 0,
            queueLength: 0,
          };
    } catch (error) {
      console.error("Error getting stats:", error);
      return {
        totalPatients: 0,
        todayCheckins: 0,
        queueLength: 0,
      };
    }
  }

  setStats(stats) {
    try {
      localStorage.setItem("hospital_stats", JSON.stringify(stats));
    } catch (error) {
      console.error("Error setting stats:", error);
    }
  }

  updateStats() {
    try {
      const patients = this.getPatients();
      const queue = this.getQueue();
      const today = new Date().toDateString();

      const todayCheckins = queue.filter((entry) => {
        const entryDate = new Date(entry.arrivalTime).toDateString();
        return entryDate === today;
      }).length;

      const stats = {
        totalPatients: patients.length,
        todayCheckins: todayCheckins,
        queueLength: queue.filter((entry) => entry.status !== "completed")
          .length,
      };

      // Store stats without triggering updateStats again
      try {
        localStorage.setItem("hospital_stats", JSON.stringify(stats));
      } catch (error) {
        console.error("Error setting stats:", error);
      }

      return stats;
    } catch (error) {
      console.error("Error updating stats:", error);
      return this.getStats();
    }
  }

  // Authentication
  getUser() {
    try {
      const user = localStorage.getItem("hospital_user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  setUser(user) {
    try {
      localStorage.setItem("hospital_user", JSON.stringify(user));
    } catch (error) {
      console.error("Error setting user:", error);
    }
  }

  clearUser() {
    try {
      localStorage.removeItem("hospital_user");
    } catch (error) {
      console.error("Error clearing user:", error);
    }
  }

  // Utility Methods
  generateId() {
    return "id_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
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
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  }

  formatTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid Time";
    }
  }

  // Data Management
  exportData() {
    try {
      const data = {
        patients: this.getPatients(),
        queue: this.getQueue(),
        activity: this.getActivity(),
        stats: this.getStats(),
        exportedAt: new Date().toISOString(),
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("Error exporting data:", error);
      return null;
    }
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      if (data.patients) this.setPatients(data.patients);
      if (data.queue) this.setQueue(data.queue);
      if (data.activity) this.setActivity(data.activity);
      if (data.stats) this.setStats(data.stats);

      this.addActivity("Data imported successfully");
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }

  // Doctors Management
  getDoctors() {
    try {
      const doctors = localStorage.getItem("hospital_doctors");
      return doctors ? JSON.parse(doctors) : null;
    } catch (error) {
      console.error("Error getting doctors:", error);
      return null;
    }
  }

  setDoctors(doctors) {
    try {
      localStorage.setItem("hospital_doctors", JSON.stringify(doctors));
    } catch (error) {
      console.error("Error setting doctors:", error);
    }
  }

  initializeDoctors() {
    console.log("Initializing doctors data...");
    const doctors = [
      {
        id: "doc_001",
        name: "Dr. Ahmad Santoso",
        specialization: "Umum",
        schedule: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        room: "R001",
        experience: "15 years",
        education: "Universitas Indonesia",
        available: true,
      },
      {
        id: "doc_002",
        name: "Dr. Sari Indrawati",
        specialization: "Anak",
        schedule: ["Monday", "Wednesday", "Friday"],
        room: "R002",
        experience: "12 years",
        education: "Universitas Gadjah Mada",
        available: true,
      },
      {
        id: "doc_003",
        name: "Dr. Budi Hartono",
        specialization: "Jantung",
        schedule: ["Tuesday", "Thursday", "Saturday"],
        room: "R003",
        experience: "20 years",
        education: "Universitas Airlangga",
        available: true,
      },
      {
        id: "doc_004",
        name: "Dr. Lisa Permata",
        specialization: "Kulit",
        schedule: ["Monday", "Tuesday", "Thursday", "Friday"],
        room: "R004",
        experience: "8 years",
        education: "Universitas Diponegoro",
        available: true,
      },
      {
        id: "doc_005",
        name: "Dr. Randi Wijaya",
        specialization: "Mata",
        schedule: ["Wednesday", "Thursday", "Saturday"],
        room: "R005",
        experience: "10 years",
        education: "Universitas Padjadjaran",
        available: true,
      },
    ];
    this.setDoctors(doctors);
    console.log("Doctors data initialized and saved to localStorage.");
    return doctors;
  }

  getDoctorById(id) {
    try {
      const doctors = this.getDoctors();
      return doctors ? doctors.find((doctor) => doctor.id === id) : null;
    } catch (error) {
      console.error("Error getting doctor by ID:", error);
      return null;
    }
  }

  // Medical Records Management
  getMedicalRecords() {
    try {
      const records = localStorage.getItem("hospital_medical_records");
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error("Error getting medical records:", error);
      return [];
    }
  }

  setMedicalRecords(records) {
    try {
      localStorage.setItem("hospital_medical_records", JSON.stringify(records));
    } catch (error) {
      console.error("Error setting medical records:", error);
    }
  }

  addMedicalRecord(record) {
    try {
      const records = this.getMedicalRecords();
      const newRecord = {
        id: this.generateId(),
        ...record,
        createdAt: new Date().toISOString(),
      };
      records.push(newRecord);
      this.setMedicalRecords(records);
      this.addActivity(
        `Medical record added for patient ${record.patientName}`
      );
      return newRecord;
    } catch (error) {
      console.error("Error adding medical record:", error);
      return null;
    }
  }

  getPatientMedicalHistory(patientId) {
    try {
      const records = this.getMedicalRecords();
      return records
        .filter((record) => record.patientId === patientId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error("Error getting patient medical history:", error);
      return [];
    }
  }

  clearAllData() {
    try {
      localStorage.removeItem("hospital_patients");
      localStorage.removeItem("hospital_queue");
      localStorage.removeItem("hospital_activity");
      localStorage.removeItem("hospital_stats");
      localStorage.removeItem("hospital_doctors");
      localStorage.removeItem("hospital_medical_records");
      this.init();
      return true;
    } catch (error) {
      console.error("Error clearing data:", error);
      return false;
    }
  }
}

// Create global instance
window.storageManager = new StorageManager();
