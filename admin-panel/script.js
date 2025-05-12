// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, query, orderBy, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwtimDB_Mai-QPyB6d0yqjJX_d5mQjGY8",
    authDomain: "fete-de-la-musique-64a6b.firebaseapp.com",
    projectId: "fete-de-la-musique-64a6b",
    storageBucket: "fete-de-la-musique-64a6b.appspot.com",
    messagingSenderId: "1087878331068",
    appId: "1:1087878331068:web:28719d3278a619cb816eb9",
    measurementId: "G-MW9YYKP1J8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global variables
let eventImageFile = null;
let summerEventImageFile = null;

// Hard-coded data (remplace la récupération depuis Firestore)
const locations = [
    { id: 'Place de la République', name: 'Place de la République' },
    { id: 'Parc des expositions', name: 'Parc des expositions' },
    { id: 'Salle des fêtes', name: 'Salle des fêtes' },
    { id: 'Théâtre municipal', name: 'Théâtre municipal' },
    { id: 'Place du marché', name: 'Place du marché' }
];

const genres = [
    { id: 'genre1', name: 'Rock' },
    { id: 'genre2', name: 'Pop' },
    { id: 'genre3', name: 'Jazz' },
    { id: 'genre4', name: 'Classique' },
    { id: 'genre5', name: 'Hip-Hop' },
    { id: 'genre6', name: 'Électronique' }
];

const partners = [
    { id: 'partner1', name: 'Mairie' },
    { id: 'partner2', name: 'Conservatoire' },
    { id: 'partner3', name: 'Association culturelle' },
    { id: 'partner4', name: 'Radio locale' },
    { id: 'partner5', name: 'Sponsor principal' }
];

// DOM Elements
const eventForm = document.getElementById('event-form');
const summerEventForm = document.getElementById('summer-event-form');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Event Image Handling
function setupImageUpload(inputId, dropzoneId, previewId, removeId, imageVariable) {
    const input = document.getElementById(inputId);
    const dropzone = document.getElementById(dropzoneId);
    const preview = document.getElementById(previewId);
    const removeButton = document.getElementById(removeId);

    if (!input || !dropzone || !preview || !removeButton) {
        console.error(`Missing elements for image upload setup: ${inputId}`);
        return;
    }

    input.addEventListener('change', function(e) {
        handleImageSelect(e, preview, imageVariable);
    });

    dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
    });

    dropzone.addEventListener('dragleave', function() {
        dropzone.style.borderColor = '#E5E7EB';
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropzone.style.borderColor = '#E5E7EB';
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                if (imageVariable === 'event') {
                    eventImageFile = file;
                } else {
                    summerEventImageFile = file;
                }
                displayImagePreview(file, preview);
            }
        }
    });

    removeButton.addEventListener('click', function() {
        if (imageVariable === 'event') {
            eventImageFile = null;
        } else {
            summerEventImageFile = null;
        }
        preview.style.display = 'none';
        input.value = '';
    });
}

function handleImageSelect(e, preview, imageVariable) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        if (imageVariable === 'event') {
            eventImageFile = file;
        } else {
            summerEventImageFile = file;
        }
        displayImagePreview(file, preview);
    }
}

function displayImagePreview(file, preview) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = preview.querySelector('img');
        if (img) {
            img.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

// Nouvelle fonction pour convertir l'image en Base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Fonction pour redimensionner l'image afin de réduire sa taille
async function resizeImage(base64Image, maxWidth = 800, maxHeight = 600, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            
            // Calculer les nouvelles dimensions
            if (width > maxWidth) {
                height = Math.floor(height * (maxWidth / width));
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = Math.floor(width * (maxHeight / height));
                height = maxHeight;
            }
            
            // Créer un canvas pour redimensionner
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            // Dessiner l'image redimensionnée
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Récupérer le base64 compressé
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
}

// Initialize dropdowns with hard-coded data
function initializeHardcodedData() {
    try {
        // Populate dropdowns
        populateSelectDropdown('event-location', locations);
        populateSelectDropdown('summer-event-location', locations);
        populateMultiselectDropdown('event-genre', genres);
        populateMultiselectDropdown('summer-event-genre', genres);
        populateMultiselectDropdown('event-partners', partners);
        populateMultiselectDropdown('summer-event-partners', partners);
    } catch (error) {
        console.error("Error initializing hardcoded data:", error);
        showToast("Erreur lors de l'initialisation des données", "error");
    }
}

// Populate single select dropdown
function populateSelectDropdown(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Element not found: ${selectId}`);
        return;
    }
    
    // Clear all options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add options
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option.id;
        optElement.textContent = option.name;
        select.appendChild(optElement);
    });
}

// Populate multiselect dropdown
function populateMultiselectDropdown(baseId, options) {
    const dropdown = document.getElementById(`${baseId}-dropdown`);
    if (!dropdown) {
        console.error(`Dropdown element not found: ${baseId}-dropdown`);
        return;
    }

    dropdown.innerHTML = '';
    
    // Add options
    options.forEach(option => {
        const optElement = document.createElement('div');
        optElement.className = 'multiselect-option';
        optElement.dataset.id = option.id;
        optElement.dataset.name = option.name;
        optElement.textContent = option.name;
        optElement.addEventListener('click', () => toggleMultiselectOption(baseId, option.id, option.name));
        dropdown.appendChild(optElement);
    });

    // Setup search functionality
    const searchInput = document.getElementById(`${baseId}-input`);
    const hiddenInput = document.getElementById(baseId);
    
    if (!searchInput) {
        console.error(`Search input not found: ${baseId}-input`);
        return;
    }

    searchInput.addEventListener('focus', () => {
        dropdown.style.display = 'block';
    });
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const options = dropdown.querySelectorAll('.multiselect-option');
        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    });

    // Search input enter key handler
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            e.preventDefault();
            const newOption = searchInput.value.trim();
            const existingOptions = Array.from(dropdown.querySelectorAll('.multiselect-option'))
                .map(opt => opt.dataset.name.toLowerCase());
            
            if (!existingOptions.includes(newOption.toLowerCase())) {
                // Create a new option and add it
                const newId = `new-${Date.now()}`;
                toggleMultiselectOption(baseId, newId, newOption);
                
                // Add to dropdown
                const optElement = document.createElement('div');
                optElement.className = 'multiselect-option selected';
                optElement.dataset.id = newId;
                optElement.dataset.name = newOption;
                optElement.textContent = newOption;
                optElement.addEventListener('click', () => toggleMultiselectOption(baseId, newId, newOption));
                dropdown.appendChild(optElement);
            }
            
            searchInput.value = '';
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`.multiselect-wrapper`)) {
            dropdown.style.display = 'none';
        }
    });

    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Toggle multiselect option selection
function toggleMultiselectOption(baseId, optionId, optionName) {
    const dropdown = document.getElementById(`${baseId}-dropdown`);
    const selectedContainer = document.getElementById(`${baseId}-selected`);
    const hiddenInput = document.getElementById(baseId);
    
    if (!dropdown || !selectedContainer || !hiddenInput) {
        console.error(`Missing elements for toggleMultiselectOption: ${baseId}`);
        return;
    }
    
    const option = dropdown.querySelector(`.multiselect-option[data-id="${optionId}"]`);
    
    // Check if already selected
    const existingItem = selectedContainer.querySelector(`.selected-item[data-id="${optionId}"]`);
    
    if (existingItem) {
        // Remove selection
        existingItem.remove();
        if (option) {
            option.classList.remove('selected');
        }
    } else {
        // Add selection
        const selectedItem = document.createElement('div');
        selectedItem.className = 'selected-item';
        selectedItem.dataset.id = optionId;
        selectedItem.dataset.name = optionName;
        selectedItem.innerHTML = `
            <span>${optionName}</span>
            <span class="selected-item-remove"><i class="fas fa-times"></i></span>
        `;
        
        const removeBtn = selectedItem.querySelector('.selected-item-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                toggleMultiselectOption(baseId, optionId, optionName);
            });
        }
        
        selectedContainer.appendChild(selectedItem);
        if (option) {
            option.classList.add('selected');
        }
    }
    
    // Update hidden input with selected values
    updateMultiselectValue(baseId);
}

// Update hidden input with selected values
function updateMultiselectValue(baseId) {
    const selectedContainer = document.getElementById(`${baseId}-selected`);
    const hiddenInput = document.getElementById(baseId);
    
    if (!selectedContainer || !hiddenInput) {
        console.error(`Missing elements for updateMultiselectValue: ${baseId}`);
        return;
    }
    
    const selectedItems = selectedContainer.querySelectorAll('.selected-item');
    
    const values = Array.from(selectedItems).map(item => ({
        id: item.dataset.id,
        name: item.dataset.name
    }));
    
    hiddenInput.value = JSON.stringify(values);
}

// Nouvelle fonction pour gérer l'upload d'image en Base64
async function uploadEventImageBase64(file, eventType) {
    if (!file) return null;
    
    try {
        console.log(`Processing image for ${eventType} event`);
        
        // Convertir en Base64
        const base64Original = await convertImageToBase64(file);
        
        // Redimensionner l'image pour réduire sa taille
        const base64Resized = await resizeImage(base64Original);
        
        console.log(`Image processed successfully`);
        
        return base64Resized;
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    }
}

// Add regular event to Firestore
async function addRegularEvent(event) {
    try {
        // Ensure we have valid event data before adding
        if (!event.title || !event.location) {
            throw new Error("Missing required event data");
        }
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, "events"), {
            title: event.title,
            subtitle: event.subtitle || null,
            location: event.location,
            locationName: event.locationName || "",
            genre: event.genres || [],
            startDate: Timestamp.fromDate(new Date(event.startDate)),
            endDate: Timestamp.fromDate(new Date(event.endDate)),
            locationUrl: event.locationUrl || null,
            description: event.description || "",
            partners: event.partners || [],
            imageUrl: event.imageUrl || null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding regular event:", error);
        throw error;
    }
}

// Add summer event to Firestore
async function addSummerEvent(event) {
    try {
        // Ensure we have valid event data before adding
        if (!event.title || !event.location) {
            throw new Error("Missing required event data");
        }
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, "summer_events"), {
            title: event.title,
            subtitle: event.subtitle || null,
            location: event.location,
            locationName: event.locationName || "",
            genre: event.genres || [],
            organizer: event.organizer || "",
            date: Timestamp.fromDate(new Date(event.date)),
            endDate: event.endDate ? Timestamp.fromDate(new Date(event.endDate)) : null,
            locationUrl: event.locationUrl || null,
            plusUrl: event.plusUrl || null,
            description: event.description || "",
            partners: event.partners || [],
            imageUrl: event.imageUrl || null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding summer event:", error);
        throw error;
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    if (!toast || !toastMessage) {
        console.error("Toast elements not found");
        return;
    }
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.style.backgroundColor = '#EF4444';
    } else {
        toast.style.backgroundColor = '#10B981';
    }
    
    // Use classList method instead of direct style manipulation
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Handle event form submission
if (eventForm) {
    eventForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = document.getElementById('event-submit');
        const submitText = document.getElementById('event-submit-text');
        const submitSpinner = document.getElementById('event-submit-spinner');
        
        if (!submitButton || !submitText || !submitSpinner) {
            console.error("Submit button elements not found");
            showToast("Erreur dans le formulaire", "error");
            return;
        }
        
        // Disable submit button and show spinner
        submitButton.disabled = true;
        submitText.style.display = 'none';
        submitSpinner.style.display = 'inline-block';
        
        try {
            // Get form values
            const titleInput = document.getElementById('event-title');
            const subtitleInput = document.getElementById('event-subtitle');
            const locationSelect = document.getElementById('event-location');
            const genreInput = document.getElementById('event-genre');
            const startDateInput = document.getElementById('event-start-date');
            const endDateInput = document.getElementById('event-end-date');
            const locationUrlInput = document.getElementById('event-location-url');
            const descriptionInput = document.getElementById('event-description');
            const partnersInput = document.getElementById('event-partners');
            
            if (!titleInput || !locationSelect || !genreInput || !startDateInput || 
                !endDateInput || !descriptionInput) {
                throw new Error("Required form elements not found");
            }
            
            const title = titleInput.value;
            const subtitle = subtitleInput ? subtitleInput.value : '';
            const location = locationSelect.value;
            const locationName = locationSelect.options[locationSelect.selectedIndex].text;
            const genresValue = genreInput.value;
            const genres = genresValue ? JSON.parse(genresValue) : [];
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const locationUrl = locationUrlInput ? locationUrlInput.value : '';
            const description = descriptionInput.value;
            const partnersValue = partnersInput ? partnersInput.value : '[]';
            const partners = partnersValue ? JSON.parse(partnersValue) : [];
            
            // Validate data
            if (!title || !location || genres.length === 0 || !startDate || !endDate || !description) {
                showToast("Veuillez remplir tous les champs obligatoires", "error");
                return;
            }
            
            // Create event object
            const event = {
                title,
                subtitle,
                location,
                locationName,
                genres,
                startDate,
                endDate,
                locationUrl,
                description,
                partners
            };
            
            // Convertir l'image en Base64 si présente
            if (eventImageFile) {
                try {
                    const imageBase64 = await uploadEventImageBase64(eventImageFile, 'regular');
                    if (imageBase64) {
                        event.imageUrl = imageBase64;
                    }
                } catch (uploadError) {
                    console.error("Image processing failed:", uploadError);
                    showToast("L'image n'a pas pu être traitée, l'événement sera enregistré sans image", "error");
                }
            }
            
            // Add to Firestore
            const eventId = await addRegularEvent(event);
            
            // Reset form
            eventForm.reset();
            const previewElement = document.getElementById('event-image-preview');
            if (previewElement) {
                previewElement.style.display = 'none';
            }
            
            const genreSelectedElement = document.getElementById('event-genre-selected');
            if (genreSelectedElement) {
                genreSelectedElement.innerHTML = '';
            }
            
            const partnersSelectedElement = document.getElementById('event-partners-selected');
            if (partnersSelectedElement) {
                partnersSelectedElement.innerHTML = '';
            }
            
            eventImageFile = null;
            
            // Show success message
            showToast("Événement ajouté avec succès");
        } catch (error) {
            console.error("Error submitting event form:", error);
            showToast("Erreur lors de l'ajout de l'événement: " + error.message, "error");
        } finally {
            // Re-enable submit button and hide spinner
            submitButton.disabled = false;
            submitText.style.display = 'inline-block';
            submitSpinner.style.display = 'none';
        }
    });
}

// Handle cancel button
const eventCancelButton = document.getElementById('event-cancel');
if (eventCancelButton) {
    eventCancelButton.addEventListener('click', function() {
        if (eventForm) {
            eventForm.reset();
            
            const previewElement = document.getElementById('event-image-preview');
            if (previewElement) {
                previewElement.style.display = 'none';
            }
            
            const genreSelectedElement = document.getElementById('event-genre-selected');
            if (genreSelectedElement) {
                genreSelectedElement.innerHTML = '';
            }
            
            const partnersSelectedElement = document.getElementById('event-partners-selected');
            if (partnersSelectedElement) {
                partnersSelectedElement.innerHTML = '';
            }
            
            eventImageFile = null;
        }
    });
}

// Tab switching functionality
if (tabButtons && tabButtons.length > 0) {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active content
            if (tabContents && tabContents.length > 0) {
                tabContents.forEach(content => content.classList.remove('active'));
                const activeTab = document.getElementById(tabId);
                if (activeTab) {
                    activeTab.classList.add('active');
                }
            }
        });
    });
}

// Handle summer event cancel button
const summerEventCancelButton = document.getElementById('summer-event-cancel');
if (summerEventCancelButton) {
    summerEventCancelButton.addEventListener('click', function() {
        if (summerEventForm) {
            summerEventForm.reset();
            
            const previewElement = document.getElementById('summer-event-image-preview');
            if (previewElement) {
                previewElement.style.display = 'none';
            }
            
            const genreSelectedElement = document.getElementById('summer-event-genre-selected');
            if (genreSelectedElement) {
                genreSelectedElement.innerHTML = '';
            }
            
            const partnersSelectedElement = document.getElementById('summer-event-partners-selected');
            if (partnersSelectedElement) {
                partnersSelectedElement.innerHTML = '';
            }
            
            summerEventImageFile = null;
        }
    });
}

// Handle summer event form submission
if (summerEventForm) {
    summerEventForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = document.getElementById('summer-event-submit');
        const submitText = document.getElementById('summer-event-submit-text');
        const submitSpinner = document.getElementById('summer-event-submit-spinner');
        
        if (!submitButton || !submitText || !submitSpinner) {
            console.error("Submit button elements not found for summer event");
            showToast("Erreur dans le formulaire", "error");
            return;
        }
        
        // Disable submit button and show spinner
        submitButton.disabled = true;
        submitText.style.display = 'none';
        submitSpinner.style.display = 'inline-block';
        
        try {
            // Get form values
            const titleInput = document.getElementById('summer-event-title');
            const subtitleInput = document.getElementById('summer-event-subtitle');
            const locationSelect = document.getElementById('summer-event-location');
            const genreInput = document.getElementById('summer-event-genre');
            const organizerInput = document.getElementById('summer-event-organizer');
            const dateInput = document.getElementById('summer-event-date');
            const endDateInput = document.getElementById('summer-event-end-date');
            const locationUrlInput = document.getElementById('summer-event-location-url');
            const plusUrlInput = document.getElementById('summer-event-plus-url');
            const descriptionInput = document.getElementById('summer-event-description');
            const partnersInput = document.getElementById('summer-event-partners');
            
            if (!titleInput || !locationSelect || !genreInput || !dateInput || 
                !organizerInput || !descriptionInput) {
                throw new Error("Required form elements not found for summer event");
            }
            
            const title = titleInput.value;
            const subtitle = subtitleInput ? subtitleInput.value : '';
            const location = locationSelect.value;
            const locationName = locationSelect.options[locationSelect.selectedIndex].text;
            const genresValue = genreInput.value;
            const genres = genresValue ? JSON.parse(genresValue) : [];
            const organizer = organizerInput.value;
            const date = dateInput.value;
            const endDate = endDateInput ? endDateInput.value : '';
            const locationUrl = locationUrlInput ? locationUrlInput.value : '';
            const plusUrl = plusUrlInput ? plusUrlInput.value : '';
            const description = descriptionInput.value;
            const partnersValue = partnersInput ? partnersInput.value : '[]';
            const partners = partnersValue ? JSON.parse(partnersValue) : [];
            
            // Validate data
            if (!title || !location || genres.length === 0 || !date || !organizer || !description) {
                showToast("Veuillez remplir tous les champs obligatoires", "error");
                return;
            }
            
            // Create event object
            const event = {
                title,
                subtitle,
                location,
                locationName,
                genres,
                organizer,
                date,
                endDate,
                locationUrl,
                plusUrl,
                description,
                partners
            };
            
            // Convertir l'image en Base64 si présente
            if (summerEventImageFile) {
                try {
                    const imageBase64 = await uploadEventImageBase64(summerEventImageFile, 'summer');
                    if (imageBase64) {
                        event.imageUrl = imageBase64;
                    }
                } catch (uploadError) {
                    console.error("Summer event image processing failed:", uploadError);
                    showToast("L'image n'a pas pu être traitée, l'événement sera enregistré sans image", "error");
                }
            }
            
            // Add to Firestore
            const eventId = await addSummerEvent(event);
            
            // Reset form
            summerEventForm.reset();
            const previewElement = document.getElementById('summer-event-image-preview');
            if (previewElement) {
                previewElement.style.display = 'none';
            }
            
            const genreSelectedElement = document.getElementById('summer-event-genre-selected');
            if (genreSelectedElement) {
                genreSelectedElement.innerHTML = '';
            }
            
            const partnersSelectedElement = document.getElementById('summer-event-partners-selected');
            if (partnersSelectedElement) {
                partnersSelectedElement.innerHTML = '';
            }
            
            summerEventImageFile = null;
            
            // Show success message
            showToast("Événement d'été ajouté avec succès");
        } catch (error) {
            console.error("Error submitting summer event form:", error);
            showToast("Erreur lors de l'ajout de l'événement d'été: " + error.message, "error");
        } finally {
            // Re-enable submit button and hide spinner
            submitButton.disabled = false;
            submitText.style.display = 'inline-block';
            submitSpinner.style.display = 'none';
        }
    });
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
    // Setup image upload functionality
    setupImageUpload('event-image', 'event-image-drop', 'event-image-preview', 'event-image-remove', 'event');
    setupImageUpload('summer-event-image', 'summer-event-image-drop', 'summer-event-image-preview', 'summer-event-image-remove', 'summer');
    
    // Initialize with hardcoded data instead of fetching from Firestore
    initializeHardcodedData();
});









// Gestion de l'authentification
document.addEventListener('DOMContentLoaded', () => {
    // Référence aux éléments du DOM
    const loginForm = document.getElementById('login-form');
    const loginAlert = document.getElementById('login-alert');
    const loginButtonText = document.getElementById('login-button-text');
    const loginButtonSpinner = document.getElementById('login-button-spinner');
    const logoutButton = document.getElementById('logout-button');
    const loginContainer = document.getElementById('login-container');
    
    // Fonction pour afficher/masquer l'alerte d'erreur
    function showLoginError(message) {
        loginAlert.textContent = message || 'Email ou mot de passe incorrect';
        loginAlert.style.display = 'block';
    }
    
    function hideLoginError() {
        loginAlert.style.display = 'none';
    }
    
    // Fonction pour afficher/masquer le spinner de chargement
    function setLoading(isLoading) {
        if (isLoading) {
            loginButtonText.style.display = 'none';
            loginButtonSpinner.style.display = 'inline-block';
        } else {
            loginButtonText.style.display = 'inline-block';
            loginButtonSpinner.style.display = 'none';
        }
    }
    
    // Configurer la persistance de session (garder l'utilisateur connecté)
    setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
            console.error("Erreur de persistance:", error);
        });
    
    // Écouter l'état de l'authentification
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Utilisateur connecté
            console.log("Utilisateur connecté:", user.email);
            
            // Masquer la page de connexion et afficher le contenu admin
            if (loginContainer) {
                loginContainer.style.display = 'none';
            }
            
            // Afficher le contenu de l'admin (vous devrez ajuster selon votre structure)
            const adminContent = document.getElementByid('dashboard-container');
            if (adminContent) {
                adminContent.style.display = 'flex';
            }
        } else {
            // Utilisateur non connecté
            console.log("Utilisateur non connecté");
            
            // Afficher la page de connexion et masquer le contenu admin
            if (loginContainer) {
                loginContainer.style.display = 'flex';
            }
            
            // Masquer le contenu de l'admin
            const adminContent = document.getElementById('admin-content');
            if (adminContent) {
                adminContent.style.display = 'none';
            }
        }
    });
    
    // Gestion du formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideLoginError();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showLoginError('Veuillez remplir tous les champs');
                return;
            }
            
            setLoading(true);
            
            try {
                // Tentative de connexion avec Firebase
                await signInWithEmailAndPassword(auth, email, password);
                // La redirection est gérée par onAuthStateChanged
            } catch (error) {
                console.error("Erreur d'authentification:", error);
                
                // Gestion des erreurs spécifiques
                let errorMessage = 'Email ou mot de passe incorrect';
                
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'Aucun utilisateur trouvé avec cet email';
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Mot de passe incorrect';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Format d\'email invalide';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Trop de tentatives échouées. Veuillez réessayer plus tard';
                }
                
                showLoginError(errorMessage);
            } finally {
                setLoading(false);
            }
        });
    }
    
    // Gestion du bouton de déconnexion
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                await signOut(auth);
                showToast("Déconnexion réussie", "success");
                console.log("Déconnexion réussie");
                // La redirection est gérée par onAuthStateChanged
            } catch (error) {
                console.error("Erreur lors de la déconnexion:", error);
            }
        });
    }
    
    // Vérifier l'état d'authentification au chargement
    const user = auth.currentUser;
    if (user) {
        console.log("Utilisateur déjà connecté:", user.email);
        showToast("Utilisateur déjà connecté", "success");
    }
});

// Fonction utilitaire pour vérifier si l'utilisateur est admin
function checkAdminAuth() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Vous pouvez ajouter une vérification supplémentaire ici
                // Par exemple, vérifier si l'utilisateur existe dans une collection "admins"
                // ou s'il a un champ isAdmin dans son profil
                resolve(user);
            } else {
                reject(new Error("Utilisateur non authentifié"));
            }
        });
    });
}

// Fonction de protection pour les pages admin
function requireAdmin(callback) {
    checkAdminAuth()
        .then(user => {
            // L'utilisateur est authentifié et admin
            callback(user);
        })
        .catch(error => {
            // Rediriger vers la page de connexion
            console.error("Accès non autorisé:", error);
            
            // Rediriger vers la page de connexion si nous sommes sur une autre page
            if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
        });
}






// Constants for pagination
const ITEMS_PER_PAGE = 10;

// Fonction de débogage pour afficher la structure de la base de données
async function debugFirebaseCollections() {
    console.log("=== DÉBOGAGE FIREBASE ===");
    
    // Vérifier si l'authentification est nécessaire
    console.log("Vérification de l'état d'authentification...");
    if (!auth.currentUser) {
        console.log("⚠️ Utilisateur non authentifié. L'accès à Firestore pourrait être refusé.");
    } else {
        console.log("✓ Utilisateur authentifié:", auth.currentUser.email);
    }
    
    // Essayer de lister toutes les collections disponibles
    console.log("Tentative d'accès à Firestore...");
    
    try {
        // Tester la collection 'events'
        console.log("Test de la collection 'events'...");
        const eventsRef = collection(db, 'events');
        const eventsSnapshot = await getDocs(eventsRef);
        
        // Vérifier si nous avons bien obtenu des documents
        if (eventsSnapshot && eventsSnapshot.docs) {
            console.log(`Collection 'events' - ${eventsSnapshot.docs.length} documents trouvés`);
            
            if (eventsSnapshot.docs.length > 0) {
                console.log("Structure d'un document de la collection 'events':");
                const firstDoc = eventsSnapshot.docs[0];
                console.log("ID:", firstDoc.id);
                console.log("Données:", firstDoc.data());
            }
        } else {
            console.log("Aucun document trouvé ou format de retour inattendu pour 'events'");
        }
        
        // Tester la collection 'summer-events'
        console.log("Test de la collection 'summer_events'...");
        const summerEventsRef = collection(db, 'summer_events');//SUN
        const summerEventsSnapshot = await getDocs(summerEventsRef);
        
        if (summerEventsSnapshot && summerEventsSnapshot.docs) {
            console.log(`Collection 'summer_events' - ${summerEventsSnapshot.docs.length} documents trouvés`);
            
            if (summerEventsSnapshot.docs.length > 0) {
                console.log("Structure d'un document de la collection 'summer_events':");
                const firstDoc = summerEventsSnapshot.docs[0];
                console.log("ID:", firstDoc.id);
                console.log("Données:", firstDoc.data());
            }
        } else {
            console.log("Aucun document trouvé ou format de retour inattendu pour 'summer_events'");
        }
        
    } catch (error) {
        console.error("Erreur lors de l'accès à Firestore:", error);
    }
}

// Function to initialize Firebase (missing in original code)
async function initializeFirebase() {
    try {
        // On assume que Firebase est déjà configuré et que ces objets sont disponibles
        console.log("Initialisation de Firebase...");
        
        // Utilisation cohérente de la v9 de Firebase
        if (!app) {
            console.error("L'app Firebase n'est pas initialisée");
        }
        
        if (!db) {
            console.error("Firestore n'est pas initialisé");
        }
        
        console.log("Firebase initialisé avec succès");
        return true;
    } catch (error) {
        console.error("Erreur d'initialisation Firebase:", error);
        return false;
    }
}

// Event Manager class to handle all event operations
class EventManager {
    constructor(collectionName, tableId, paginationId, searchId) {
        this.collectionName = collectionName;
        this.tableId = tableId;
        this.paginationId = paginationId;
        this.searchId = searchId;
        this.currentPage = 1;
        this.events = [];
        this.filteredEvents = [];
    }

    // Load events from Firebase
    async loadEvents() {
        try {
            console.log(`Tentative de chargement de la collection: ${this.collectionName}`);
            const eventsRef = collection(db, this.collectionName);
            
            // Vérifier si la collection existe
            console.log("Référence de collection créée:", eventsRef);
            
            // Ne pas utiliser orderBy pour le moment pour simplifier la requête
            const querySnapshot = await getDocs(eventsRef);
            
            console.log(`Résultat de la requête sur ${this.collectionName}:`, querySnapshot);
            console.log(`Nombre de documents trouvés: ${querySnapshot.size}`);
            
            this.events = [];
            querySnapshot.forEach((doc) => {
                console.log(`Document trouvé - ID: ${doc.id}`);
                const eventData = doc.data();
                console.log("Données du document:", eventData);
                
                // Vérifier si date existe avant de formater
                let dateFormatted = "Date non définie";
                if (eventData.date) {
                    dateFormatted = this.formatDate(eventData.date);
                }
                
                this.events.push({
                    id: doc.id,
                    ...eventData,
                    dateFormatted: dateFormatted
                });
            });
            
            console.log(`Total des événements chargés: ${this.events.length}`);
            this.filteredEvents = [...this.events];
            this.renderTable();
            this.setupSearch();
        } catch (error) {
            console.error("Erreur lors du chargement des événements:", error);
            document.getElementById(this.tableId).innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 1rem; color: var(--error);">
                        Une erreur est survenue lors du chargement des événements: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

   // Modification de la méthode formatDate pour gérer tous les cas possibles
formatDate(timestamp) {
    if (!timestamp) return "Date non définie";
    
    console.log("Type de timestamp reçu:", typeof timestamp, timestamp);
    
    let date;
    try {
        // Gestion des différents formats possibles
        if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else if (timestamp.seconds && timestamp.nanoseconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp._seconds && timestamp._nanoseconds) {
            date = new Date(timestamp._seconds * 1000);
        } else if (typeof timestamp === 'object' && timestamp.toDate instanceof Function) {
            date = timestamp.toDate();
        } else {
            date = new Date(timestamp);
        }
        
        if (isNaN(date.getTime())) {
            console.error("Date invalide après conversion");
            return "Date invalide";
        }
        
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
        return "Erreur de date";
    }
}

  // Modification de setupSearch pour prendre en compte les nouveaux champs
setupSearch() {
    const searchInput = document.getElementById(this.searchId);
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            
            this.filteredEvents = this.events.filter(event => {
                // Recherche dans tous les champs textuels
                return (
                    (event.title?.toLowerCase().includes(searchTerm)) ||
                    (event.subtitle?.toLowerCase().includes(searchTerm)) ||
                    (event.location?.toLowerCase().includes(searchTerm)) ||
                    (event.locationName?.toLowerCase().includes(searchTerm)) ||
                    (event.description?.toLowerCase().includes(searchTerm)) ||
                    // Recherche dans le tableau de genres s'il existe
                    (Array.isArray(event.genre) && 
                     event.genre.some(g => (g.name || g).toString().toLowerCase().includes(searchTerm))) ||
                    // Si genre est une chaîne simple
                    (typeof event.genre === 'string' && 
                     event.genre.toLowerCase().includes(searchTerm)) ||
                    // Recherche dans le tableau de partenaires s'il existe
                    (Array.isArray(event.partners) && 
                     event.partners.some(p => (p.name || p).toString().toLowerCase().includes(searchTerm)))
                );
            });
            
            this.currentPage = 1;
            this.renderTable();
        });
    }
}

    // Render events table
    renderTable() {
        console.log(`Rendu du tableau ${this.tableId} avec ${this.filteredEvents.length} événements`);
        const table = document.getElementById(this.tableId);
        
        if (!table) {
            console.error(`Élément avec ID ${this.tableId} introuvable dans le DOM`);
            return;
        }
        
        const startIndex = (this.currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const eventsToShow = this.filteredEvents.slice(startIndex, endIndex);
        
        console.log(`Affichage des événements ${startIndex+1} à ${Math.min(endIndex, this.filteredEvents.length)} sur ${this.filteredEvents.length}`);
        
        if (this.filteredEvents.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 1rem;">
                        Aucun événement trouvé dans la collection "${this.collectionName}".
                    </td>
                </tr>
            `;
        } else {
            let html = '';
            
            eventsToShow.forEach((event, index) => {
                console.log(`Traitement de l'événement #${startIndex + index + 1}:`, event.id);
                html += this.createEventRow(event);
            });
            
            table.innerHTML = html;
            this.addEventListeners();
        }
        
        this.renderPagination();
    }

 // Modification de la méthode createEventRow pour prendre en compte plus de champs
// Modification de la structure HTML du tableau
// Remplacez votre structure actuelle par celle-ci

// Structure du HTML avec colonnes dédiées
createEventRow(event) {
    console.log(`Création d'une ligne pour l'événement:`, event);
    
    // Formatage des dates avec une gestion plus robuste
    const startDateFormatted = event.startDate ? this.formatDate(event.startDate) : '-';
    const endDateFormatted = event.endDate ? this.formatDate(event.endDate) : '-';
    
    // Formatage des genres (qui peuvent être un tableau d'objets)
    let genreDisplay = '-';
    if (event.genre) {
        if (Array.isArray(event.genre)) {
            genreDisplay = event.genre.map(g => g.name || g).join(', ');
        } else {
            genreDisplay = event.genre;
        }
    }
    
    // Formatage des partenaires
    let partnersDisplay = '-';
    if (event.partners && Array.isArray(event.partners)) {
        partnersDisplay = event.partners.map(p => p.name || p).join(', ');
    }
    
    return `
        <tr data-id="${event.id}">
            <td>${event.title || '-'}</td>
            <td>${event.subtitle || '-'}</td>
            <td>
                <div>Début: ${startDateFormatted}</div>
                <div>Fin: ${endDateFormatted}</div>
            </td>
            <td>${event.location || event.locationName || '-'}</td>
            <td>${genreDisplay}</td>
            <td>${partnersDisplay}</td>
            <td class="truncate-text">${event.description || '-'}</td>
            <td class="table-actions">
                <button class="action-view view-event" title="Voir">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-edit edit-event" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-delete delete-event" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

    // Add event listeners to table buttons
    addEventListeners() {
        // View event buttons
        document.querySelectorAll(`#${this.tableId} .view-event`).forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.closest('tr').dataset.id;
                this.viewEvent(eventId);
            });
        });

        // Edit event buttons
        document.querySelectorAll(`#${this.tableId} .edit-event`).forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.closest('tr').dataset.id;
                this.editEvent(eventId);
            });
        });

        // Delete event buttons
        document.querySelectorAll(`#${this.tableId} .delete-event`).forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.closest('tr').dataset.id;
                this.showDeleteConfirmation(eventId);
            });
        });
    }

    // Render pagination controls
    renderPagination() {
        const paginationContainer = document.getElementById(this.paginationId);
        const totalPages = Math.ceil(this.filteredEvents.length / ITEMS_PER_PAGE);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHtml = '';
        
        // Previous button
        paginationHtml += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    ${this.currentPage === 1 ? 'disabled' : ''} 
                    data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)
            ) {
                paginationHtml += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (
                i === this.currentPage - 2 ||
                i === this.currentPage + 2
            ) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Next button
        paginationHtml += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    ${this.currentPage === totalPages ? 'disabled' : ''} 
                    data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationContainer.innerHTML = paginationHtml;
        
        // Add event listeners for pagination buttons
        document.querySelectorAll(`#${this.paginationId} .pagination-btn:not(.disabled)`).forEach(button => {
            button.addEventListener('click', () => {
                this.currentPage = parseInt(button.dataset.page);
                this.renderTable();
            });
        });
    }

// Méthode pour visualiser un événement
async viewEvent(eventId) {
    try {
        const eventRef = doc(db, this.collectionName, eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            
            // Formatage des dates avec une gestion plus robuste
            const startDateFormatted = eventData.startDate ? this.formatDate(eventData.startDate) : '-';
            const endDateFormatted = eventData.endDate ? this.formatDate(eventData.endDate) : '-';
            
            // Formatage des genres
            let genreDisplay = '-';
            if (eventData.genre) {
                if (Array.isArray(eventData.genre)) {
                    genreDisplay = eventData.genre.map(g => g.name || g).join(', ');
                } else {
                    genreDisplay = eventData.genre;
                }
            }
            
            // Formatage des partenaires
            let partnersDisplay = '-';
            if (eventData.partners && Array.isArray(eventData.partners)) {
                partnersDisplay = eventData.partners.map(p => p.name || p).join(', ');
            }
            
            // Création du contenu HTML pour l'affichage
            const viewHtml = `
                <div class="swal-event-details">
                    <div class="event-detail">
                        <h4>Titre</h4>
                        <p>${eventData.title || '-'}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Sous-titre</h4>
                        <p>${eventData.subtitle || '-'}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Date de début</h4>
                        <p>${startDateFormatted}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Date de fin</h4>
                        <p>${endDateFormatted}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Lieu</h4>
                        <p>${eventData.location || eventData.locationName || '-'}</p>
                    </div>
                    <div class="event-detail">
                        <h4>URL du lieu</h4>
                        <p>${eventData.locationUrl ? 
                            `<a href="${eventData.locationUrl}" target="_blank">${eventData.locationUrl}</a>` : 
                            '-'
                        }</p>
                    </div>
                    <div class="event-detail">
                        <h4>Genre</h4>
                        <p>${genreDisplay}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Partenaires</h4>
                        <p>${partnersDisplay}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Description</h4>
                        <p>${eventData.description || '-'}</p>
                    </div>
                    ${eventData.imageUrl ? `
                    <div class="event-detail">
                        <h4>Image</h4>
                        <div class="event-image">
                            <img src="${eventData.imageUrl}" alt="${eventData.title}" style="max-width: 100%; max-height: 300px;">
                        </div>
                    </div>` : ''}
                </div>
            `;
            
            // Afficher le overlay de visualisation
            Swal.fire({
                title: eventData.title || 'Détails de l\'événement',
                html: viewHtml,
                width: '800px',
                showConfirmButton: false,
                showCloseButton: true,
                showDenyButton: true,
                denyButtonText: 'Modifier',
                denyButtonColor: '#3085d6',
                customClass: {
                    container: 'swal-event-container',
                    popup: 'swal-event-popup',
                    content: 'swal-event-content'
                }
            }).then((result) => {
                if (result.isDenied) {
                    // Si l'utilisateur clique sur "Modifier", on passe en mode édition
                    this.editEvent(eventId, eventData);
                }
            });
            
            // Ajouter des styles pour améliorer l'apparence
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .swal-event-container {
                    z-index: 9999;
                }
                .swal-event-popup {
                    padding: 20px;
                }
                .swal-event-content {
                    padding: 0;
                }
                .swal-event-details {
                    text-align: left;
                    max-height: 70vh;
                    overflow-y: auto;
                    padding-right: 10px;
                }
                .event-detail {
                    margin-bottom: 15px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .event-detail:last-child {
                    border-bottom: none;
                }
                .event-detail h4 {
                    margin: 0;
                    color: #555;
                    font-size: 14px;
                    font-weight: 600;
                }
                .event-detail p {
                    margin: 5px 0 0;
                    font-size: 16px;
                }
                .event-image {
                    margin-top: 10px;
                    text-align: center;
                }
            `;
            document.head.appendChild(styleElement);
            
        } else {
            Swal.fire({
                title: 'Événement non trouvé',
                text: "L'événement demandé n'existe pas ou a été supprimé.",
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage de l'événement:", error);
        Swal.fire({
            title: 'Erreur!',
            text: `Une erreur est survenue: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

 
// Méthode pour éditer un événement
async editEvent(eventId, eventData = null) {
    try {
        // Si eventData n'est pas fourni, on le récupère
        if (!eventData) {
            const eventRef = doc(db, this.collectionName, eventId);
            const eventDoc = await getDoc(eventRef);
            if (!eventDoc.exists()) {
                throw new Error("L'événement n'existe pas");
            }
            eventData = eventDoc.data();
        }
        
        // Fonction pour convertir les timestamps en chaînes pour input datetime-local
        const timestampToInputDatetime = (timestamp) => {
            if (!timestamp) return '';
            
            let date;
            try {
                if (timestamp instanceof Timestamp) {
                    date = timestamp.toDate();
                } else if (timestamp.seconds && timestamp.nanoseconds) {
                    date = new Date(timestamp.seconds * 1000);
                } else if (timestamp._seconds && timestamp._nanoseconds) {
                    date = new Date(timestamp._seconds * 1000);
                } else {
                    date = new Date(timestamp);
                }
                
                if (isNaN(date.getTime())) return '';
                
                return date.toISOString().slice(0, 16);
            } catch (e) {
                return '';
            }
        };
        
        // Préparation des valeurs pour le formulaire
        const startDateInput = timestampToInputDatetime(eventData.startDate);
        const endDateInput = timestampToInputDatetime(eventData.endDate);
        
        let genreValue = '';
        if (eventData.genre) {
            if (Array.isArray(eventData.genre)) {
                genreValue = eventData.genre.map(g => g.name || g).join(', ');
            } else {
                genreValue = eventData.genre;
            }
        }
        
        let partnersValue = '';
        if (eventData.partners && Array.isArray(eventData.partners)) {
            partnersValue = eventData.partners.map(p => p.name || p).join(', ');
        }
        
        // Création du formulaire d'édition
        const formHtml = `
            <form id="edit-event-form" class="swal-event-form">
                <div class="form-group">
                    <label for="edit-title">Titre*</label>
                    <input type="text" id="edit-title" class="swal2-input" value="${eventData.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="edit-subtitle">Sous-titre</label>
                    <input type="text" id="edit-subtitle" class="swal2-input" value="${eventData.subtitle || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-start-date">Date de début</label>
                    <input type="datetime-local" id="edit-start-date" class="swal2-input" value="${startDateInput}">
                </div>
                <div class="form-group">
                    <label for="edit-end-date">Date de fin</label>
                    <input type="datetime-local" id="edit-end-date" class="swal2-input" value="${endDateInput}">
                </div>
                <div class="form-group">
                    <label for="edit-location">Lieu</label>
                    <input type="text" id="edit-location" class="swal2-input" value="${eventData.location || eventData.locationName || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-location-url">URL du lieu</label>
                    <input type="url" id="edit-location-url" class="swal2-input" value="${eventData.locationUrl || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-genre">Genre (séparés par des virgules)</label>
                    <input type="text" id="edit-genre" class="swal2-input" value="${genreValue}">
                </div>
                <div class="form-group">
                    <label for="edit-partners">Partenaires (séparés par des virgules)</label>
                    <input type="text" id="edit-partners" class="swal2-input" value="${partnersValue}">
                </div>
                <div class="form-group">
                    <label for="edit-description">Description</label>
                    <textarea id="edit-description" class="swal2-textarea">${eventData.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-image">Image</label>
                    <input type="file" id="edit-image" class="swal2-file" accept="image/*">
                    ${eventData.imageUrl ? 
                        `<div class="current-image">
                            <p>Image actuelle:</p>
                            <img src="${eventData.imageUrl}" alt="Image actuelle" style="max-width: 100%; max-height: 200px; margin-top: 10px;">
                        </div>` : ''}
                    <div id="image-preview" class="image-preview"></div>
                </div>
            </form>
        `;
        
        // Affichage du formulaire d'édition
        const result = await Swal.fire({
            title: 'Modifier l\'événement',
            html: formHtml,
            width: '800px',
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#28a745',
            customClass: {
                container: 'swal-event-container',
                popup: 'swal-event-popup',
                content: 'swal-event-content'
            },
            didOpen: () => {
                // Prévisualisation de l'image
                const imageInput = document.getElementById('edit-image');
                const imagePreview = document.getElementById('image-preview');
                
                imageInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            imagePreview.innerHTML = `
                                <p>Nouvelle image:</p>
                                <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; margin-top: 10px;">
                            `;
                        };
                        reader.readAsDataURL(this.files[0]);
                    }
                });
            },
            preConfirm: async () => {
                // Validation du formulaire
                const title = document.getElementById('edit-title').value;
                if (!title) {
                    Swal.showValidationMessage('Le titre est obligatoire');
                    return false;
                }
                
                try {
                    // Afficher un indicateur de chargement
                    Swal.showLoading();
                    
                    // Collecte des données du formulaire
                    const formData = {
                        title: document.getElementById('edit-title').value,
                        subtitle: document.getElementById('edit-subtitle').value,
                        location: document.getElementById('edit-location').value,
                        locationUrl: document.getElementById('edit-location-url').value,
                        description: document.getElementById('edit-description').value,
                        updatedAt: serverTimestamp()
                    };
                    
                    // Gestion des dates
                    const startDateValue = document.getElementById('edit-start-date').value;
                    const endDateValue = document.getElementById('edit-end-date').value;
                    
                    if (startDateValue) {
                        formData.startDate = Timestamp.fromDate(new Date(startDateValue));
                    }
                    
                    if (endDateValue) {
                        formData.endDate = Timestamp.fromDate(new Date(endDateValue));
                    }
                    
                    // Gestion du genre et des partenaires
                    const genreValue = document.getElementById('edit-genre').value;
                    if (genreValue) {
                        formData.genre = genreValue.split(',').map(g => g.trim()).filter(g => g);
                    } else {
                        formData.genre = [];
                    }
                    
                    const partnersValue = document.getElementById('edit-partners').value;
                    if (partnersValue) {
                        formData.partners = partnersValue.split(',').map(p => p.trim()).filter(p => p);
                    } else {
                        formData.partners = [];
                    }
                    
                    // Gestion de l'image
                    const imageFile = document.getElementById('edit-image').files[0];
                    if (imageFile) {
                        // Créer une référence au storage pour l'image
                        const storageRef = ref(storage, `events/${eventId}/${imageFile.name}`);
                        
                        // Uploader l'image
                        await uploadBytes(storageRef, imageFile);
                        
                        // Obtenir l'URL de l'image
                        const downloadURL = await getDownloadURL(storageRef);
                        formData.imageUrl = downloadURL;
                    }
                    
                    // Mise à jour dans Firestore
                    await updateDoc(doc(db, this.collectionName, eventId), formData);
                    
                    // Mise à jour des données locales
                    this.updateLocalEventData(eventId, formData);
                    
                    return true;
                } catch (error) {
                    console.error("Erreur lors de la mise à jour:", error);
                    Swal.showValidationMessage(`Erreur: ${error.message}`);
                    return false;
                }
            }
        });
        
        if (result.isConfirmed) {
            // Notification de succès et rafraîchissement du tableau
            this.renderTable();
            updateStatsCards();
            Swal.fire({
                title: 'Événement mis à jour!',
                text: 'Les modifications ont été enregistrées avec succès.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
        
        // Ajouter des styles pour le formulaire
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .swal-event-form {
                text-align: left;
                max-height: 70vh;
                overflow-y: auto;
                padding-right: 10px;
            }
            .swal-event-form .form-group {
                margin-bottom: 15px;
            }
            .swal-event-form label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #555;
            }
            .swal-event-form .swal2-input,
            .swal-event-form .swal2-textarea,
            .swal-event-form .swal2-file {
                margin: 5px 0;
                width: 100%;
            }
            .swal-event-form .swal2-textarea {
                height: 100px;
            }
            .image-preview {
                margin-top: 10px;
            }
            .current-image {
                margin-top: 10px;
                margin-bottom: 15px;
            }
            .current-image p {
                margin: 0 0 5px;
                font-weight: 600;
            }
        `;
        document.head.appendChild(styleElement);
        
    } catch (error) {
        console.error("Erreur lors de l'édition de l'événement:", error);
        Swal.fire({
            title: 'Erreur!',
            text: `Une erreur est survenue: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Méthode utilitaire pour mettre à jour les données locales
updateLocalEventData(eventId, formData) {
    // Mise à jour des données locales
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        this.events[eventIndex] = {
            ...this.events[eventIndex],
            ...formData,
            dateFormatted: formData.startDate ? this.formatDate(formData.startDate) : this.events[eventIndex].dateFormatted
        };
    }
    
    // Mise à jour des données filtrées si nécessaire
    const filteredIndex = this.filteredEvents.findIndex(e => e.id === eventId);
    if (filteredIndex !== -1) {
        this.filteredEvents[filteredIndex] = {
            ...this.filteredEvents[filteredIndex],
            ...formData,
            dateFormatted: formData.startDate ? this.formatDate(formData.startDate) : this.filteredEvents[filteredIndex].dateFormatted
        };
    }
}

    // Remplacer la méthode showDeleteConfirmation
showDeleteConfirmation(eventId) {
    const event = this.events.find(event => event.id === eventId);
    if (!event) return;
    
    Swal.fire({
        title: 'Êtes-vous sûr?',
        html: `Vous êtes sur le point de supprimer l'événement <strong>${event.title}</strong>.<br>Cette action est irréversible!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return this.deleteEvent(eventId)
                .catch(error => {
                    Swal.showValidationMessage(
                        `La suppression a échoué: ${error.message}`
                    );
                });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire(
                'Supprimé!',
                `L'événement "${event.title}" a été supprimé avec succès.`,
                'success'
            );
        }
    });
}

// Modifier la méthode deleteEvent pour retourner une promesse
async deleteEvent(eventId) {
    try {
        await deleteDoc(doc(db, this.collectionName, eventId));
        
        // Remove from local arrays
        this.events = this.events.filter(event => event.id !== eventId);
        this.filteredEvents = this.filteredEvents.filter(event => event.id !== eventId);
        
        // Re-render table
        this.renderTable();
        updateStatsCards();
        
        return true;
    } catch (error) {
        console.error("Erreur lors de la suppression de l'événement:", error);
        throw error;
    }
}

    // Delete event
    async deleteEvent(eventId) {
        try {
            const deleteText = document.getElementById('delete-text');
            const deleteSpinner = document.getElementById('delete-spinner');
            const confirmButton = document.getElementById('confirm-delete');
            
            deleteText.style.display = 'none';
            deleteSpinner.style.display = 'inline-block';
            confirmButton.disabled = true;
            
            await deleteDoc(doc(db, this.collectionName, eventId));
            
            // Remove from local arrays
            this.events = this.events.filter(event => event.id !== eventId);
            this.filteredEvents = this.filteredEvents.filter(event => event.id !== eventId);
            
            // Hide modal
            document.getElementById('delete-confirmation-modal').style.display = 'none';
            
            // Re-render table
            this.renderTable();
            updateStatsCards();
            
            deleteText.style.display = 'inline';
            deleteSpinner.style.display = 'none';
            confirmButton.disabled = false;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'événement:", error);
            alert('Une erreur est survenue lors de la suppression de l\'événement');
            
            const deleteText = document.getElementById('delete-text');
            const deleteSpinner = document.getElementById('delete-spinner');
            const confirmButton = document.getElementById('confirm-delete');
            
            deleteText.style.display = 'inline';
            deleteSpinner.style.display = 'none';
            confirmButton.disabled = false;
        }
    }
}

// Initialize event managers when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM chargé, initialisation des gestionnaires d'événements");
    
    try {
        // Initialiser Firebase
        await initializeFirebase();
        
        // Vérifier l'état de Firebase
        console.log("Firebase app initialisé:", app);
        console.log("Firebase Firestore initialisé:", db);
        
        // Débogage des collections Firebase
        await debugFirebaseCollections();
    
        // Regular events manager
        console.log("Initialisation du gestionnaire d'événements FDLM");
        const eventsManager = new EventManager(
            'events', 
            'events-table', 
            'events-pagination', 
            'events-search'
        );
        await eventsManager.loadEvents();
        
        // Summer events manager
        console.log("Initialisation du gestionnaire d'événements d'été");
        const summerEventsManager = new EventManager(
            'summer-events', 
            'summer-events-table', 
            'summer-events-pagination', 
            'summer-events-search'
        );
        await summerEventsManager.loadEvents();
        
        // Handle modal background clicks to close modals
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });
        });
    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
    }
});

// Add CSS for pagination
const style = document.createElement('style');
style.textContent = `
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 1.5rem;
        gap: 0.5rem;
    }
    
    .pagination-btn {
        min-width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius);
        border: 1px solid #E5E7EB;
        background-color: var(--bg);
        cursor: pointer;
        font-size: 0.875rem;
        padding: 0 0.5rem;
    }
    
    .pagination-btn.active {
        background-color: var(--primary);
        color: white;
        border-color: var(--primary);
    }
    
    .pagination-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .pagination-ellipsis {
        padding: 0 0.25rem;
    }
    
    .field-value {
        padding: 0.5rem;
        background-color: var(--secondary);
        border-radius: var(--radius);
        min-height: 20px;
    }
`;
document.head.appendChild(style);

// Assurez-vous que ces imports sont présents au début du fichier
// import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc, Timestamp } from "firebase/firestore";







async function updateStatsCards() {
    try {
      // 1) Total événements FDLM
      const eventsSnap = await getDocs(collection(db, 'events'));
      document.getElementById('total-events').textContent = eventsSnap.size;

      // 2) Événements de l'été
      const summerSnap = await getDocs(collection(db, 'summer_events'));
      document.getElementById('summer-events').textContent = summerSnap.size;

      // 3) Jours restants avant le 21 juin
      const today = new Date();
      let year = today.getFullYear();
      let target = new Date(year, 5, 21); // mois 5 = juin
      if (today > target) {
        target = new Date(year + 1, 5, 21);
      }
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.ceil((target - today) / msPerDay);
      document.getElementById('upcoming-events').textContent = daysLeft;
    } catch (err) {
      console.error('Erreur mise à jour stats :', err);
    }
  }

  // Lancement au chargement
  updateStatsCards();










  