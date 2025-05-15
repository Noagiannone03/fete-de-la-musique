// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, query, orderBy, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";



  // **ICI** : import Storage depuis le CDN, pas "firebase/storage"
  import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
  } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwtimDB_Mai-QPyB6d0yqjJX_d5mQjGY8",
    authDomain: "fete-de-la-musique-64a6b.firebaseapp.com",
    projectId: "fete-de-la-musique-64a6b",
  storageBucket: "fete-de-la-musique-64a6b.firebasestorage.app", 
    appId: "1:1087878331068:web:28719d3278a619cb816eb9",
    measurementId: "G-MW9YYKP1J8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
  const storage = getStorage(app);
// Global variables
let eventImageFile = null;
let summerEventImageFile = null;

// Déclaration du tableau locations comme avant, mais vide au départ
let locations = [];

// Fonction pour charger les points de son depuis Firebase
async function loadSoundPointsininput() {
  try {
    const soundPointsCollection = collection(db, 'sound_points');
    const querySnapshot = await getDocs(soundPointsCollection);
    
    // Vider le tableau existant
    locations = [];
    
    querySnapshot.forEach((doc) => {
      // Pour chaque document, récupérer le champ "name"
      if (doc.data().name) {
        locations.push(doc.data().name);
      }
    });
    
    // Si aucun point de son n'est trouvé dans Firebase, utiliser les valeurs par défaut
    if (locations.length === 0) {
      locations = [
        'Place de la République',
        'Parc des expositions',
        'Salle des fêtes',
        'Théâtre municipal',
        'Place du marché'
      ];
    }
    
    // À ce stade, actualiser la liste déroulante des points de son
    updateSoundPointsDropdown();
    
  } catch (error) {
    console.error("Erreur lors de la récupération des points de son:", error);
    // En cas d'erreur, utiliser les valeurs par défaut
    locations = [
      'Place de la République',
      'Parc des expositions',
      'Salle des fêtes',
      'Théâtre municipal',
      'Place du marché'
    ];
    
    // Actualiser la liste déroulante avec les valeurs par défaut
    updateSoundPointsDropdown();
  }
}

// Fonction pour mettre à jour la liste déroulante des points de son
function updateSoundPointsDropdown() {
  // Récupérer le select des points de son
  const soundPointsSelect = document.getElementById('event-location');
  
  // S'assurer que nous avons bien trouvé le bon élément
  if (!soundPointsSelect) {
    console.error("Select des points de son non trouvé");
    return;
  }
  
  // Conserver uniquement l'option par défaut
  soundPointsSelect.innerHTML = '<option value="" disabled selected>Sélectionner un point de son</option>';
  
  // Ajouter chaque point de son comme option
  locations.forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    soundPointsSelect.appendChild(option);
  });
}

// Initialiser les fonctionnalités liées aux points de son
document.addEventListener('DOMContentLoaded', () => {
  // Charger les points de son depuis Firebase
  loadSoundPointsininput();
});

const genres = [
    'Good vibes',
    'Chill',
    'Punchy',
    'Survolté'
];

// Déclaration du tableau partners comme avant, mais vide au départ
let partners = [];

// Fonction pour charger les partenaires depuis Firebase
async function loadPartners() {
  try {
    const partnersCollection = collection(db, 'partners');
    const querySnapshot = await getDocs(partnersCollection);
    
    // Vider le tableau existant
    partners = [];
    
    querySnapshot.forEach((doc) => {
      // Pour chaque document, récupérer le champ "name"
      if (doc.data().name) {
        partners.push(doc.data().name);
      }
    });
    
    // Si aucun partenaire n'est trouvé dans Firebase, utiliser les valeurs par défaut
    if (partners.length === 0) {
      partners = [
        'Mairie',
        'Conservatoire',
        'Association culturelle',
        'Radio locale',
        'Sponsor principal'
      ];
    }
    
    // À ce stade, actualiser uniquement la liste déroulante des partenaires
    updatePartnersDropdown();
    
  } catch (error) {
    console.error("Erreur lors de la récupération des partenaires:", error);
    // En cas d'erreur, utiliser les valeurs par défaut
    partners = [
      'Mairie',
      'Conservatoire',
      'Association culturelle',
      'Radio locale',
      'Sponsor principal'
    ];
    
    // Actualiser la liste déroulante avec les valeurs par défaut
    updatePartnersDropdown();
  }
}

// Fonction pour mettre à jour uniquement la liste déroulante des partenaires
function updatePartnersDropdown() {
  // Récupérer spécifiquement le dropdown des partenaires
  const partnersDropdown = document.getElementById('event-partners-dropdown');
  
  // S'assurer que nous avons bien trouvé le bon élément
  if (!partnersDropdown) {
    console.error("Dropdown des partenaires non trouvé");
    return;
  }
  
  // Vider le dropdown actuel
  partnersDropdown.innerHTML = '';
  
  // Ajouter chaque partenaire comme option
  partners.forEach(partner => {
    const option = document.createElement('div');
    option.className = 'multiselect-option';
    option.setAttribute('data-id', partner);
    option.setAttribute('data-name', partner);
    option.textContent = partner;
    partnersDropdown.appendChild(option);
  });
  
  // Réattacher les écouteurs d'événements spécifiquement pour les options de partenaires
  attachPartnersEventListeners();
}

// Fonction pour réattacher les écouteurs d'événements uniquement pour les options de partenaires
function attachPartnersEventListeners() {
  // Cibler uniquement les options dans le dropdown des partenaires
  const partnerOptions = document.querySelectorAll('#event-partners-dropdown .multiselect-option');
  
  partnerOptions.forEach(option => {
    // Supprimer d'abord les anciens écouteurs pour éviter les doublons
    option.removeEventListener('click', handlePartnerOptionClick);
    
    // Ajouter un nouvel écouteur
    option.addEventListener('click', handlePartnerOptionClick);
  });
}

// Gestionnaire d'événement pour le clic sur une option de partenaire
function handlePartnerOptionClick(event) {
  const id = this.getAttribute('data-id');
  const name = this.getAttribute('data-name');
  
  // Vérifier si l'élément est déjà sélectionné
  const selectedContainer = document.getElementById('event-partners-selected');
  if (!selectedContainer.querySelector(`[data-id="${id}"]`)) {
    // Créer un nouvel élément sélectionné
    const selectedItem = document.createElement('div');
    selectedItem.className = 'selected-item';
    selectedItem.setAttribute('data-id', id);
    selectedItem.innerHTML = `
      ${name}
      <span class="remove-item"><i class="fas fa-times"></i></span>
    `;
    
    // Ajouter l'élément à la section des éléments sélectionnés
    selectedContainer.appendChild(selectedItem);
    
    // Mettre à jour le champ caché des partenaires
    updatePartnersHiddenField();
    
    // Ajouter l'écouteur d'événement pour supprimer l'élément
    selectedItem.querySelector('.remove-item').addEventListener('click', function(e) {
      e.stopPropagation();
      selectedItem.remove();
      updatePartnersHiddenField();
    });
  }
}

// Fonction pour mettre à jour uniquement le champ caché des partenaires
function updatePartnersHiddenField() {
  const selectedItems = document.querySelectorAll('#event-partners-selected .selected-item');
  const selectedValues = Array.from(selectedItems).map(item => item.getAttribute('data-id'));
  document.getElementById('event-partners').value = JSON.stringify(selectedValues);
}

// Initialiser uniquement les fonctionnalités liées aux partenaires
document.addEventListener('DOMContentLoaded', () => {
  // Charger les partenaires depuis Firebase
  loadPartners();
  
  // Réattacher les écouteurs d'événements pour l'input de recherche des partenaires
  const partnersSearchInput = document.getElementById('event-partners-input');
  
  if (partnersSearchInput) {
    // Supprimer les anciens écouteurs pour éviter les doublons
    partnersSearchInput.removeEventListener('click', handlePartnersInputClick);
    partnersSearchInput.removeEventListener('input', handlePartnersInputSearch);
    
    // Gestion de l'affichage du dropdown au clic sur l'input
    partnersSearchInput.addEventListener('click', handlePartnersInputClick);
    
    // Gestion de la recherche
    partnersSearchInput.addEventListener('input', handlePartnersInputSearch);
  }
  
  // Ajouter un écouteur global pour fermer le dropdown des partenaires
  document.removeEventListener('click', handleDocumentClick);
  document.addEventListener('click', handleDocumentClick);
});



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

// Nouvelle version de convertImageToBase64 qui upload en Storage et renvoie l'URL
async function convertImageToBase64(file) {
  try {
    // Crée un chemin unique pour l'image (ici timestamp + nom d'origine)
    const fileName = `${Date.now()}_${file.name}`;
    const imgRef   = storageRef(storage, `partners/${fileName}`);

    // Upload du fichier brut
    await uploadBytes(imgRef, file);

    // Récupère l'URL publique
    const downloadURL = await getDownloadURL(imgRef);
    return downloadURL;

  } catch (err) {
    console.error("Erreur d'upload vers Firebase Storage :", err);
    throw err;
  }
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
        populateMultiselectDropdown('event-genre', genres);
        populateMultiselectDropdown('summer-event-genre', genres);
        populateMultiselectDropdown('event-partners', partners);
        populateMultiselectDropdown('summer-event-partners', partners);
    } catch (error) {
        console.error("Error initializing hardcoded data:", error);
        showToast("Erreur lors de l'initialisation des données", "error");
    }
}

function populateSelectDropdown(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Element not found: ${selectId}`);
        return;
    }
    
    // On garde la première option (placeholder), on supprime le reste
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    options.forEach(option => {
        const value = (typeof option === 'object' && option.id !== undefined)
            ? option.id
            : option;
        const label = (typeof option === 'object' && option.name !== undefined)
            ? option.name
            : option;

        const optElement = document.createElement('option');
        optElement.value = value;
        optElement.textContent = label;
        select.appendChild(optElement);
    });
}


// Populate multiselect dropdown (objets ou strings)
function populateMultiselectDropdown(baseId, options) {
    const dropdown = document.getElementById(`${baseId}-dropdown`);
    if (!dropdown) {
        console.error(`Dropdown element not found: ${baseId}-dropdown`);
        return;
    }

    dropdown.innerHTML = '';
    
    // Add options
    options.forEach(option => {
        // Si option est un objet, on prend id et name, sinon c'est une simple string
        const optId   = (typeof option === 'object' && option.id   !== undefined) ? option.id   : option;
        const optName = (typeof option === 'object' && option.name !== undefined) ? option.name : option;

        const optElement = document.createElement('div');
        optElement.className = 'multiselect-option';
        optElement.dataset.id   = optId;
        optElement.dataset.name = optName;
        optElement.textContent  = optName;
        optElement.addEventListener('click', () => 
            toggleMultiselectOption(baseId, optId, optName)
        );
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
        const opts = dropdown.querySelectorAll('.multiselect-option');
        
        opts.forEach(opt => {
            const text = opt.textContent.toLowerCase();
            opt.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });

    // Enter key to add new option
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            e.preventDefault();
            const newOption = searchInput.value.trim();
            const existing = Array.from(dropdown.querySelectorAll('.multiselect-option'))
                .map(opt => opt.dataset.name.toLowerCase());
            
            if (!existing.includes(newOption.toLowerCase())) {
                const newId = `new-${Date.now()}`;
                // Ajoute à la sélection active
                toggleMultiselectOption(baseId, newId, newOption);
                
                // Insère dans la dropdown
                const optEl = document.createElement('div');
                optEl.className = 'multiselect-option selected';
                optEl.dataset.id   = newId;
                optEl.dataset.name = newOption;
                optEl.textContent  = newOption;
                optEl.addEventListener('click', () => 
                    toggleMultiselectOption(baseId, newId, newOption)
                );
                dropdown.appendChild(optEl);
            }
            
            searchInput.value = '';
        }
    });
    
    // Ferme dropdown au clic à l'extérieur
    document.addEventListener('click', (e) => {
        if (!e.target.closest(`.multiselect-wrapper`)) {
            dropdown.style.display = 'none';
        }
    });

    // Empêche la fermeture quand on clique dedans
    dropdown.addEventListener('click', e => e.stopPropagation());
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
        const base64Resized = base64Original;
        
        console.log(`Image processed successfully`);
        
        return base64Resized;
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    }
}
// Helper pour extraire une simple valeur depuis un objet ou une string
function extractValue(item) {
    // si c'est un objet on renvoie son name (ou son id si tu préfères)
    if (typeof item === 'object' && item !== null) {
      return item.name ?? item.id;
    }
    // sinon c'est déjà une string
    return item;
  }
  
  // Add regular event to Firestore
  async function addRegularEvent(event) {
    try {
      if (!event.title || !event.location) {
        throw new Error("Missing required event data");
      }
      
      const genresArray = (event.genres || []).map(extractValue);
      const partnersArray = (event.partners || []).map(extractValue);
      
      const docRef = await addDoc(collection(db, "events"), {
        title:       event.title,
        subtitle:    event.subtitle || null,
        location:    event.location,
        locationName:event.locationName || "",
        genre:       genresArray,
        startDate:   Timestamp.fromDate(new Date(event.startDate)),
        endDate:     Timestamp.fromDate(new Date(event.endDate)),
        plusUrl:     event.plusUrl     || null,
        description: event.description || "",
        imageUrl:    event.imageUrl || null,
        createdAt:   Timestamp.now(),
        updatedAt:   Timestamp.now()
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
      if (!event.title || !event.location) {
        throw new Error("Missing required event data");
      }
      
      const genresArray   = (event.genres   || []).map(extractValue);
      const partnersArray = (event.partners || []).map(extractValue);
      
      const docRef = await addDoc(collection(db, "summer_events"), {
        title:       event.title,
        subtitle:    event.subtitle || null,
        location:    event.location,
        locationName:event.locationName || "",
        genre:       genresArray,
        organizer:   event.organizer || "",
        date:        Timestamp.fromDate(new Date(event.date)),
        endDate:     event.endDate ? Timestamp.fromDate(new Date(event.endDate)) : null,
        locationUrl: event.locationUrl || null,
        plusUrl:     event.plusUrl     || null,
        description: event.description || "",
        partners:    partnersArray,
        imageUrl:    event.imageUrl || null,
        createdAt:   Timestamp.now(),
        updatedAt:   Timestamp.now()
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
            const moreUrlInput = document.getElementById('event-plus-url');

            const descriptionInput = document.getElementById('event-description');
           
            
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
           
            const moreUrl = moreUrlInput ? moreUrlInput.value : '';
            const description = descriptionInput.value;
            
            
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
        
                moreUrl,
                description,
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
            const location = locationSelect ? subtitleInput.value : '';
            const locationName = locationSelect ? subtitleInput.value : '';;
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
constructor(collectionName, tableId, paginationId, searchId, columnConfig = null) {
        this.collectionName = collectionName;
        this.tableId = tableId;
        this.paginationId = paginationId;
        this.searchId = searchId;
        this.currentPage = 1;
        this.events = [];
        this.filteredEvents = [];
        
        // Configuration par défaut des colonnes si aucune n'est fournie
        this.columnConfig = columnConfig || {
            columns: [
                { key: 'title', label: 'Titre' },
                { key: 'dateFormatted', label: 'Date' },
                { key: 'location', label: 'Lieu' },
                { key: 'organizer', label: 'Organisateur' }
            ],
            searchFields: ['title', 'location', 'organizer', 'description']
        };

        // Assurez-vous qu'aucun formatter n'est défini par défaut
        this.columnConfig.columns.forEach(column => {
            if (column.formatter && typeof column.formatter !== 'function') {
                console.warn(`Formatter non valide pour la colonne ${column.key}, suppression du formatter`);
                delete column.formatter;
            }
        });
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
// 1. Corriger le formatage des dates
// Modifiez la méthode formatDate pour être plus robuste
formatDate(timestamp) {
    if (!timestamp) return "Date non définie";
    
    console.log("Type de timestamp reçu:", typeof timestamp, timestamp);
    
    let date;
    try {
        // Gestion des différents formats possibles
        if (typeof timestamp === 'string') {
            // Si c'est déjà une chaîne, essayer de la convertir
            date = new Date(timestamp);
        } else if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else if (timestamp.seconds && timestamp.nanoseconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp._seconds && timestamp._nanoseconds) {
            date = new Date(timestamp._seconds * 1000);
        } else if (typeof timestamp === 'object' && timestamp.toDate instanceof Function) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else {
            console.error("Format de date non reconnu:", timestamp);
            return "Format inconnu";
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
        console.error("Erreur lors du formatage de la date:", error, "Pour la valeur:", timestamp);
        return "Erreur de date";
    }
}
// Modifiez la partie de la méthode createEventRow qui gère les formatters
// À l'intérieur de la classe EventManager, remplacez la partie concernant les formatters par ce code:

createEventRow(event) {
    console.log(`Création d'une ligne pour l'événement:`, event);
    
    // Générer dynamiquement les colonnes basées sur la configuration
    const tableColumns = this.columnConfig.columns.map(column => {
        let cellContent = '-';
        
        // Vérifier si un formatter personnalisé est défini
        if (column.formatter && typeof column.formatter === 'function') {
            try {
                // Utiliser le formatter avec le contexte this
                cellContent = column.formatter.call(this, event);
            } catch (error) {
                console.error("Erreur avec le formatter pour la colonne", column.key, error);
                cellContent = "Erreur d'affichage";
            }
        } 
        // Gestion spéciale pour les dates
        else if (column.key === 'dateFormatted' || column.key === 'date' || 
                 column.key === 'startDate' || column.key === 'endDate') {
            const dateValue = event[column.key];
            cellContent = dateValue ? this.formatDate(dateValue) : '-';
        }
        // Gestion pour les clés multiples
        else if (Array.isArray(column.key)) {
            // Pour les colonnes avec plusieurs champs (comme dates)
            const values = column.key.map(k => {
                const val = event[k];
                if (k.includes('Date') && val) {
                    return this.formatDate(val);
                }
                return val || '-';
            });
            cellContent = values.join(' - ');
        }
        // Gestion standard d'une propriété
        else if (typeof column.key === 'string' && column.key in event) {
            cellContent = event[column.key] || '-';
        }
        
        return `<td>${cellContent}</td>`;
    }).join('');

    return `
        <tr data-id="${event.id}" data-collection="${this.collectionName}">
            ${tableColumns}
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

// Modifiez setupSearch pour utiliser la configuration personnalisée
setupSearch() {
    const searchInput = document.getElementById(this.searchId);
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            
            this.filteredEvents = this.events.filter(event => {
                // Utiliser les champs de recherche configurés
                return this.columnConfig.searchFields.some(field => {
                    // Vérification robuste pour gérer différents types de données
                    const value = event[field];
                    if (value === undefined) return false;
                    
                    // Convertir en chaîne et rechercher
                    return value.toString().toLowerCase().includes(searchTerm);
                });
            });
            
            this.currentPage = 1;
            this.renderTable();
        });
    }
}

// Modifiez renderTable pour générer dynamiquement l'en-tête du tableau
renderTable() {
    const table = document.getElementById(this.tableId);
    
    if (!table) {
        console.error(`Élément avec ID ${this.tableId} introuvable dans le DOM`);
        return;
    }
    
    // Générer l'en-tête dynamiquement
    const headerColumns = this.columnConfig.columns
        .map(column => `<th>${column.label}</th>`)
        .join('');
    
    // Ajouter la colonne Actions
    const header = `
        <thead>
            <tr>
                ${headerColumns}
                <th>Actions</th>
            </tr>
        </thead>
    `;
    
    // Le reste de la méthode reste similaire
    const startIndex = (this.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const eventsToShow = this.filteredEvents.slice(startIndex, endIndex);
    
    if (this.filteredEvents.length === 0) {
        table.innerHTML = header + `
            <tbody>
                <tr>
                    <td colspan="${this.columnConfig.columns.length + 1}" style="text-align: center; padding: 2rem;">
                        <h3>C'est un peu vide par ici 👀</h3>
                    </td>
                </tr>
            </tbody>
        `;
    } else {
        let bodyHtml = '<tbody>';
        
        eventsToShow.forEach((event, index) => {
            bodyHtml += this.createEventRow(event);
        });
        
        bodyHtml += '</tbody>';
        table.innerHTML = header + bodyHtml;
    }
    
    this.addEventListeners();
    this.renderPagination();
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

// 3. Mettre à jour viewEvent pour s'adapter au type d'événement
async viewEvent(eventId) {
    try {
        const eventRef = doc(db, this.collectionName, eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            
            // Déterminer le type d'événement basé sur la collection
            const isSummerEvent = this.collectionName === 'summer_events';
            
            // Préparation des champs communs
            const title = eventData.title || '-';
            const subtitle = eventData.subtitle || '-';
            const description = eventData.description || '-';
            const location = eventData.location || eventData.locationName || '-';
            const locationUrl = eventData.locationUrl || '-';
            
            // Formatage des genres
            let genreDisplay = '-';
            if (eventData.genre) {
                if (Array.isArray(eventData.genre)) {
                    genreDisplay = eventData.genre.map(g => g.name || g).join(', ');
                } else {
                    genreDisplay = eventData.genre;
                }
            }
            
            // Formatter les dates en fonction du type d'événement
            let dateSection = '';
            
            if (isSummerEvent) {
                // Pour les événements d'été
                const dateFormatted = eventData.date ? this.formatDate(eventData.date) : '-';
                const organizer = eventData.organizer || '-';
                
                dateSection = `
                    <div class="event-detail">
                        <h4>Date</h4>
                        <p>${dateFormatted}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Organisateur</h4>
                        <p>${organizer}</p>
                    </div>
                `;
            } else {
                // Pour les événements normaux
                const startDateFormatted = eventData.startDate ? this.formatDate(eventData.startDate) : '-';
                const endDateFormatted = eventData.endDate ? this.formatDate(eventData.endDate) : '-';
                
                // Formatage des partenaires
                let partnersDisplay = '-';
                if (eventData.partners && Array.isArray(eventData.partners)) {
                    partnersDisplay = eventData.partners.map(p => p.name || p).join(', ');
                }
                
                dateSection = `
                    <div class="event-detail">
                        <h4>Date de début</h4>
                        <p>${startDateFormatted}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Date de fin</h4>
                        <p>${endDateFormatted}</p>
                    </div>
                `;
            }
            
            // Création du contenu HTML pour l'affichage
            const viewHtml = `
                <div class="swal-event-details">
                    <div class="event-detail">
                        <h4>Titre</h4>
                        <p>${title}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Sous-titre</h4>
                        <p>${subtitle}</p>
                    </div>
                    ${dateSection}
                    <div class="event-detail">
                        <h4>Lieu</h4>
                        <p>${location}</p>
                    </div>
                    
                    <div class="event-detail">
                        <h4>Genre</h4>
                        <p>${genreDisplay}</p>
                    </div>
                    <div class="event-detail">
                        <h4>Description</h4>
                        <p>${description}</p>
                    </div>
                    ${eventData.imageUrl ? `
                    <div class="event-detail">
                        <h4>Image</h4>
                        <div class="event-image">
                            <img src="${eventData.imageUrl}" alt="${title}" style="max-width: 100%; max-height: 300px;">
                        </div>
                    </div>` : ''}
                </div>
            `;
            
            // Afficher le overlay de visualisation
            Swal.fire({
                title: title || 'Détails de l\'événement',
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

// 4. Mettre à jour editEvent pour s'adapter au type d'événement
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
        
        // Déterminer le type d'événement basé sur la collection
        const isSummerEvent = this.collectionName === 'summer_events';
        
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
                } else if (timestamp instanceof Date) {
                    date = timestamp;
                } else {
                    date = new Date(timestamp);
                }
                
                if (isNaN(date.getTime())) return '';
                
                return date.toISOString().slice(0, 16);
            } catch (e) {
                console.error("Erreur conversion timestamp:", e);
                return '';
            }
        };
        
        // Préparation des champs communs
        const title = eventData.title || '';
        const subtitle = eventData.subtitle || '';
        const location = eventData.location || eventData.locationName || '';
        const locationUrl = eventData.locationUrl || '';
        const description = eventData.description || '';
        
        // Préparation des valeurs pour le formulaire en fonction du type d'événement
        let dateSection = '';
        let genreValue = '';
        
        if (eventData.genre) {
            if (Array.isArray(eventData.genre)) {
                genreValue = eventData.genre.map(g => g.name || g).join(', ');
            } else {
                genreValue = eventData.genre;
            }
        }
        
        if (isSummerEvent) {
            // Pour les événements d'été
            const dateInput = timestampToInputDatetime(eventData.date);
            const organizer = eventData.organizer || '';
            
            dateSection = `
                <div class="form-group">
                    <label for="edit-date">Date</label>
                    <input type="datetime-local" id="edit-date" class="swal2-input" value="${dateInput}">
                </div>
                <div class="form-group">
                    <label for="edit-organizer">Organisateur</label>
                    <input type="text" id="edit-organizer" class="swal2-input" value="${organizer}">
                </div>
            `;
        } else {
            // Pour les événements normaux
            const startDateInput = timestampToInputDatetime(eventData.startDate);
            const endDateInput = timestampToInputDatetime(eventData.endDate);
            
            let partnersValue = '';
            if (eventData.partners && Array.isArray(eventData.partners)) {
                partnersValue = eventData.partners.map(p => p.name || p).join(', ');
            }
            
            dateSection = `
                <div class="form-group">
                    <label for="edit-start-date">Date de début</label>
                    <input type="datetime-local" id="edit-start-date" class="swal2-input" value="${startDateInput}">
                </div>
                <div class="form-group">
                    <label for="edit-end-date">Date de fin</label>
                    <input type="datetime-local" id="edit-end-date" class="swal2-input" value="${endDateInput}">
                </div>
             
            `;
        }
        
        // Création du formulaire d'édition
        const formHtml = `
            <form id="edit-event-form" class="swal-event-form">
                <div class="form-group">
                    <label for="edit-title">Titre*</label>
                    <input type="text" id="edit-title" class="swal2-input" value="${title}" required>
                </div>
                <div class="form-group">
                    <label for="edit-subtitle">Sous-titre</label>
                    <input type="text" id="edit-subtitle" class="swal2-input" value="${subtitle}">
                </div>
                ${dateSection}
                <div class="form-group">
                    <label for="edit-location">Lieu</label>
                    <input type="text" id="edit-location" class="swal2-input" value="${location}">
                </div>
               
                <div class="form-group">
                    <label for="edit-genre">Genre (séparés par des virgules)</label>
                    <input type="text" id="edit-genre" class="swal2-input" value="${genreValue}">
                </div>
                <div class="form-group">
                    <label for="edit-description">Description</label>
                    <textarea id="edit-description" class="swal2-textarea">${description}</textarea>
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
                    
                    // Collecte des données du formulaire - champs communs
                    const formData = {
                        title: document.getElementById('edit-title').value,
                        subtitle: document.getElementById('edit-subtitle').value,
                        location: document.getElementById('edit-location').value,
                        description: document.getElementById('edit-description').value,
                        updatedAt: serverTimestamp()
                    };
                    
                    // Collecte des données spécifiques au type d'événement
                    if (isSummerEvent) {
                        // Pour les événements d'été
                        const dateValue = document.getElementById('edit-date').value;
                        const organizer = document.getElementById('edit-organizer').value;
                        
                        if (dateValue) {
                            formData.date = Timestamp.fromDate(new Date(dateValue));
                        }
                        
                        if (organizer) {
                            formData.organizer = organizer;
                        }
                    } else {
                        // Pour les événements normaux
                        const startDateValue = document.getElementById('edit-start-date').value;
                        const endDateValue = document.getElementById('edit-end-date').value;
                        
                        if (startDateValue) {
                            formData.startDate = Timestamp.fromDate(new Date(startDateValue));
                        }
                        
                        if (endDateValue) {
                            formData.endDate = Timestamp.fromDate(new Date(endDateValue));
                        }
                        
                       
                    }
                    
                    // Gestion du genre pour tous les types d'événements
                    const genreValue = document.getElementById('edit-genre').value;
                    if (genreValue) {
                        formData.genre = genreValue.split(',').map(g => g.trim()).filter(g => g);
                    } else {
                        formData.genre = [];
                    }
                    
                    // Gestion de l'image
                    const imageFile = document.getElementById('edit-image').files[0];
                    if (imageFile) {
                        // Créer une référence au storage pour l'image
                        const storageRef = ref(storage, `${this.collectionName}/${eventId}/${imageFile.name}`);
                        
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
            if (typeof updateStatsCards === 'function') {
                updateStatsCards();
            }
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

// 5. Modifier addEventListeners pour passer l'information sur la collection
addEventListeners() {
    // View event buttons
    document.querySelectorAll(`#${this.tableId} .view-event`).forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const eventId = row.dataset.id;
            this.viewEvent(eventId);
        });
    });

    // Edit event buttons
    document.querySelectorAll(`#${this.tableId} .edit-event`).forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const eventId = row.dataset.id;
            this.editEvent(eventId);
        });
    });

    // Delete event buttons
    document.querySelectorAll(`#${this.tableId} .delete-event`).forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const eventId = row.dataset.id;
            this.showDeleteConfirmation(eventId);
        });
    });
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
// Corrigez les formatters dans l'initialisation des gestionnaires d'événements
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
            'events-search',
            {
                columns: [
                    { 
                        key: 'title', 
                        label: 'Titre',
                        formatter: function(event) {
                            return `${event.title || '-'}`;
                        }
                    },
                    { 
                        key: 'subtitle', 
                        label: 'Style musical',
                        formatter: function(event) {
                            return `${event.subtitle || ''}`;
                        }
                    },
                    { 
                        key: ['startDate', 'endDate'], 
                        label: 'Dates',
                        formatter: function(event) {
                            // Utiliser this.formatDate correctement - le "this" ici fait référence à l'instance EventManager
                            const startDateFormatted = event.startDate ? this.formatDate(event.startDate) : '-';
                            const endDateFormatted = event.endDate ? this.formatDate(event.endDate) : '-';
                            return `
                                <div>
                                    <div>Début: ${startDateFormatted}</div>
                                    <div>Fin: ${endDateFormatted}</div>
                                </div>
                            `;
                        }
                    },
                    { 
                        key: 'location', 
                        label: 'Lieu',
                        formatter: function(event) {
                            return event.location || event.locationName || '-';
                        }
                    },
                    { 
                        key: 'genre', 
                        label: 'Genre',
                        formatter: function(event) {
                            if (!event.genre) return '-';
                            return Array.isArray(event.genre) 
                                ? event.genre.map(g => g.name || g).join(', ')
                                : event.genre;
                        }
                    },
                  
                    { 
                        key: 'description', 
                        label: 'Description',
                        formatter: function(event) {
                            return event.description ? 
                                `<div class="truncate-text">${event.description}</div>` : 
                                '-';
                        }
                    }
                ],
                searchFields: [
                    'title', 'subtitle', 'location', 'locationName', 
                    'genre', 'description', 'partners'
                ]
            }
        );
        eventsManager.loadEvents();
        
        // Summer events manager
        console.log("Initialisation du gestionnaire d'événements d'été");
        // Configuration pour les événements d'été
        const summerEventsManager = new EventManager(
            'summer_events', 
            'summer-events-table', 
            'summer-events-pagination', 
            'summer-events-search',
            {
                columns: [
                    { 
                        key: 'title', 
                        label: 'Titre',
                        formatter: function(event) {
                            return `${event.title || '-'}`;
                        }
                    },
                    { 
                        key: 'subtitle', 
                        label: 'Style musical',
                        formatter: function(event) {
                            return `${event.subtitle || ''}`;
                        }
                    },
                    { 
                        key: 'date', 
                        label: 'Date',
                        formatter: function(event) {
                            // Utiliser this.formatDate correctement - le "this" ici fait référence à l'instance EventManager
                            return event.date ? this.formatDate(event.date) : '-';
                        }
                    },
                    { 
                        key: 'location', 
                        label: 'Lieu',
                        formatter: function(event) {
                            return event.location || event.locationName || '-';
                        }
                    },
                    { 
                        key: 'organizer', 
                        label: 'Organisateur',
                        formatter: function(event) {
                            return event.organizer || '-';
                        }
                    },
                    { 
                        key: 'genre', 
                        label: 'Genre',
                        formatter: function(event) {
                            if (!event.genre) return '-';
                            return Array.isArray(event.genre) 
                                ? event.genre.map(g => g.name || g).join(', ')
                                : event.genre;
                        }
                    },
                    { 
                        key: 'description', 
                        label: 'Description',
                        formatter: function(event) {
                            return event.description ? 
                                `<div class="truncate-text">${event.description}</div>` : 
                                '-';
                        }
                    }
                ],
                searchFields: [
                    'title', 'subtitle', 'location', 'locationName', 
                    'organizer', 'genre', 'description'
                ]
            }
        );
        summerEventsManager.loadEvents();
        
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



// Partner Manager class to handle all partner operations
class PartnerManager {
    constructor(collectionName = 'partners', containerId = 'partners-container', loadingId = 'partners-loading', emptyId = 'partners-empty') {
        this.collectionName = collectionName;
        this.containerId = containerId;
        this.loadingId = loadingId;
        this.emptyId = emptyId;
        this.partners = [];
    }


    
    // Load partners from Firebase
    async loadPartners() {
        try {
            console.log(`Tentative de chargement de la collection: ${this.collectionName}`);
            const partnersRef = collection(db, this.collectionName);
            
            // Vérifier si la collection existe
            console.log("Référence de collection créée:", partnersRef);
            
            const querySnapshot = await getDocs(partnersRef);
            
            console.log(`Résultat de la requête sur ${this.collectionName}:`, querySnapshot);
            console.log(`Nombre de documents trouvés: ${querySnapshot.size}`);
            
            this.partners = [];
            querySnapshot.forEach((doc) => {
                console.log(`Document trouvé - ID: ${doc.id}`);
                const partnerData = doc.data();
                console.log("Données du document:", partnerData);
                
                this.partners.push({
                    id: doc.id,
                    ...partnerData
                });
            });
            
            console.log(`Total des partenaires chargés: ${this.partners.length}`);
            this.renderPartners();
        } catch (error) {
            console.error("Erreur lors du chargement des partenaires:", error);
            document.getElementById(this.containerId).innerHTML = `
                <div class="error-message">
                    Une erreur est survenue lors du chargement des partenaires: ${error.message}
                </div>
            `;
        }
    }

// Modification de la méthode renderPartners
renderPartners() {
    const container = document.getElementById(this.containerId);
    const loading = document.getElementById(this.loadingId);
    const empty = document.getElementById(this.emptyId);
    
    // Masquer le message de chargement
    if (loading) loading.style.display = 'none';
    
    if (this.partners.length === 0) {
        // Afficher le message "vide" s'il n'y a pas de partenaires
        if (empty) empty.style.display = 'block';
        return;
    }
    
    // Masquer le message "vide"
    if (empty) empty.style.display = 'none';
    
    // Créer un tableau pour afficher les partenaires
    let tableHTML = `
        <table class="data-table" id="partners-table">
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Informations</th>
                    <th>Adresse</th>
                    <th>Téléphone</th>
                    <th>Site Web</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Générer les lignes du tableau pour chaque partenaire
    this.partners.forEach(partner => {
        const formattedType = this.formatPartnerType(partner.type);
        // Limiter la longueur du texte des informations pour l'affichage
        const infoText = partner.info ? 
            (partner.info.length > 50 ? partner.info.substring(0, 50) + '...' : partner.info) 
            : '-';
        
        tableHTML += `
            <tr data-id="${partner.id}" data-collection="${this.collectionName}">
                <td>${partner.name || '-'}</td>
                <td>${formattedType}</td>
                <td><div class="truncate-text">${infoText}</div></td>
                <td>${partner.address || '-'}</td>
                <td>${partner.phone || '-'}</td>
                <td>${partner.website ? 
                    `<a href="${partner.website}" target="_blank" title="${partner.website}">
                        <i class="fas fa-external-link-alt"></i> Site
                    </a>` : '-'}</td>
                <td class="table-actions">
                    <button class="action-view view-partner" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-edit edit-partner" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-delete delete-partner" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    // Fermer le tableau
    tableHTML += `
            </tbody>
        </table>
    `;
    
    // Mettre à jour le contenu du conteneur
    container.innerHTML = tableHTML;
    
    // Ajouter les écouteurs d'événements pour les actions
    this.addEventListeners();
}
    // Create a partner card HTML
    createPartnerCard(partner) {
        // Obtenir l'icône en fonction du type d'établissement
        const typeIcon = this.getTypeIcon(partner.type);
        
        // Formatter le type d'établissement pour l'affichage
        const formattedType = this.formatPartnerType(partner.type);
        
        return `
            <div class="partner-card" data-id="${partner.id}">
                <img src="${partner.imageUrl || '/images/placeholder.jpg'}" alt="${partner.name}" class="partner-image">
                <div class="partner-content">
                    <h3 class="partner-name">${partner.name}</h3>
                    <div class="partner-type">
                        <i class="${typeIcon}"></i> ${formattedType}
                    </div>
                    <div class="partner-info">${partner.info || ''}</div>
                    <div class="partner-actions">
                
                        <div class="partner-buttons">
                            <button class="view-partner" title="Voir les détails">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="edit-partner" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-partner" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Get icon based on partner type
    getTypeIcon(type) {
        switch (type) {
            case 'restaurant':
                return 'fas fa-utensils';
            case 'brasserie':
                return 'fas fa-beer';
            case 'bar':
                return 'fas fa-glass-martini-alt';
            case 'cafe':
                return 'fas fa-coffee';
            default:
                return 'fas fa-store';
        }
    }

    // Format partner type for display
    formatPartnerType(type) {
        switch (type) {
            case 'restaurant':
                return 'Restaurant';
            case 'brasserie':
                return 'Brasserie';
            case 'bar':
                return 'Bar';
            case 'cafe':
                return 'Café';
            case 'autre':
                return 'Autre établissement';
            default:
                return type || 'Non spécifié';
        }
    }



    // View partner details
async viewPartner(partnerId) {
    try {
        const partnerRef = doc(db, this.collectionName, partnerId);
        const partnerDoc = await getDoc(partnerRef);
        
        if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            
            // Formatage du type d'établissement
            const formattedType = this.formatPartnerType(partnerData.type);
            
            // Création du contenu HTML pour l'affichage
            // Dans la méthode viewPartner, chercher le bloc de code qui crée le contenu HTML pour l'affichage
// et modifier comme suit:

const viewHtml = `
    <div class="swal-partner-details">
        <div class="partner-detail">
            <h4>Nom</h4>
            <p>${partnerData.name || '-'}</p>
        </div>
        <div class="partner-detail">
            <h4>Type d'établissement</h4>
            <p>${formattedType}</p>
        </div>
        <div class="partner-detail">
            <h4>Informations</h4>
            <p>${partnerData.info || '-'}</p>
        </div>
        <div class="partner-detail">
            <h4>Adresse</h4>
            <p>${partnerData.address || '-'}</p>
        </div>
        <div class="partner-detail">
            <h4>Téléphone</h4>
            <p>${partnerData.phone ? `<a href="tel:${partnerData.phone}">${partnerData.phone}</a>` : '-'}</p>
        </div>
        <div class="partner-detail">
            <h4>Site Web</h4>
            <p>${partnerData.website ? 
                `<a href="${partnerData.website}" target="_blank">${partnerData.website}</a>` : 
                '-'
            }</p>
        </div>
        ${partnerData.imageUrl ? `
        <div class="partner-detail">
            <h4>Image</h4>
            <div class="partner-image-view">
                <img src="${partnerData.imageUrl}" alt="${partnerData.name}" style="max-width: 100%; max-height: 300px;">
            </div>
        </div>` : ''}
    </div>
`;
            
            // Afficher les détails dans un SweetAlert
            Swal.fire({
                title: partnerData.name || 'Détails du partenaire',
                html: viewHtml,
                width: '800px',
                showConfirmButton: false,
                showCloseButton: true,
                showDenyButton: true,
                denyButtonText: 'Modifier',
                denyButtonColor: '#3085d6',
                customClass: {
                    container: 'swal-partner-container',
                    popup: 'swal-partner-popup',
                    content: 'swal-partner-content'
                }
            }).then((result) => {
                if (result.isDenied) {
                    // Si l'utilisateur clique sur "Modifier", on passe en mode édition
                    this.editPartner(partnerId);
                }
            });
            
            // Ajouter des styles pour améliorer l'apparence
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .swal-partner-container {
                    z-index: 9999;
                }
                .swal-partner-popup {
                    padding: 20px;
                }
                .swal-partner-content {
                    padding: 0;
                }
                .swal-partner-details {
                    text-align: left;
                    max-height: 70vh;
                    overflow-y: auto;
                    padding-right: 10px;
                }
                .partner-detail {
                    margin-bottom: 15px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .partner-detail:last-child {
                    border-bottom: none;
                }
                .partner-detail h4 {
                    margin: 0;
                    color: #555;
                    font-size: 14px;
                    font-weight: 600;
                }
                .partner-detail p {
                    margin: 5px 0 0;
                    font-size: 16px;
                }
                .partner-image-view {
                    margin-top: 10px;
                    text-align: center;
                }
            `;
            document.head.appendChild(styleElement);
            
        } else {
            Swal.fire({
                title: 'Partenaire non trouvé',
                text: "Le partenaire demandé n'existe pas ou a été supprimé.",
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage du partenaire:", error);
        Swal.fire({
            title: 'Erreur!',
            text: `Une erreur est survenue: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Show partner edit form
async editPartner(partnerId) {
    try {
        // Récupérer les données du partenaire
        const partnerRef = doc(db, this.collectionName, partnerId);
        const partnerDoc = await getDoc(partnerRef);
        
        if (!partnerDoc.exists()) {
            throw new Error("Le partenaire n'existe pas");
        }
        
        const partnerData = partnerDoc.data();
        
        const formHtml = `
    <form id="edit-partner-form" class="swal-partner-form">
        <div class="form-group">
            <label for="edit-name">Nom*</label>
            <input type="text" id="edit-name" class="swal2-input" value="${partnerData.name || ''}" required>
        </div>
        <div class="form-group">
            <label for="edit-type">Type d'établissement</label>
            <select id="edit-type" class="swal2-select">
                <option value="restaurant" ${partnerData.type === 'restaurant' ? 'selected' : ''}>Restaurant</option>
                <option value="brasserie" ${partnerData.type === 'brasserie' ? 'selected' : ''}>Brasserie</option>
                <option value="bar" ${partnerData.type === 'bar' ? 'selected' : ''}>Bar</option>
                <option value="cafe" ${partnerData.type === 'cafe' ? 'selected' : ''}>Café</option>
                <option value="autre" ${partnerData.type === 'autre' ? 'selected' : ''}>Autre établissement</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-info">Informations</label>
            <textarea id="edit-info" class="swal2-textarea">${partnerData.info || ''}</textarea>
        </div>
        <div class="form-group">
            <label for="edit-address">Adresse</label>
            <input type="text" id="edit-address" class="swal2-input" value="${partnerData.address || ''}">
        </div>
        <div class="form-group">
            <label for="edit-phone">Téléphone</label>
            <input type="tel" id="edit-phone" class="swal2-input" value="${partnerData.phone || ''}">
        </div>
        <div class="form-group">
            <label for="edit-website">Site Web</label>
            <input type="url" id="edit-website" class="swal2-input" value="${partnerData.website || ''}">
        </div>
        <div class="form-group">
            <label for="edit-image">Image</label>
            <input type="file" id="edit-image" class="swal2-file" accept="image/*">
            ${partnerData.imageUrl ? `
            <div class="current-image">
                <p>Image actuelle:</p>
                <img src="${partnerData.imageUrl}" alt="Image actuelle" style="max-width: 100%; max-height: 200px; margin-top: 10px;">
            </div>` : ''}
            <div id="image-preview" class="image-preview"></div>
        </div>
    </form>
`;
        
        // Affichage du formulaire d'édition
        const result = await Swal.fire({
            title: 'Modifier le partenaire',
            html: formHtml,
            width: '800px',
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#28a745',
            customClass: {
                container: 'swal-partner-container',
                popup: 'swal-partner-popup',
                content: 'swal-partner-content'
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
                const name = document.getElementById('edit-name').value;
                if (!name) {
                    Swal.showValidationMessage('Le nom est obligatoire');
                    return false;
                }
                
                try {
                    // Afficher un indicateur de chargement
                    Swal.showLoading();
                    
                    // Collecte des données du formulaire
                   const formData = {
    name: document.getElementById('edit-name').value,
    type: document.getElementById('edit-type').value,
    info: document.getElementById('edit-info').value,
    address: document.getElementById('edit-address').value,
    phone: document.getElementById('edit-phone').value,
    website: document.getElementById('edit-website').value,
    updatedAt: serverTimestamp()
};
                    
                    // Gestion de l'image en Base64
                    const imageFile = document.getElementById('edit-image').files[0];
                    if (imageFile) {
                        try {
                            // Convertir l'image en Base64
                            const imageBase64 = await convertImageToBase64(imageFile);
                            formData.imageUrl = imageBase64;
                        } catch (uploadError) {
                            console.error("Erreur lors de la conversion de l'image:", uploadError);
                            Swal.showValidationMessage(`Erreur avec l'image: ${uploadError.message}`);
                            return false;
                        }
                    }
                    
                    // Mise à jour dans Firestore
                    await updateDoc(doc(db, this.collectionName, partnerId), formData);
                    
                    // Mise à jour des données locales
                    this.updateLocalPartnerData(partnerId, formData);
                    
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
            this.renderPartners();
            if (typeof updateStatsCards === 'function') {
                updateStatsCards();
            }
            Swal.fire({
                title: 'Partenaire mis à jour!',
                text: 'Les modifications ont été enregistrées avec succès.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
        
        // Ajouter des styles pour le formulaire
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .swal-partner-form {
                text-align: left;
                max-height: 70vh;
                overflow-y: auto;
                padding-right: 10px;
            }
            .swal-partner-form .form-group {
                margin-bottom: 15px;
            }
            .swal-partner-form label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #555;
            }
            .swal-partner-form .swal2-input,
            .swal-partner-form .swal2-textarea,
            .swal-partner-form .swal2-file,
            .swal-partner-form .swal2-select {
                margin: 5px 0;
                width: 100%;
            }
            .swal-partner-form .swal2-textarea {
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
        console.error("Erreur lors de l'édition du partenaire:", error);
        Swal.fire({
            title: 'Erreur!',
            text: `Une erreur est survenue: ${error.message}`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Show delete confirmation
showDeleteConfirmation(partnerId) {
    const partner = this.partners.find(p => p.id === partnerId);
    if (!partner) return;
    
    Swal.fire({
        title: 'Êtes-vous sûr?',
        html: `Vous êtes sur le point de supprimer le partenaire <strong>${partner.name}</strong>.<br>Cette action est irréversible!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return this.deletePartner(partnerId)
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
                `Le partenaire "${partner.name}" a été supprimé avec succès.`,
                'success'
            );
        }
    });
}

// Delete partner from Firebase
async deletePartner(partnerId) {
    try {
        // Récupérer les données du partenaire pour supprimer l'image si nécessaire
        const partnerRef = doc(db, this.collectionName, partnerId);
        const partnerDoc = await getDoc(partnerRef);
        
        if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            
            // Supprimer l'image du storage si elle existe
            if (partnerData.imageUrl && (partnerData.imageUrl.startsWith('gs://') || partnerData.imageUrl.startsWith('https://firebasestorage.googleapis.com'))) {
                try {
                    // Créer une référence au fichier basée sur l'URL
                    const imageRef = ref(storage, partnerData.imageUrl);
                    await deleteObject(imageRef);
                    console.log("Image supprimée avec succès");
                } catch (imageError) {
                    console.error("Erreur lors de la suppression de l'image:", imageError);
                    // Continuer malgré l'erreur de suppression d'image
                }
            }
        }
        
        // Supprimer le document du partenaire
        await deleteDoc(partnerRef);
        
        // Mettre à jour le tableau local
        this.partners = this.partners.filter(p => p.id !== partnerId);
        
        // Mettre à jour l'affichage
        this.renderPartners();
        
        // Mettre à jour les statistiques si la fonction existe
        if (typeof updateStatsCards === 'function') {
            updateStatsCards();
        }
        
        return true;
    } catch (error) {
        console.error("Erreur lors de la suppression du partenaire:", error);
        throw error;
    }
}

// Méthode utilitaire pour mettre à jour les données locales
updateLocalPartnerData(partnerId, formData) {
    // Mise à jour des données locales
    const partnerIndex = this.partners.findIndex(p => p.id === partnerId);
    if (partnerIndex !== -1) {
        this.partners[partnerIndex] = {
            ...this.partners[partnerIndex],
            ...formData
        };
    }
    
    // Mise à jour des données filtrées si elles existent
    if (this.filteredPartners) {
        const filteredIndex = this.filteredPartners.findIndex(p => p.id === partnerId);
        if (filteredIndex !== -1) {
            this.filteredPartners[filteredIndex] = {
                ...this.filteredPartners[filteredIndex],
                ...formData
            };
        }
    }
}

// Add event listeners
// Add event listeners
addEventListeners() {
    // View partner buttons
    document.querySelectorAll(`.view-partner`).forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const partnerId = row.dataset.id;
            this.viewPartner(partnerId);
        });
    });

    // Edit partner buttons
    document.querySelectorAll(`.edit-partner`).forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const partnerId = row.dataset.id;
            this.editPartner(partnerId);
        });
    });

    // Delete partner buttons
    document.querySelectorAll(`.delete-partner`).forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const partnerId = row.dataset.id;
            this.showDeleteConfirmation(partnerId);
        });
    });
}

// Formatage du type de partenaire
formatPartnerType(type) {
    const typeMapping = {
        'restaurant': 'Restaurant',
        'hotel': 'Hôtel',
        'venue': 'Lieu',
        'other': 'Autre'
    };
    
    return typeMapping[type] || type || '-';
}
}

// Initialize form handlers for partners
function initializePartnerFormHandlers(partnerManager) {
    // Form submit handler
    const partnerForm = document.getElementById('partner-form');
    if (partnerForm) {
        partnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Récupérer les valeurs du formulaire
            const name = document.getElementById('partner-name').value;
            const type = document.getElementById('partner-type').value;
            const info = document.getElementById('partner-info').value;
            const website = document.getElementById('partner-website').value;
            const address = document.getElementById('partner-address').value;
const phone = document.getElementById('partner-phone').value;
            
            // Récupérer l'ID du partenaire s'il s'agit d'une mise à jour
            const submitButton = document.getElementById('partner-submit');
            const partnerId = submitButton.dataset.partnerId;
            const isUpdate = !!partnerId;
            
            // Afficher le spinner et désactiver le bouton
            const submitText = document.getElementById('partner-submit-text');
            const submitSpinner = document.getElementById('partner-submit-spinner');
            submitText.style.display = 'none';
            submitSpinner.style.display = 'inline-block';
            submitButton.disabled = true;
            
            try {
                // Créer l'objet pour les données du partenaire
               const partnerData = {
    name,
    type,
    info,
    website: website || null,
    address: address || null,
    phone: phone || null,
    updatedAt: serverTimestamp()
};

                
                // Si c'est une nouvelle entrée, ajouter la date de création
                if (!isUpdate) {
                    partnerData.createdAt = serverTimestamp();
                }
                
                // Référence au document Firestore
                let partnerRef;
                if (isUpdate) {
                    partnerRef = doc(db, 'partners', partnerId);
                } else {
                    partnerRef = doc(collection(db, 'partners'));
                }
                
                // Gérer l'upload de l'image en Base64
                const imageInput = document.getElementById('partner-image');
                if (imageInput.files && imageInput.files[0]) {
                    try {
                        const imageBase64 = await convertImageToBase64(imageInput.files[0]);
                        partnerData.imageUrl = imageBase64;
                    } catch (uploadError) {
                        console.error("Erreur lors de la conversion de l'image:", uploadError);
                        showToast("L'image n'a pas pu être traitée, le partenaire sera enregistré sans image", "error");
                    }
                }
                
                // Enregistrer les données dans Firestore
                if (isUpdate) {
                    await updateDoc(partnerRef, partnerData);
                } else {
                    await setDoc(partnerRef, partnerData);
                }
                
                // Réinitialiser le formulaire mais ne pas le faire disparaître
                document.getElementById('partner-name').value = '';
                document.getElementById('partner-type').value = '';
                document.getElementById('partner-info').value = '';
                document.getElementById('partner-maps-url').value = '';
                document.getElementById('partner-website').value = '';
                
                // Réinitialiser l'aperçu de l'image
                document.getElementById('partner-image-preview').style.display = 'none';
                document.getElementById('partner-image-preview').innerHTML = '';
                imageInput.value = '';
                
                // Réinitialiser le bouton
                submitButton.dataset.partnerId = '';
                submitText.textContent = 'Ajouter le partenaire';
                
                // Si c'était une mise à jour, actualiser l'affichage
                if (isUpdate) {
                    document.querySelector('#add-partner-page .page-title').textContent = 'Ajouter un partenaire';
                }
                
                // Afficher un message de succès
                showToast(
                    isUpdate ? 'Partenaire mis à jour avec succès!' : 'Partenaire ajouté avec succès!',
                    'success'
                );
                
                // Recharger la liste des partenaires en arrière-plan
                await partnerManager.loadPartners();
                
                // Mettre à jour les statistiques si la fonction existe
                if (typeof updateStatsCards === 'function') {
                    updateStatsCards();
                }
            } catch (error) {
                console.error("Erreur lors de l'enregistrement du partenaire:", error);
                showToast(`Erreur: ${error.message}`, 'error');
            } finally {
                // Réinitialiser le bouton quoi qu'il arrive
                submitText.style.display = 'inline';
                submitSpinner.style.display = 'none';
                submitButton.disabled = false;
            }
        });
    }
    
    // Fonction pour afficher des notifications toast
    function showToast(message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: type === 'success' ? 'Succès!' : 'Erreur',
                text: message,
                icon: type,
                timer: 3000,
                showConfirmButton: false
            });
        } else {
            alert(message);
        }
    }
    
    // Cancel button handler
    const cancelButton = document.getElementById('partner-cancel');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            // Récupérer l'ID du partenaire s'il s'agit d'une mise à jour
            const submitButton = document.getElementById('partner-submit');
            const isUpdate = !!submitButton.dataset.partnerId;
            
            // Réinitialiser le formulaire
            document.getElementById('partner-form').reset();
            
            // Réinitialiser l'aperçu de l'image
            document.getElementById('partner-image-preview').style.display = 'none';
            document.getElementById('partner-image-preview').innerHTML = '';
            
            // Réinitialiser le bouton de soumission
            submitButton.dataset.partnerId = '';
            document.getElementById('partner-submit-text').textContent = 'Ajouter le partenaire';
            
            // Réinitialiser le titre de la page
            document.querySelector('#add-partner-page .page-title').textContent = 'Ajouter un partenaire';
            
            // Si c'était une mise à jour, revenir à la liste des partenaires
            if (isUpdate) {
                document.getElementById('add-partner-page').style.display = 'none';
                document.getElementById('partners-list-page').style.display = 'block';
            }
            // Pour un nouvel ajout, on laisse la page de formulaire visible
        });
    }
    
    // Add partner button handler
    const addPartnerButton = document.getElementById('add-partner-button');
    if (addPartnerButton) {
        addPartnerButton.addEventListener('click', () => {
            // Réinitialiser le formulaire avant d'afficher la page
            document.getElementById('partner-form').reset();
            
            // Réinitialiser l'aperçu de l'image
            document.getElementById('partner-image-preview').style.display = 'none';
            document.getElementById('partner-image-preview').innerHTML = '';
            
            // Réinitialiser le bouton de soumission
            const submitButton = document.getElementById('partner-submit');
            submitButton.dataset.partnerId = '';
            document.getElementById('partner-submit-text').textContent = 'Ajouter le partenaire';
            
            // Réinitialiser le titre de la page
            document.querySelector('#add-partner-page .page-title').textContent = 'Ajouter un partenaire';
            
            // Afficher la page d'ajout de partenaire
            document.getElementById('partners-list-page').style.display = 'none';
            document.getElementById('add-partner-page').style.display = 'block';
        });
    }
    
    // Initialiser la prévisualisation des images
    initializeImagePreview();
    
    // Back to list button handler
    const backToListButton = document.getElementById('back-to-list-button');
    if (backToListButton) {
        backToListButton.addEventListener('click', () => {
            // Réinitialiser le formulaire
            document.getElementById('partner-form').reset();
            
            // Réinitialiser l'aperçu de l'image
            document.getElementById('partner-image-preview').style.display = 'none';
            document.getElementById('partner-image-preview').innerHTML = '';
            
            // Réinitialiser le bouton de soumission
            const submitButton = document.getElementById('partner-submit');
            submitButton.dataset.partnerId = '';
            document.getElementById('partner-submit-text').textContent = 'Ajouter le partenaire';
            
            // Réinitialiser le titre de la page
            document.querySelector('#add-partner-page .page-title').textContent = 'Ajouter un partenaire';
            
            // Revenir à la liste des partenaires
            document.getElementById('add-partner-page').style.display = 'none';
            document.getElementById('partners-list-page').style.display = 'block';
        });
    }
}

// Fonction pour créer un nouveau partenaire
async function createPartner(partnerData, imageFile = null) {
    try {
        // Créer une référence pour le nouveau document
        const partnerRef = doc(collection(db, 'partners'));
        
        // Ajouter les timestamps
        partnerData.createdAt = serverTimestamp();
        partnerData.updatedAt = serverTimestamp();
        
        // Gérer l'upload de l'image si fournie
        if (imageFile) {
            try {
                // Convertir l'image en Base64
                const imageBase64 = await convertImageToBase64(imageFile);
                partnerData.imageUrl = imageBase64;
            } catch (uploadError) {
                console.error("Erreur lors de la conversion de l'image:", uploadError);
                // Continuer sans image
            }
        }
        
        // Enregistrer dans Firestore
        await setDoc(partnerRef, partnerData);
        
        return partnerRef.id;
    } catch (error) {
        console.error("Erreur lors de la création du partenaire:", error);
        throw error;
    }
}

// Fonction pour mettre à jour un partenaire existant
async function updatePartner(partnerId, partnerData, imageFile = null) {
    try {
        // Référence au document du partenaire
        const partnerRef = doc(db, 'partners', partnerId);
        
        // Ajouter le timestamp de mise à jour
        partnerData.updatedAt = serverTimestamp();
        
        // Gérer l'upload de l'image si fournie
        if (imageFile) {
            try {
                // Convertir l'image en Base64 au lieu d'utiliser Storage
                const imageBase64 = await convertImageToBase64(imageFile);
                partnerData.imageUrl = imageBase64;
            } catch (uploadError) {
                console.error("Erreur lors de la conversion de l'image:", uploadError);
                // Continuer sans mettre à jour l'image
            }
        }
        
        // Mise à jour dans Firestore
        await updateDoc(partnerRef, partnerData);
        
        return partnerId;
    } catch (error) {
        console.error("Erreur lors de la mise à jour du partenaire:", error);
        throw error;
    }
}



// Modification du comportement du formulaire pour ne pas le faire disparaître après soumission
function updatePartnerFormSubmitBehavior() {
    const partnerForm = document.getElementById('partner-form');
    if (partnerForm) {
        // Remplacer le gestionnaire d'événements existant
        const newSubmitHandler = async (e) => {
            e.preventDefault();
            
            // Récupérer les valeurs du formulaire
            const name = document.getElementById('partner-name').value;
            const type = document.getElementById('partner-type').value;
            const info = document.getElementById('partner-info').value;
            const website = document.getElementById('partner-website').value;
            const address = document.getElementById('partner-address').value;
const phone = document.getElementById('partner-phone').value;
            
            // Récupérer l'ID du partenaire s'il s'agit d'une mise à jour
            const submitButton = document.getElementById('partner-submit');
            const partnerId = submitButton.dataset.partnerId;
            const isUpdate = !!partnerId;
            
            // Afficher le spinner et désactiver le bouton
            const submitText = document.getElementById('partner-submit-text');
            const submitSpinner = document.getElementById('partner-submit-spinner');
            submitText.style.display = 'none';
            submitSpinner.style.display = 'inline-block';
            submitButton.disabled = true;
            
            try {
                // Créer l'objet pour les données du partenaire
                const partnerData = {
    name,
    type,
    info,
    website: website || null,
    address: address || null,
    phone: phone || null,
    updatedAt: serverTimestamp()
};
                
                // Si c'est une nouvelle entrée, ajouter la date de création
                if (!isUpdate) {
                    partnerData.createdAt = serverTimestamp();
                }
                
                // Référence au document Firestore
                let partnerRef;
                if (isUpdate) {
                    partnerRef = doc(db, 'partners', partnerId);
                } else {
                    partnerRef = doc(collection(db, 'partners'));
                }
                
                // Gérer l'upload de l'image si nécessaire
                const imageInput = document.getElementById('partner-image');
                
                if (imageInput.files && imageInput.files[0]) {
                    try {
                        // Convertir l'image en Base64
                        const imageBase64 = await convertImageToBase64(imageInput.files[0]);
                        partnerData.imageUrl = imageBase64;
                    } catch (uploadError) {
                        console.error("Erreur lors de la conversion de l'image:", uploadError);
                        showToast("L'image n'a pas pu être traitée", "error");
                    }
                }
                
                // Enregistrer les données dans Firestore
                if (isUpdate) {
                    await updateDoc(partnerRef, partnerData);
                } else {
                    await setDoc(partnerRef, partnerData);
                }
                
                // IMPORTANT: Ne PAS faire disparaître le formulaire ici
                // Simplement vider les champs
                document.getElementById('partner-name').value = '';
                document.getElementById('partner-type').value = '';
                document.getElementById('partner-info').value = '';
                document.getElementById('partner-website').value = '';
                document.getElementById('partner-address').value = '';
document.getElementById('partner-phone').value = '';
                
                // Réinitialiser l'aperçu de l'image
                document.getElementById('partner-image-preview').style.display = 'none';
                document.getElementById('partner-image-preview').innerHTML = '';
                imageInput.value = '';
                
                // Si c'était une mise à jour, réinitialiser le mode du formulaire pour un nouvel ajout
                if (isUpdate) {
                    submitButton.dataset.partnerId = '';
                    submitText.textContent = 'Ajouter le partenaire';
                    document.querySelector('#add-partner-page .page-title').textContent = 'Ajouter un partenaire';
                    
                    // IMPORTANT: Ne PAS faire disparaître le formulaire, juste le réinitialiser
                }
                
                // Afficher un message de succès
                showToast(
                    isUpdate ? 'Partenaire mis à jour avec succès!' : 'Partenaire ajouté avec succès!',
                    'success'
                );
                
                // Recharger la liste des partenaires en arrière-plan
                // (Cela ne fera pas disparaître le formulaire)
                if (window.partnerManager) {
                    await window.partnerManager.loadPartners();
                }
                
                // Mettre à jour les statistiques si la fonction existe
                if (typeof updateStatsCards === 'function') {
                    updateStatsCards();
                }
            } catch (error) {
                console.error("Erreur lors de l'enregistrement du partenaire:", error);
                showToast(`Erreur: ${error.message}`, 'error');
            } finally {
                // Réinitialiser le bouton quoi qu'il arrive
                submitText.style.display = 'inline';
                submitSpinner.style.display = 'none';
                submitButton.disabled = false;
            }
        };
        
        // Supprimer tous les anciens gestionnaires d'événements
        const clonedForm = partnerForm.cloneNode(true);
        partnerForm.parentNode.replaceChild(clonedForm, partnerForm);
        
        // Ajouter le nouveau gestionnaire
        clonedForm.addEventListener('submit', newSubmitHandler);
    }
}



// Initialiser la gestion des partenaires
document.addEventListener('DOMContentLoaded', function() {
    // Créer l'instance du gestionnaire de partenaires
    window.partnerManager = new PartnerManager();
    
    // Initialiser les gestionnaires d'événements du formulaire
    initializePartnerFormHandlers(window.partnerManager);
    
    // Modifier le comportement du formulaire pour qu'il ne disparaisse pas après soumission
    updatePartnerFormSubmitBehavior();
    
    // Charger les partenaires
    window.partnerManager.loadPartners();
});

// Fonction améliorée pour initialiser la prévisualisation d'image
function initializeImagePreview() {
    const partnerImage = document.getElementById('partner-image');
    const partnerImageDrop = document.getElementById('partner-image-drop');
    const partnerImagePreview = document.getElementById('partner-image-preview');
    
    console.log("Initialisation de la prévisualisation d'image:", {
        imageInput: partnerImage,
        dropZone: partnerImageDrop,
        previewContainer: partnerImagePreview
    });
    
    if (partnerImage && partnerImageDrop && partnerImagePreview) {
        // Masquer la prévisualisation au départ
        partnerImagePreview.style.display = 'flex';
        
        // Gestionnaire de changement de fichier
        partnerImage.addEventListener('change', function() {
            console.log("Changement de fichier détecté:", this.files);
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Vérification du type de fichier
                if (!file.type.match(/image.*/)) {
                    Swal.fire({
                        title: 'Format invalide',
                        text: 'Veuillez sélectionner une image valide (JPG, PNG, GIF...)',
                        icon: 'error'
                    });
                    this.value = '';
                    return;
                }
                
                // Vérification de la taille du fichier (max 5 MB)
                if (file.size > 5 * 1024 * 1024) {
                    Swal.fire({
                        title: 'Fichier trop volumineux',
                        text: 'L\'image ne doit pas dépasser 5 MB',
                        icon: 'error'
                    });
                    this.value = '';
                    return;
                }
                
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    console.log("Image chargée, mise à jour de la prévisualisation");
                    partnerImagePreview.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Aperçu de l'image" class="preview-image">
                            <div class="image-preview-remove" id="partner-image-remove">
                                <i class="fas fa-times"></i> Supprimer
                            </div>
                        </div>
                    `;
                    // S'assurer que l'élément est visible
                    partnerImagePreview.style.display = 'block';
                    
                    // Ajouter un gestionnaire pour supprimer l'image
                    const removeButton = document.getElementById('partner-image-remove');
                    if (removeButton) {
                        removeButton.addEventListener('click', function() {
                            partnerImage.value = ''; // Réinitialiser le champ de fichier
                            partnerImagePreview.style.display = 'none';
                            partnerImagePreview.innerHTML = '';
                        });
                    } else {
                        console.error("Bouton de suppression non trouvé");
                    }
                };
                
                reader.onerror = function(error) {
                    console.error("Erreur lors de la lecture du fichier:", error);
                };
                
                // Lire le fichier
                reader.readAsDataURL(file);
            }
        });
        
        // Support pour le drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            partnerImageDrop.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            partnerImageDrop.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            partnerImageDrop.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            partnerImageDrop.classList.add('highlighted');
        }
        
        function unhighlight() {
            partnerImageDrop.classList.remove('highlighted');
        }
        
        // Gestionnaire pour le drop d'images
        partnerImageDrop.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files && files.length) {
                const file = files[0];
                
                // Vérification du type de fichier
                if (!file.type.match(/image.*/)) {
                    Swal.fire({
                        title: 'Format invalide',
                        text: 'Veuillez déposer une image valide (JPG, PNG, GIF...)',
                        icon: 'error'
                    });
                    return;
                }
                
                // Vérification de la taille du fichier (max 5 MB)
                if (file.size > 5 * 1024 * 1024) {
                    Swal.fire({
                        title: 'Fichier trop volumineux',
                        text: 'L\'image ne doit pas dépasser 5 MB',
                        icon: 'error'
                    });
                    return;
                }
                
                // Affecter le fichier au input pour le formulaire
                partnerImage.files = files;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    partnerImagePreview.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Aperçu de l'image" class="preview-image">
                            <div class="image-preview-remove" id="partner-image-remove">
                                <i class="fas fa-times"></i> Supprimer
                            </div>
                        </div>
                    `;
                    partnerImagePreview.style.display = 'block';
                    
                    document.getElementById('partner-image-remove').addEventListener('click', function() {
                        partnerImage.value = '';
                        partnerImagePreview.style.display = 'none';
                        partnerImagePreview.innerHTML = '';
                    });
                };
                
                reader.readAsDataURL(file);
            }
        }
        
        // Clic sur la zone pour ouvrir le sélecteur de fichier
        partnerImageDrop.addEventListener('click', function() {
            partnerImage.click();
        });
        
        // Ajout de styles pour l'aperçu
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            #partner-image-preview {
                margin-top: 15px;
                background-color: #f8f9fa;
                border-radius: 5px;
                padding: 10px;
            }
            .preview-container {
                position: relative;
                display: inline-block;
            }
            .preview-image {
                max-width: 100%;
                max-height: 250px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .image-preview-remove {
                position: absolute;
                top: 10px;
                right: 10px;
                background-color: rgba(255,255,255,0.8);
                color: #dc3545;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }
            .image-preview-remove:hover {
                background-color: #dc3545;
                color: white;
            }
            #partner-image-drop {
                border: 2px dashed #ccc;
                border-radius: 5px;
                padding: 30px;
                text-align: center;
                color: #6c757d;
                transition: all 0.2s;
                cursor: pointer;
            }
            #partner-image-drop.highlighted {
                border-color: #007bff;
                background-color: rgba(0, 123, 255, 0.05);
            }
            #partner-image-drop i {
                font-size: 24px;
                margin-bottom: 10px;
                color: #007bff;
            }
        `;
        document.head.appendChild(styleElement);
    }
}








// Variables globales
let currentSoundPoints = [];

// Fonction pour extraire la valeur d'un objet
function extractValued(obj) {
    return obj.value || obj;
}

// Ajouter un point de son à Firestore
async function addSoundPoint(soundPoint) {
    try {
        if (!soundPoint.name || !soundPoint.gpsCoordinates) {
            throw new Error("Données du point de son manquantes");
        }
        
        const genresArray = (soundPoint.genres || []).map(extractValued);
        const partnersArray = (soundPoint.partners || []).map(extractValued);
        
        const docRef = await addDoc(collection(db, "sound_points"), {
            name: soundPoint.name,
            type: soundPoint.type || "autre",
            genres: genresArray,
            gpsCoordinates: soundPoint.gpsCoordinates,
            partners: partnersArray,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        
        await loadSoundPoints(); // Recharger la liste après ajout
        return docRef.id;
    } catch (error) {
        console.error("Erreur lors de l'ajout du point de son:", error);
        throw error;
    }
}

// Supprimer un point de son de Firestore
async function deleteSoundPoint(id) {
    try {
        await deleteDoc(doc(db, "sound_points", id));
        await loadSoundPoints(); // Recharger la liste après suppression
        showToast("Point de son supprimé avec succès");
    } catch (error) {
        console.error("Erreur lors de la suppression du point de son:", error);
        showToast("Erreur lors de la suppression du point de son", "error");
    }
}

// Voir les détails d'un point de son
function viewSoundPoint(id) {
    const soundPoint = currentSoundPoints.find(point => point.id === id);
    if (!soundPoint) return;
    
    // Créer une boîte de dialogue modale pour afficher les détails
    // Cette fonction est un exemple et devrait être adaptée selon votre système de modales
    showModal('Détails du point de son', `
        <h2>${soundPoint.name}</h2>
        <p><strong>Type:</strong> ${getTypeLabel(soundPoint.type)}</p>
        <p><strong>Genres:</strong> ${soundPoint.genres.join(', ')}</p>
        <p><strong>Coordonnées GPS:</strong> ${soundPoint.gpsCoordinates}</p>
        <p><strong>Description:</strong> ${soundPoint.description}</p>
        ${soundPoint.partners && soundPoint.partners.length > 0 ? 
          `<p><strong>Partenaires:</strong> ${soundPoint.partners.join(', ')}</p>` : ''}
    `);
}

// Obtenir le label lisible pour un type de point de son
function getTypeLabel(type) {
    const typeMap = {
        'soundsystem': 'Sound System',
        'dj': 'DJ Set',
        'live': 'Live',
        'autre': 'Autre'
    };
    return typeMap[type] || type;
}

async function loadSoundPoints() {
    try {
        const soundPointsListElement = document.getElementById('sound-points-list');
        if (!soundPointsListElement) {
            console.error("Élément de liste des points de son introuvable");
            return;
        }
        
        // Vider la liste actuelle
        soundPointsListElement.innerHTML = '';
        currentSoundPoints = [];
        
        // Obtenir les données de Firestore
        const soundPointsSnapshot = await getDocs(query(collection(db, "sound_points"), orderBy("createdAt", "desc")));
        
        if (soundPointsSnapshot.empty) {
            soundPointsListElement.innerHTML = '<tr><td colspan="6" class="text-center">Aucun point de son trouvé</td></tr>';
            return;
        }
        
        // Créer une ligne de tableau pour chaque point de son
        soundPointsSnapshot.forEach(doc => {
            const data = doc.data();
            const soundPoint = {
                id: doc.id,
                ...data
            };
            currentSoundPoints.push(soundPoint);
            
            // Traitement des genres
            const genres = data.genres || [];
            let genresStr = genres.join(', ');
            if (genresStr.length > 30) {
                genresStr = genresStr.substring(0, 27) + '...';
            }
            
            // Traitement des partenaires
            const partners = data.partners || [];
            let partnersStr = partners.join(', ');
            if (partnersStr.length > 30) {
                partnersStr = partnersStr.substring(0, 27) + '...';
            }
            
            // Créer une ligne de tableau
            const row = document.createElement('tr');
            row.setAttribute('data-id', doc.id);
            row.setAttribute('data-collection', 'sound_points');
            row.innerHTML = `
                <td>${data.name}</td>
                <td>${getTypeLabel(data.type)}</td>
                <td><div class="truncate-text">${genresStr}</div></td>
                <td>${data.gpsCoordinates}</td>
                <td><div class="truncate-text">${partnersStr}</div></td>
                <td class="table-actions">
                    
                    <button class="action-delete delete-sound-point" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            soundPointsListElement.appendChild(row);
        });
        
        // Ajouter des écouteurs pour les boutons d'action
        attachActionListeners();
        
    } catch (error) {
        console.error("Erreur lors du chargement des points de son:", error);
    }
}

// Attacher des écouteurs d'événements aux boutons d'action
function attachActionListeners() {
    // Boutons de visualisation
    const viewButtons = document.querySelectorAll('.view-sound-point');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.getAttribute('data-id');
            viewSoundPoint(id);
        });
    });
    
    // Boutons de suppression
    const deleteButtons = document.querySelectorAll('.delete-sound-point');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.getAttribute('data-id');
            if (confirm('Êtes-vous sûr de vouloir supprimer ce point de son ?')) {
                deleteSoundPoint(id);
            }
        });
    });
    
    // Note: Les boutons d'édition nécessiteraient une fonction d'édition supplémentaire
    const editButtons = document.querySelectorAll('.edit-sound-point');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = row.getAttribute('data-id');
            alert('Fonctionnalité d\'édition à implémenter');
            // editSoundPoint(id); // À implémenter
        });
    });
}

// Initialisation du formulaire de point de son
function initSoundPointForm() {
    const soundPointForm = document.getElementById('sound-point-form');
    const soundPointCancelButton = document.getElementById('sound-point-cancel');
    
    // Chargement initial des points de son
    loadSoundPoints();
    
    // Initialisation des sélecteurs multiples pour les genres et partenaires
    initMultiSelect('sound-point-genres', getAllGenres);
    initMultiSelect('sound-point-partners', getAllPartners);
    
    // Gérer la soumission du formulaire
    if (soundPointForm) {
        soundPointForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = document.getElementById('sound-point-submit');
            const submitText = document.getElementById('sound-point-submit-text');
            const submitSpinner = document.getElementById('sound-point-submit-spinner');
            
            if (!submitButton || !submitText || !submitSpinner) {
                console.error("Éléments du bouton de soumission introuvables");
                showToast("Erreur dans le formulaire", "error");
                return;
            }
            
            // Désactiver le bouton et afficher le spinner
            submitButton.disabled = true;
            submitText.style.display = 'none';
            submitSpinner.style.display = 'inline-block';
            
            try {
                // Récupérer les valeurs du formulaire
                const nameInput = document.getElementById('sound-point-name');
                const typeSelect = document.getElementById('sound-point-type');
                const genresInput = document.getElementById('sound-point-genres');
                const gpsInput = document.getElementById('sound-point-gps');
               
                const partnersInput = document.getElementById('sound-point-partners');
                
                if (!nameInput || !typeSelect || !genresInput || !gpsInput) {
                    throw new Error("Éléments de formulaire requis introuvables");
                }
                
                const name = nameInput.value;
                const type = typeSelect.value;
                const genresValue = genresInput.value;
                const genres = genresValue ? JSON.parse(genresValue) : [];
                const gpsCoordinates = gpsInput.value;
        
                const partnersValue = partnersInput ? partnersInput.value : '[]';
                const partners = partnersValue ? JSON.parse(partnersValue) : [];
                
                // Valider les données
                if (!name || !type || genres.length === 0 || !gpsCoordinates ) {
                    showToast("Veuillez remplir tous les champs obligatoires", "error");
                    submitButton.disabled = false;
                    submitText.style.display = 'inline-block';
                    submitSpinner.style.display = 'none';
                    return;
                }
                
                // Créer l'objet du point de son
                const soundPoint = {
                    name,
                    type,
                    genres,
                    gpsCoordinates,
                    partners
                };
                
                // Ajouter à Firestore
                const soundPointId = await addSoundPoint(soundPoint);
                
                // Réinitialiser le formulaire
                soundPointForm.reset();
                
                const genreSelectedElement = document.getElementById('sound-point-genres-selected');
                if (genreSelectedElement) {
                    genreSelectedElement.innerHTML = '';
                }
                
                const partnersSelectedElement = document.getElementById('sound-point-partners-selected');
                if (partnersSelectedElement) {
                    partnersSelectedElement.innerHTML = '';
                }
                
                // Afficher un message de succès
                showToast("Point de son ajouté avec succès");
                
            } catch (error) {
                console.error("Erreur lors de la soumission du formulaire de point de son:", error);
                showToast("Erreur lors de l'ajout du point de son: " + error.message, "error");
            } finally {
                // Réactiver le bouton et masquer le spinner
                submitButton.disabled = false;
                submitText.style.display = 'inline-block';
                submitSpinner.style.display = 'none';
            }
        });
    }
    
    // Gérer le bouton d'annulation
    if (soundPointCancelButton) {
        soundPointCancelButton.addEventListener('click', function() {
            if (soundPointForm) {
                soundPointForm.reset();
                
                const genreSelectedElement = document.getElementById('sound-point-genres-selected');
                if (genreSelectedElement) {
                    genreSelectedElement.innerHTML = '';
                }
                
                const partnersSelectedElement = document.getElementById('sound-point-partners-selected');
                if (partnersSelectedElement) {
                    partnersSelectedElement.innerHTML = '';
                }
            }
        });
    }
}

// Initialiser un sélecteur multiple
function initMultiSelect(id, getOptionsFunc) {
    const input = document.getElementById(`${id}-input`);
    const dropdown = document.getElementById(`${id}-dropdown`);
    const selected = document.getElementById(`${id}-selected`);
    const hiddenInput = document.getElementById(id);
    
    if (!input || !dropdown || !selected || !hiddenInput) {
        console.error(`Éléments pour le multi-select ${id} introuvables`);
        return;
    }
    
    // Initialiser les valeurs sélectionnées
    let selectedItems = [];
    
    // Mettre à jour l'entrée cachée
    function updateHiddenInput() {
        hiddenInput.value = JSON.stringify(selectedItems);
    }
    
    // Rendre les éléments sélectionnés
    function renderSelected() {
        selected.innerHTML = '';
        selectedItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'selected-item';
            itemElement.innerHTML = `
                <span class="selected-item-text">${item.label}</span>
                <span class="selected-item-remove" data-value="${item.value}">
                    <i class="fas fa-times"></i>
                </span>
            `;
            selected.appendChild(itemElement);
        });
        
        // Ajouter des écouteurs pour les boutons de suppression
        const removeButtons = selected.querySelectorAll('.selected-item-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                selectedItems = selectedItems.filter(item => item.value !== value);
                renderSelected();
                updateHiddenInput();
            });
        });
        
        updateHiddenInput();
    }
    
    // Remplir le dropdown avec les options
    async function populateDropdown(query = '') {
        try {
            const options = await getOptionsFunc();
            dropdown.innerHTML = '';
            
            // Filtrer les options selon la requête
            const filteredOptions = options.filter(option => 
                option.label.toLowerCase().includes(query.toLowerCase()) &&
                !selectedItems.some(item => item.value === option.value)
            );
            
            // Afficher les options filtrées
            if (filteredOptions.length > 0) {
                filteredOptions.forEach(option => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'multiselect-option';
                    optionElement.textContent = option.label;
                    optionElement.setAttribute('data-value', option.value);
                    optionElement.setAttribute('data-label', option.label);
                    
                    optionElement.addEventListener('click', function() {
                        const value = this.getAttribute('data-value');
                        const label = this.getAttribute('data-label');
                        
                        // Ajouter à la sélection
                        if (!selectedItems.some(item => item.value === value)) {
                            selectedItems.push({ value, label });
                            renderSelected();
                            input.value = '';
                            dropdown.style.display = 'none';
                        }
                    });
                    
                    dropdown.appendChild(optionElement);
                });
            } else {
                // Option pour ajouter un nouvel élément
                if (query.trim() !== '') {
                    const addOption = document.createElement('div');
                    addOption.className = 'multiselect-option add-option';
                    addOption.innerHTML = `<i class="fas fa-plus"></i> Ajouter "${query}"`;
                    
                    addOption.addEventListener('click', function() {
                        const newValue = query.trim();
                        const newLabel = query.trim();
                        
                        // Ajouter à la sélection
                        if (!selectedItems.some(item => item.value === newValue)) {
                            selectedItems.push({ value: newValue, label: newLabel });
                            renderSelected();
                            input.value = '';
                            dropdown.style.display = 'none';
                        }
                    });
                    
                    dropdown.appendChild(addOption);
                } else {
                    dropdown.innerHTML = '<div class="multiselect-no-results">Aucun résultat</div>';
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
            dropdown.innerHTML = '<div class="multiselect-no-results">Erreur de chargement</div>';
        }
    }
    
    // Écouteurs d'événements
    input.addEventListener('focus', function() {
        populateDropdown(this.value);
        dropdown.style.display = 'block';
    });
    
    input.addEventListener('input', function() {
        populateDropdown(this.value);
        dropdown.style.display = 'block';
    });
    
    // Fermer le dropdown lorsqu'on clique ailleurs
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Initialiser
    renderSelected();
}

function getAllGenres() {
    // Genres par défaut (même si Firestore est vide)
    const defaultGenres = [
        { value: "good-vibes", label: "Good vibes" },
        { value: "chill", label: "Chill" },
        { value: "punchy", label: "Punchy" },
        { value: "survolte", label: "Survolté" }
    ];
    
    try {
        // On peut toujours essayer de récupérer depuis Firestore
        // et fusionner avec nos valeurs par défaut
        const genresSnapshot = getDocs(collection(db, "genres"));
        
        // Si on a des données de Firestore, on les ajoute (asynchrone)
        genresSnapshot.then((snapshot) => {
            snapshot.forEach(doc => {
                const data = doc.data();
                // On évite les doublons (si un genre existe déjà par défaut)
                if (!defaultGenres.some(g => g.value === doc.id)) {
                    defaultGenres.push({
                        value: doc.id,
                        label: data.name || 'Genre sans nom'
                    });
                }
            });
        }).catch(error => {
            console.error("Erreur lors de la récupération des genres:", error);
        });
        
        // On retourne les genres par défaut immédiatement
        return defaultGenres;
    } catch (error) {
        console.error("Erreur lors de la récupération des genres:", error);
        return defaultGenres; // En cas d'erreur, on retourne au moins les genres par défaut
    }
}

async function getAllPartners() {
    try {
        const partnersSnapshot = await getDocs(collection(db, "partners"));
        const partners = [];
        
        partnersSnapshot.forEach(doc => {
            const data = doc.data();
            partners.push({
                value: doc.id,
                label: data.name || 'Partenaire sans nom'
            });
        });
        
        return partners;
    } catch (error) {
        console.error("Erreur lors de la récupération des partenaires:", error);
        return [];
    }
}

// Fonction pour afficher une boîte de dialogue modale (à adapter selon votre système)
function showModal(title, content) {
    // Cette fonction est un exemple et devrait être adaptée à votre système de modales
    alert(`${title}\n\n${content.replace(/<[^>]*>?/gm, '')}`);
}

// Initialiser le formulaire de point de son lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    initSoundPointForm();
});