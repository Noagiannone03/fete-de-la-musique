import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
    
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCwtimDB_Mai-QPyB6d0yqjJX_d5mQjGY8",
        authDomain: "fete-de-la-musique-64a6b.firebaseapp.com",
        projectId: "fete-de-la-musique-64a6b",
        storageBucket: "fete-de-la-musique-64a6b.firebasestorage.app",
        messagingSenderId: "1087878331068",
        appId: "1:1087878331068:web:28719d3278a619cb816eb9",
        measurementId: "G-MW9YYKP1J8"
    };
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);
    
    // Global variables
    let allEvents = [];
    let currentFilters = {
        location: 'all',
        genres: [],
        startTime: '',
        endTime: '',
        locations: []
    };


    let viewMode = 'sound_points'; // 'sound_points' ou 'events'
let selectedSoundPoint = null;
let allSoundPoints = [];
    
    // DOM Elements
    const eventList = document.querySelector('.event-list');
    const tabs = document.querySelectorAll('.tab');
    const filterChips = document.querySelectorAll('.filter-chip');
    const locationChips = document.querySelectorAll('.location-chip');
    const timeSelects = document.querySelectorAll('.time-select');
    const validateButton = document.querySelector('.validate-button');
    const filterButton = document.querySelector('.filter-button');
    const filterOverlay = document.querySelector('.filter-overlay');
    const backToProgram = document.querySelector('.back-to-program');
    
// Fonction améliorée pour formatter le temps avec plus de robustesse
function formatTime(timestamp) {
    if (!timestamp) return '00h00';
    
    // Inspecter la valeur exacte pour le débogage
    console.log('Formatting timestamp:', timestamp, 'Type:', typeof timestamp);
    
    // Handle different types of timestamp formats
    let date;
    
    if (typeof timestamp === 'object') {
        // Si c'est un objet Date
        if (timestamp instanceof Date) {
            date = timestamp;
        }
        // Si c'est un timestamp Firestore (avec seconds et nanoseconds)
        else if (timestamp.seconds !== undefined) {
            date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
        }
        // Si c'est un timestamp avec toDate() (format Firestore)
        else if (typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        }
        // Autre type d'objet - essayer de le traiter comme une date
        else {
            date = new Date(timestamp);
        }
    } 
    else if (typeof timestamp === 'number') {
        // Si c'est un nombre (timestamp Unix)
        date = new Date(timestamp * 1000); // Secondes vers millisecondes
    } 
    else if (typeof timestamp === 'string') {
        // Si c'est une chaîne comme "5 mai 5555 à 05:55:00 UTC+2"
        try {
            // Essayer le parsing standard
            date = new Date(timestamp);
            
            // Si le parsing standard ne fonctionne pas bien, essayer des expressions régulières
            if (isNaN(date.getTime())) {
                // Exemple pour votre format: "5 mai 5555 à 05:55:00 UTC+2"
                const regex = /(\d+)\s+(\w+)\s+(\d+)\s+à\s+(\d+):(\d+):(\d+)\s+UTC([+-]\d+)/;
                const match = timestamp.match(regex);
                
                if (match) {
                    const [, day, month, year, hours, minutes, seconds, timezone] = match;
                    
                    // Convertir le mois en numéro
                    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                                       'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
                    const monthIndex = monthNames.findIndex(m => 
                        month.toLowerCase().includes(m.toLowerCase()));
                    
                    if (monthIndex !== -1) {
                        // Créer la date
                        date = new Date(parseInt(year), monthIndex, parseInt(day), 
                                       parseInt(hours), parseInt(minutes), parseInt(seconds));
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing date string:', e);
            return '00h00';
        }
    }
    
    // Vérifier si la date est valide
    if (!date || isNaN(date.getTime())) {
        console.error('Invalid timestamp after processing:', timestamp);
        return '00h00';
    }
    
    return date.getHours().toString().padStart(2, '0') + 'h' + date.getMinutes().toString().padStart(2, '0');
}
    
    // Function to check if an event is in favorites
    function isEventFavorite(eventId) {
        return getCookie('favorite_event_' + eventId) === 'true';
    }
    
    // Function to toggle favorite status
    function toggleFavorite(eventId, icon) {
        if (isEventFavorite(eventId)) {
            deleteCookie('favorite_event_' + eventId);
            icon.src = '../../assets/pictos/star-card.png';
        } else {
            setCookie('favorite_event_' + eventId, 'true', 30);
            icon.src = '../../assets/pictos/filled-star.png';
        }
    }
    
    // Function to create loading card skeleton
    function createLoadingCard() {
        const card = document.createElement('div');
        card.className = 'event-card loading';
        card.innerHTML = `
            <div class="card-image-container" style="background-color: #eee;">
                <div class="time-tag" style="background-color: #ddd; color: transparent;">00:00-00:00</div>
            </div>
            <div class="card-info">
                <div class="event-title" style="background-color: #eee; height: 20px; width: 70%; margin-bottom: 10px;"></div>
                <div class="event-type" style="background-color: #eee; height: 16px; width: 40%; margin-bottom: 15px;"></div>
                <div class="event-location" style="background-color: #eee; height: 16px; width: 80%; margin-bottom: 10px;"></div>
                <div class="event-style" style="background-color: #eee; height: 16px; width: 60%; margin-bottom: 10px;"></div>
            </div>
        `;
        return card;
    }
    
    // Function to show loading state with shimmer effect
    function showLoading() {
        eventList.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const loadingCard = createLoadingCard();
            eventList.appendChild(loadingCard);
        }
        
        // Add shimmer effect with CSS
        const style = document.createElement('style');
        style.id = 'skeleton-animation';
        style.textContent = `
            @keyframes shimmer {
                0% {
                    background-position: -200% 0;
                }
                100% {
                    background-position: 200% 0;
                }
            }
            
            .event-card.loading .card-image-container,
            .event-card.loading .event-title,
            .event-card.loading .event-type,
            .event-card.loading .event-location,
            .event-card.loading .event-style {
                background: linear-gradient(90deg, #eee 8%, #f5f5f5 18%, #eee 33%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite linear;
            }
        `;
        document.head.appendChild(style);
    }
    
  // Updated createEventCard function with proper time handling
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-location', event.location.toLowerCase().includes('mourillon') ? 'mourillon' : 'centre-ville');
    card.setAttribute('data-id', event.id);
    card.setAttribute('data-genre', event.genre);
    
    // Format start and end time from timestamp
    const startTime = formatTime(event.timestamp.start);
    const endTime = formatTime(event.timestamp.end);
    const timeTag = `${startTime}-${endTime}`;
    
    // Set favorite icon based on cookie
    const favoriteIconSrc = isEventFavorite(event.id) ? 
        '../../assets/pictos/filled-star.png' : 
        '../../assets/pictos/star-card.png';
    
    card.innerHTML = `
        <div class="card-image-container">
            <img src="${event.imageUrl}" alt="${event.title}" class="card-image">
            <div class="time-tag">${timeTag}</div>
        </div>
        <div class="card-info">
            <h3 class="event-title">${event.title}</h3>
            <p class="event-type">${event.subtitle}</p>
            <div class="event-location">
                <img src="../../assets/pictos/pinMap.png" alt="Location" class="info-icon">
                <span>${event.location}</span>
            </div>
            <div class="event-style">
                <img src="../../assets/pictos/MusicNoteBeamed.png" alt="Music" class="info-icon">
                <span>${event.genre}</span>
            </div>
            <img src="${favoriteIconSrc}" alt="Favorite" class="favorite-icon" data-id="${event.id}">
            <img src="../../assets/buttons/plus-info.png" alt="Plus d'infos" class="info-btn" data-id="${event.id}">
        </div>
    `;
    
    // Add event listener for favorite icon
    card.querySelector('.favorite-icon').addEventListener('click', function(e) {
        e.stopPropagation(); // Empêche la propagation du clic vers la carte
        toggleFavorite(event.id, this);
    });
    
    // Add event listener for the entire card
    card.addEventListener('click', function(e) {
        // Ne pas déclencher si on clique sur l'icône de favori
        if (!e.target.closest('.favorite-icon')) {
            showEventDetails(event);
        }
    });
    
    return card;
}

// Updated showEventDetails function with skeleton loader
async function showEventDetails(event) {
    console.log('Données de l\'événement reçu :', event);
    
    // Create a modal or overlay for event details
    const detailsOverlay = document.createElement('div');
    detailsOverlay.className = 'event-details-overlay';
    
    // Set the favorite icon based on cookie
    const favoriteIconSrc = isEventFavorite(event.id) ? 
        '../../assets/pictos/filled-star.png' : 
        '../../assets/pictos/star-card.png';
    
    // Format start and end time from timestamp
    const startTime = formatTime(event.timestamp.start);
    const endTime = formatTime(event.timestamp.end);
    const timeTag = `${startTime}-${endTime}`;
    
    // Add skeleton animation styles dynamically
    const skeletonStyle = document.createElement('style');
    skeletonStyle.id = 'details-skeleton-animation';
    skeletonStyle.textContent = `
        @keyframes skeleton-loading {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
        }

                 /* Conteneur carré : garde toujours un ratio 1/1 */
    .details-image-container {
      width: 100%;            /* ou une valeur fixe, ex. 300px */
      aspect-ratio: 1 / 1;    /* force le carré */
      overflow: hidden;       /* découpe ce qui dépasse */
    }

    /* L'image remplit le conteneur en conservant son ratio */
    .details-image {
      width: 100%;
      height: 100%;
      object-fit: cover;      /* cover pour remplir tout en recadrant */
      object-position: center;/* centre l'image */
      display: block;
    }
 
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200px 100%;
            animation: skeleton-loading 1.5s infinite linear;
            border-radius: 4px;
            height: 20px;
            margin-bottom: 10px;
        }
        .skeleton-partner {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            margin: 10px;
        }
        .skeleton-text-short {
            width: 40%;
        }
        .skeleton-text-medium {
            width: 60%;
        }
        .skeleton-text-long {
            width: 90%;
        }
    `;
    document.head.appendChild(skeletonStyle);
    
    detailsOverlay.innerHTML = `
        <div class="event-details-container">
            <div class="details-header">
                <div class="details-image-container">
                    <img src="${event.imageUrl}" alt="${event.title}" class="details-image">
                    <button class="close-details">×</button>
                </div>
                
                <div class="details-title-section">
                    <div class="details-title-left">
                        <h2 class="details-title">${event.title}</h2>
                        <p class="details-subtitle">${event.subtitle}</p>
                    </div>
                    <div class="details-title-right">
                        <img src="${favoriteIconSrc}" alt="Favorite" class="details-favorite-icon" data-id="${event.id}">
                    </div>
                </div>
                
                <div class="details-description">
                    <p>${event.description}</p>
                </div>
                
                ${event.plusUrl ? `
                <div class="details-more-button">
                    <a href="${event.plusUrl}" target="_blank">
                        <img src="../../assets/buttons/savoirplusmarron.png" alt="En savoir plus">
                    </a>
                </div>` : ''}
                
                <div class="details-info-section">
                    <div class="details-info-item">
                        <img src="../../assets/pictos/Clock.png" alt="Time" class="info-icon">
                        <span>${timeTag}</span>
                        <span class="details-separator">/</span>
                        <img src="../../assets/pictos/PinMapmarron.png" alt="Location" class="info-icon">
                        <span>${event.location}</span>
                    </div>
                    
                    <div class="details-map-button">
                        <a href="${event.locationUrl}" target="_blank">
                            <img src="../../assets/buttons/syrendre.png" alt="Comment s'y rendre">
                        </a>
                    </div>
                </div>
                
                <div class="details-partners">
                    <h3>PARTENAIRES</h3>
                    <div class="partners-grid" id="partners-grid">
                        <!-- Skeleton loaders for partners -->
                        <div class="skeleton skeleton-partner"></div>
                        <div class="skeleton skeleton-partner"></div>
                        
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(detailsOverlay);
    
    // Add history state to handle back button
    history.pushState({overlay: 'event-details'}, '');
    
    // Animate the overlay
    setTimeout(() => {
        detailsOverlay.classList.add('active');
        document.body.classList.add('body-no-scroll');
    }, 10);
    
    // Add event listeners
    detailsOverlay.querySelector('.close-details').addEventListener('click', () => {
        detailsOverlay.classList.remove('active');
        document.body.classList.remove('body-no-scroll');
        setTimeout(() => {
            detailsOverlay.remove();
            // Remove skeleton styles
            const skeletonStyle = document.getElementById('details-skeleton-animation');
            if (skeletonStyle) skeletonStyle.remove();
            // Remove history state to avoid double-back
            history.back();
        }, 300);
    });
    
    // Add to favorites button
    const favIcon = detailsOverlay.querySelector('.details-favorite-icon');
    favIcon.addEventListener('click', () => {
        const isFav = isEventFavorite(event.id);
        const favIcons = document.querySelectorAll(`.favorite-icon[data-id="${event.id}"]`);
        
        // Toggle the cookie
        toggleFavorite(event.id, favIcon);
        
        // Update other instances of the same favorite icon
        favIcons.forEach(icon => {
            icon.src = isFav ? '../../assets/pictos/star-card.png' : '../../assets/pictos/filled-star.png';
        });
    });
    
    // Fetch partners based on location from sound_points collection
    fetchPartnersForEvent(event.location, detailsOverlay);
}


// New function to fetch partners for the event
async function fetchPartnersForEvent(locationName, detailsOverlay) {
    try {
        // Step 1: Find the sound_point with the matching name
        const soundPointsCol = collection(db, "sound_points");
        const soundPointsSnapshot = await getDocs(soundPointsCol);
        
        let soundPointWithPartners = null;
        
        soundPointsSnapshot.forEach((doc) => {
            const soundPointData = doc.data();
            // Check if name matches the event location
            if (soundPointData.name && 
                soundPointData.name.toLowerCase() === locationName.toLowerCase()) {
                soundPointWithPartners = soundPointData;
            }
        });
        
        if (!soundPointWithPartners || !soundPointWithPartners.partners || 
            !Array.isArray(soundPointWithPartners.partners) || 
            soundPointWithPartners.partners.length === 0) {
            // No partners found
            updatePartnersGrid(detailsOverlay, []);
            return;
        }
        
        // Step 2: Get all partners from the partners collection based on IDs
        const partnerPromises = soundPointWithPartners.partners.map(async (partnerId) => {
            try {
                const partnerDoc = await getDoc(doc(db, "partners", partnerId));
                if (partnerDoc.exists()) {
                    return {
                        id: partnerId,
                        ...partnerDoc.data()
                    };
                }
                return null;
            } catch (error) {
                console.error(`Error fetching partner ${partnerId}:`, error);
                return null;
            }
        });
        
        const partners = (await Promise.all(partnerPromises)).filter(partner => partner !== null);
        
        // Update the partners grid with fetched partners
        updatePartnersGrid(detailsOverlay, partners);
        
    } catch (error) {
        console.error("Error fetching partners:", error);
        updatePartnersGrid(detailsOverlay, []);
    }
}
   


// Updated function to update partners grid in the details overlay
function updatePartnersGrid(detailsOverlay, partners) {
    const partnersGrid = detailsOverlay.querySelector('#partners-grid');
    
    if (!partnersGrid) return;
    
    if (partners.length === 0) {
        partnersGrid.innerHTML = '<p>Aucun partenaire</p>';
        return;
    }
    
    // Create HTML for partners
    const partnersHtml = partners.map(partner => `
        <div class="partner-logo-container" data-partner-id="${partner.id}">
            <img src="${partner.imageUrl}" alt="${partner.name || 'Partenaire'}" class="partner-logo">
        </div>
    `).join('');
    
    partnersGrid.innerHTML = partnersHtml;
    
    // Add event listeners to partner logos
    const partnerLogos = partnersGrid.querySelectorAll('.partner-logo-container');
    partnerLogos.forEach(logo => {
        const partnerId = logo.getAttribute('data-partner-id');
        logo.addEventListener('click', () => {
            showPartnerDetails(partnerId, detailsOverlay);
        });
    });
}
// Modify fetchEvents function to also fetch sound points
async function fetchEvents() {
    showLoading(); // Show loading state
    
    const startTime = Date.now();
    
    try {
        // Fetch sound points first
        const soundPointsCol = collection(db, "sound_points");
        const soundPointsSnapshot = await getDocs(soundPointsCol);
        
        allSoundPoints = [];
        soundPointsSnapshot.forEach((doc) => {
            const soundPointData = doc.data();
            const soundPoint = {
                id: doc.id,
                name: soundPointData.name || 'Point de son sans nom',
                type: soundPointData.type || '',
                imageUrl: soundPointData.imageUrl || '../../assets/default-location.jpg',
                section_toulon: soundPointData.section_toulon || '',
                genres: soundPointData.genres || []
            };
            allSoundPoints.push(soundPoint);
        });
        
        console.log('Loaded sound points:', allSoundPoints.length);
        
        // Then fetch events
        const eventsCol = collection(db, "events");
        const eventSnapshot = await getDocs(eventsCol);
        
        // Process each document
        allEvents = [];
        eventSnapshot.forEach((doc) => {
            const eventData = doc.data();
            
            // Inspecter la structure complète des données pour identifier où sont stockés les timestamps
            console.log('Event data structure:', JSON.stringify(eventData, null, 2));
            
            // Extraire les timestamps, en cherchant à plusieurs endroits possibles
            let startTimestamp = null;
            let endTimestamp = null;
            
            // Vérifier toutes les possibilités de structure de données
            if (eventData.timestamp) {
                // Si c'est dans un objet timestamp
                if (eventData.timestamp.start) startTimestamp = eventData.timestamp.start;
                if (eventData.timestamp.end) endTimestamp = eventData.timestamp.end;
            }
            
            // Vérifier les champs spécifiques
            if (eventData.timestamp_start) startTimestamp = eventData.timestamp_start;
            if (eventData.timestamp_end) endTimestamp = eventData.timestamp_end;
            
            // Vérifier les champs startDate et endDate comme mentionnés dans votre message
            if (eventData.startDate) startTimestamp = eventData.startDate;
            if (eventData.endDate) endTimestamp = eventData.endDate;
            
            // Si d'autres champs pourraient contenir des dates
            if (eventData.start) startTimestamp = eventData.start;
            if (eventData.end) endTimestamp = eventData.end;
            
            // Si on a un startTime/endTime séparément
            if (eventData.startTime) startTimestamp = eventData.startTime;
            if (eventData.endTime) endTimestamp = eventData.endTime;
            
            const event = {
                id: doc.id,
                title: eventData.title || 'Événement sans titre',
                subtitle: eventData.subtitle || '',
                imageUrl: eventData.imageUrl || 'assets/default-event.jpg',
                location: eventData.location || 'Lieu non spécifié',
                genre: eventData.genre || 'Genre non spécifié',
                timestamp: {
                    start: startTimestamp || 0,
                    end: endTimestamp || 0
                },
                locationUrl: eventData.locationUrl || '',
                description: eventData.description || 'Aucune description disponible',
                plusUrl: eventData.plusUrl || '',
                partners: eventData.partners || []
            };
            
            allEvents.push(event);
        });
        
        console.log('Loaded events:', allEvents.length);
        
        // Ensure skeleton loader stays visible for at least 1 second
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        
        setTimeout(() => {
            // Remove skeleton animation style
            const skeletonStyle = document.getElementById('skeleton-animation');
            if (skeletonStyle) skeletonStyle.remove();
            
            // Clear loading state
            eventList.innerHTML = '';
            
            // Initially show sound points view
            if (viewMode === 'sound_points') {
                // Hide filter button initially
                const filterButtonContainer = document.querySelector('.filter-button-container');
                if (filterButtonContainer) {
                    filterButtonContainer.style.display = 'none';
                }
                filterSoundPointsByTab();
            } else {
                // Apply filters to events if in events view
                applyFilters();
            }
        }, remainingTime);
        
    } catch (error) {
        console.error("Error fetching data:", error);
        
        // Show error after at least 1 second to avoid flickering
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 600 - elapsedTime);
        
        setTimeout(() => {
            eventList.innerHTML = '<p style="color: #734432; text-align: center; padding: 20px;">Erreur lors du chargement des données. Veuillez réessayer.</p>';
        }, remainingTime);
    }
}


// Fonction pour le débogage - à ajouter pour voir la structure exacte de vos timestamps
function debugEventTimestamps() {
    console.log('Debugging all events timestamps:');
    if (allEvents && allEvents.length > 0) {
        allEvents.forEach((event, index) => {
            console.log(`Event ${index + 1}: ${event.title}`);
            console.log('  Start timestamp:', event.timestamp.start);
            console.log('  Start formatted:', formatTime(event.timestamp.start));
            console.log('  End timestamp:', event.timestamp.end);
            console.log('  End formatted:', formatTime(event.timestamp.end));
            console.log('---');
        });
    } else {
        console.log('No events loaded yet');
    }
}
    

// Correction de la fonction applyFilters pour gérer les genres comme tableau ou chaîne
function applyFilters() {
    console.log("Début de applyFilters");
    
    // Create a copy of all events
    let filteredEvents = [...allEvents];
    console.log(`Nombre total d'événements: ${filteredEvents.length}`);
    
    // If in sound point view, filter events by selected sound point
    if (viewMode === 'events' && selectedSoundPoint) {
        filteredEvents = filteredEvents.filter(event => 
            event.location && selectedSoundPoint && event.location.toLowerCase() === selectedSoundPoint.name.toLowerCase()
        );
        console.log(`Après filtre du point sonore: ${filteredEvents.length} événements`);
    } 
    // Otherwise apply location tab filter
    else if (currentFilters.location !== 'all') {
        console.log("Filtrage par lieu:", currentFilters.location);
        
        filteredEvents = filteredEvents.filter(event => {
            if (!event.section_toulon) {
                console.log("Événement sans section:", event);
                return false;
            }
            
            // Normaliser les noms de sections pour la comparaison
            const eventSection = event.section_toulon.toLowerCase();
            const filterSection = currentFilters.location.toLowerCase();
            
            // Pour centreville, chercher "centreville"
            if (filterSection === 'centreville') {
                return eventSection === 'centreville';
            }
            
            // Pour mourillon, chercher "mourillon"
            if (filterSection === 'mourillon') {
                return eventSection === 'mourillon';
            }
            
            return false;
        });
        console.log(`Après filtre de lieu: ${filteredEvents.length} événements`);
    }
    
    // Apply genre filter - modified to handle both array and string genres
    if (currentFilters.genres && currentFilters.genres.length > 0) {
        console.log("Filtres de genre sélectionnés:", currentFilters.genres);
        
        filteredEvents = filteredEvents.filter(event => {
            // Vérifier si event.genre existe
            if (!event.genre) {
                console.log(`Événement sans genre: ${event.title || 'sans titre'}`);
                return false;
            }
            
            // Convertir en tableau si c'est une chaîne de caractères
            let eventGenres;
            
            if (Array.isArray(event.genre)) {
                // Si genre est déjà un tableau
                eventGenres = event.genre.map(g => 
                    typeof g === 'string' ? g.trim().toLowerCase() : String(g).toLowerCase()
                );
            } else if (typeof event.genre === 'string') {
                // Si genre est une chaîne de caractères, la diviser par virgules
                eventGenres = event.genre.split(',').map(g => g.trim().toLowerCase());
            } else {
                // Si genre est d'un autre type (comme un objet), le convertir en chaîne
                eventGenres = [String(event.genre).toLowerCase()];
            }
            
            console.log(`Événement "${event.title || 'sans titre'}" a les genres:`, eventGenres);
            
            // Vérifie qu'au moins un des genres sélectionnés correspond à un des genres de l'événement
            const matchesFilter = currentFilters.genres.some(filterGenre => 
                eventGenres.some(eventGenre => 
                    eventGenre.includes(filterGenre.toLowerCase())
                )
            );
            
            console.log(`Événement "${event.title || 'sans titre'}" match les filtres de genre:`, matchesFilter);
            return matchesFilter;
        });
        
        console.log(`Après filtre de genre: ${filteredEvents.length} événements`);
    }
    
    // Apply specific locations filter
    if (currentFilters.locations && currentFilters.locations.length > 0) {
        filteredEvents = filteredEvents.filter(event => {
            return event.location && currentFilters.locations.some(location => 
                event.location.toLowerCase().includes(location.toLowerCase())
            );
        });
        console.log(`Après filtre de lieux spécifiques: ${filteredEvents.length} événements`);
    }
    
    // Apply time filter - improved to handle string date formats
    if (currentFilters.startTime) {
        const [startHours, startMinutes] = currentFilters.startTime.split(':').map(Number);
        const startTimeMinutes = startHours * 60 + startMinutes;
        
        console.log(`Filtre heure de début: ${startHours}:${startMinutes} (${startTimeMinutes} minutes)`);
        
        filteredEvents = filteredEvents.filter(event => {
            if (!event.timestamp || !event.timestamp.start) {
                console.log(`Événement sans heure de début: ${event.title || 'sans titre'}`);
                return true; // Skip if no start time
            }
            
            // Gestion améliorée des formats de date
            let eventStartDate;
            
            if (typeof event.timestamp.start === 'object' && event.timestamp.start.seconds) {
                // Format Firebase Timestamp
                eventStartDate = new Date(event.timestamp.start.seconds * 1000);
            } else if (typeof event.timestamp.start === 'number') {
                // Format timestamp numérique
                eventStartDate = new Date(event.timestamp.start * 1000);
            } else if (typeof event.timestamp.start === 'string') {
                // Format date en chaîne de caractères (comme "11 novembre 2222 à 21:22:00 UTC+1")
                try {
                    // Tentative de parsing du format français
                    const dateMatch = event.timestamp.start.match(/(\d+)\s+(\w+)\s+(\d+)\s+à\s+(\d+):(\d+):(\d+)/);
                    if (dateMatch) {
                        const [_, day, month, year, hours, minutes, seconds] = dateMatch;
                        const monthMap = {
                            'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                            'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
                        };
                        
                        const monthIndex = monthMap[month.toLowerCase()];
                        if (monthIndex !== undefined) {
                            eventStartDate = new Date(year, monthIndex, day, hours, minutes, seconds);
                        } else {
                            // Parsing standard si le mois n'est pas reconnu
                            eventStartDate = new Date(event.timestamp.start);
                        }
                    } else {
                        // Tentative de parsing standard
                        eventStartDate = new Date(event.timestamp.start);
                    }
                } catch (e) {
                    console.error(`Erreur de parsing de date: ${event.timestamp.start}`, e);
                    return true; // Skip if parsing fails
                }
            } else {
                console.log(`Format de date non reconnu: ${typeof event.timestamp.start}`);
                return true; // Skip if invalid timestamp
            }
            
            if (!(eventStartDate instanceof Date) || isNaN(eventStartDate)) {
                console.log(`Date invalide: ${event.timestamp.start}`);
                return true; // Skip if invalid date
            }
            
            const eventStartMinutes = eventStartDate.getHours() * 60 + eventStartDate.getMinutes();
            const passes = eventStartMinutes >= startTimeMinutes;
            
            console.log(`Événement "${event.title || 'sans titre'}" commence à ${eventStartDate.getHours()}:${eventStartDate.getMinutes()} (${eventStartMinutes} minutes) - passe le filtre d'heure de début: ${passes}`);
            
            return passes;
        });
        
        console.log(`Après filtre d'heure de début: ${filteredEvents.length} événements`);
    }
    
    if (currentFilters.endTime) {
        const [endHours, endMinutes] = currentFilters.endTime.split(':').map(Number);
        const endTimeMinutes = endHours * 60 + endMinutes;
        
        console.log(`Filtre heure de fin: ${endHours}:${endMinutes} (${endTimeMinutes} minutes)`);
        
        filteredEvents = filteredEvents.filter(event => {
            if (!event.timestamp || !event.timestamp.end) {
                console.log(`Événement sans heure de fin: ${event.title || 'sans titre'}`);
                return true; // Skip if no end time
            }
            
            // Gestion améliorée des formats de date
            let eventEndDate;
            
            if (typeof event.timestamp.end === 'object' && event.timestamp.end.seconds) {
                // Format Firebase Timestamp
                eventEndDate = new Date(event.timestamp.end.seconds * 1000);
            } else if (typeof event.timestamp.end === 'number') {
                // Format timestamp numérique
                eventEndDate = new Date(event.timestamp.end * 1000);
            } else if (typeof event.timestamp.end === 'string') {
                // Format date en chaîne de caractères (comme "5 mai 5555 à 03:05:00 UTC+2")
                try {
                    // Tentative de parsing du format français
                    const dateMatch = event.timestamp.end.match(/(\d+)\s+(\w+)\s+(\d+)\s+à\s+(\d+):(\d+):(\d+)/);
                    if (dateMatch) {
                        const [_, day, month, year, hours, minutes, seconds] = dateMatch;
                        const monthMap = {
                            'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                            'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
                        };
                        
                        const monthIndex = monthMap[month.toLowerCase()];
                        if (monthIndex !== undefined) {
                            eventEndDate = new Date(year, monthIndex, day, hours, minutes, seconds);
                        } else {
                            // Parsing standard si le mois n'est pas reconnu
                            eventEndDate = new Date(event.timestamp.end);
                        }
                    } else {
                        // Tentative de parsing standard
                        eventEndDate = new Date(event.timestamp.end);
                    }
                } catch (e) {
                    console.error(`Erreur de parsing de date: ${event.timestamp.end}`, e);
                    return true; // Skip if parsing fails
                }
            } else {
                console.log(`Format de date non reconnu: ${typeof event.timestamp.end}`);
                return true; // Skip if invalid timestamp
            }
            
            if (!(eventEndDate instanceof Date) || isNaN(eventEndDate)) {
                console.log(`Date invalide: ${event.timestamp.end}`);
                return true; // Skip if invalid date
            }
            
            const eventEndMinutes = eventEndDate.getHours() * 60 + eventEndDate.getMinutes();
            const passes = eventEndMinutes <= endTimeMinutes;
            
            console.log(`Événement "${event.title || 'sans titre'}" finit à ${eventEndDate.getHours()}:${eventEndDate.getMinutes()} (${eventEndMinutes} minutes) - passe le filtre d'heure de fin: ${passes}`);
            
            return passes;
        });
        
        console.log(`Après filtre d'heure de fin: ${filteredEvents.length} événements`);
    }
    
    // Sort events by start time
    filteredEvents.sort((a, b) => {
        if (!a.timestamp || !a.timestamp.start) return 1; // Place events without start time at the end
        if (!b.timestamp || !b.timestamp.start) return -1;
        
        let startA, startB;
        
        if (typeof a.timestamp.start === 'object' && a.timestamp.start.seconds) {
            startA = a.timestamp.start.seconds;
        } else if (typeof a.timestamp.start === 'number') {
            startA = a.timestamp.start;
        } else if (typeof a.timestamp.start === 'string') {
            // Tentative de conversion en Date puis en timestamp
            startA = new Date(a.timestamp.start).getTime() / 1000;
        }
        
        if (typeof b.timestamp.start === 'object' && b.timestamp.start.seconds) {
            startB = b.timestamp.start.seconds;
        } else if (typeof b.timestamp.start === 'number') {
            startB = b.timestamp.start;
        } else if (typeof b.timestamp.start === 'string') {
            // Tentative de conversion en Date puis en timestamp
            startB = new Date(b.timestamp.start).getTime() / 1000;
        }
        
        return startA - startB;
    });
    
    // Debug pour voir les événements filtrés
    console.log('Filtres appliqués:', currentFilters);
    console.log('Nombre d\'événements après filtrage:', filteredEvents.length);
    
    // Update the display
    updateEventList(filteredEvents);
}
    
    // Function to update event list
    function updateEventList(events) {
        eventList.innerHTML = '';
        
        if (events.length === 0) {
            eventList.innerHTML = '<p style="color: #734432; text-align: center; padding: 20px;">Aucun événement ne correspond à vos critères de recherche.</p>';
            return;
        }
        
        events.forEach(event => {
            const card = createEventCard(event);
            eventList.appendChild(card);
        });
    }
    
    // Cookie functions
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        document.cookie = cookieString;
    }
    
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    function deleteCookie(name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    }
    
    // Favorites functionality
    function loadFavorites() {
        const favoritesOverlay = document.querySelector('.favorites-overlay');
        
        // Vérifier s'il y a un overlay de détails d'événement ouvert
        const eventDetailsOverlay = document.querySelector('.event-details-overlay.active');
        const menuOverlay = document.querySelector('.menu-overlay.active');
        
        // Fermer les overlays existants avant d'ouvrir les favoris
        if (eventDetailsOverlay) {
            eventDetailsOverlay.classList.remove('active');
            setTimeout(() => {
                eventDetailsOverlay.remove();
            }, 300);
        }
        
        if (menuOverlay) {
            const menuIcon = document.querySelector('.menu-icon');
            if (menuIcon) {
                menuIcon.classList.remove('active');
            }
            menuOverlay.classList.remove('active');
        }
        
        // Si l'overlay des favoris est déjà ouvert, ne pas le rouvrir
        if (favoritesOverlay.classList.contains('active')) {
            return;
        }
        
        // Vider le contenu et afficher le loader
        favoritesOverlay.innerHTML = `
            <div class="favorites-loading" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                z-index: 1000;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #734432;
                    border-radius: 50%;
                    animation: favoritesSpinner 1s linear infinite;
                "></div>
                <p style="
                    margin-top: 20px;
                    color: #734432;
                    font-family: 'inter-medium', sans-serif;
                    font-size: 16px;
                ">Chargement de vos favoris...</p>
            </div>
            <style>
                @keyframes favoritesSpinner {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        // Attendre un délai pour s'assurer que les données sont chargées
        setTimeout(() => {
            // Filter events that are in favorites
            const favoriteEvents = allEvents.filter(event => isEventFavorite(event.id));
            
            // Supprimer le loader
            const loader = favoritesOverlay.querySelector('.favorites-loading');
            if (loader) {
                loader.remove();
            }
            
            // Vider complètement l'overlay
            favoritesOverlay.innerHTML = '';
            
            if (favoriteEvents.length === 0) {
                // Show empty state
                favoritesOverlay.innerHTML = `
                    <div class="favorites-empty">
                        <img src="../../assets/headline/programmation-outline.png" alt="Icône favoris" id="favorites-icon">
                        <h3>Vous n'avez pas encore sélectionné de programme favoris</h3>
                        <img src="../../assets/pictos/material-symbols_stars-outline.png" alt="Icône programme" id="program-icon">
                        <h3>Rendez-vous sur la programmation pour faire votre choix</h3>
                        <img src="../../assets/buttons/programmation-button.png" alt="Aller à la programmation" class="action-img" id="go-to-program">
                    </div>
                `;
                
                // Add event listener for "go to program" button
                document.getElementById('go-to-program').addEventListener('click', () => {
                    favoritesOverlay.classList.remove('active');
                    document.body.classList.remove('body-no-scroll');
                });
            } else {
                // Create header for favorites overlay
                const favHeader = document.createElement('div');
                favHeader.className = 'favorites-header';
                favHeader.style.width = '100%';
                favHeader.style.padding = '10px 15px';
                favHeader.innerHTML = `
                    <a href="#" class="back-to-program favorites-back-btn" id="back-from-favorites">← Retour vers la programmation</a>
                    <img src="../../assets/headline/favoris.png" alt="Mes Favoris" style="width: 70%;
      max-width: 300px; margin: 20px auto; display: block;">
                `;
                favoritesOverlay.appendChild(favHeader);
                
                // Create container for favorite events
                const favoriteContainer = document.createElement('div');
                favoriteContainer.className = 'favorites-container event-list';
                favoriteContainer.style.padding = '0 15px';
                
                // Add each favorite event
                favoriteEvents.forEach(event => {
                    const card = createEventCard(event);
                    favoriteContainer.appendChild(card);
                    
                    // Add special handling for favorite removal with animation
                    const favoriteIcon = card.querySelector('.favorite-icon');
                    if (favoriteIcon) {
                        // Remplacer l'event listener existant
                        favoriteIcon.replaceWith(favoriteIcon.cloneNode(true));
                        const newIcon = card.querySelector('.favorite-icon');
                        
                        newIcon.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const wasRemoved = !isEventFavorite(event.id);
                            toggleFavorite(event.id, this);
                            
                            // Si l'événement est supprimé des favoris, retirer la carte avec animation
                            if (!isEventFavorite(event.id)) {
                                card.style.animation = 'fadeOut 0.3s forwards';
                                setTimeout(() => {
                                    card.remove();
                                    // Si plus de favoris, recharger pour afficher l'état vide
                                    if (favoriteContainer.children.length === 0) {
                                        loadFavorites();
                                    }
                                }, 300);
                            }
                        });
                    }
                    
                    // Add special handling for opening event details from favorites
                    const infoBtn = card.querySelector('.info-btn');
                    if (infoBtn) {
                        infoBtn.replaceWith(infoBtn.cloneNode(true));
                        const newInfoBtn = card.querySelector('.info-btn');
                        
                        newInfoBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            // Ouvrir les détails d'événement
                            showEventDetails(event);
                            // Fermer l'overlay des favoris après un court délai
                            setTimeout(() => {
                                favoritesOverlay.classList.remove('active');
                                // Ne pas enlever body-no-scroll car les détails sont ouverts
                            }, 200);
                        });
                    }
                    
                    // Add handling for clicking on the entire card
                    card.addEventListener('click', function(e) {
                        // Vérifier qu'on ne clique pas sur les icônes
                        if (!e.target.closest('.favorite-icon') && !e.target.closest('.info-btn')) {
                            // Ouvrir les détails d'événement
                            showEventDetails(event);
                            // Fermer l'overlay des favoris après un court délai
                            setTimeout(() => {
                                favoritesOverlay.classList.remove('active');
                                // Ne pas enlever body-no-scroll car les détails sont ouverts
                            }, 200);
                        }
                    });
                });
                
                favoritesOverlay.appendChild(favoriteContainer);
                
                // Add event listener for back button
                document.getElementById('back-from-favorites').addEventListener('click', (e) => {
                    e.preventDefault();
                    favoritesOverlay.classList.remove('active');
                    document.body.classList.remove('body-no-scroll');
                });
            }
        }, 300);
    }
    
    // Document ready function
    document.addEventListener('DOMContentLoaded', () => {
        // Fetch events when page loads
        fetchEvents();
        
        // Tab navigation
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Transformer 'centre-ville' en 'centreville' pour la correspondance
                let filterValue = tab.getAttribute('data-filter');
                if (filterValue === 'centre-ville') {
                    filterValue = 'centreville';
                }
                
                currentFilters.location = filterValue;
                applyFilters();
            });
        });
        
        // Menu toggle
        const menuIcon = document.querySelector('.menu-icon');
        const menuOverlay = document.querySelector('.menu-overlay');
        
        if (menuIcon && menuOverlay) {
            menuIcon.addEventListener('click', () => {
                menuOverlay.classList.toggle('active');
            });
        }
        
        // Favorites toggle
        const favoritesBtn = document.querySelector('.favorites-btn');
        const favoritesOverlay = document.querySelector('.favorites-overlay');
        
        if (favoritesBtn && favoritesOverlay) {
            favoritesBtn.addEventListener('click', () => {
                loadFavorites();
                favoritesOverlay.classList.toggle('active');
                if (favoritesOverlay.classList.contains('active')) {
                    document.body.classList.add('body-no-scroll');
                } else {
                    document.body.classList.remove('body-no-scroll');
                }
            });
        }
        
        // Filter button
        if (filterButton && filterOverlay && backToProgram) {
            filterButton.addEventListener('click', () => {
                filterOverlay.classList.add('active');
            });
            
            backToProgram.addEventListener('click', (e) => {
                e.preventDefault();
                filterOverlay.classList.remove('active');
            });
        }
        
        // Genre filter chips
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
            });
        });
        
        // Location filter chips
        locationChips.forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
            });
        });
        
        // Validate button for filters
        if (validateButton) {
            validateButton.addEventListener('click', () => {
                // Collect selected genres
                currentFilters.genres = Array.from(document.querySelectorAll('.filter-chip.active'))
                    .map(chip => chip.getAttribute('data-filter'));
                
                // Collect selected locations
                currentFilters.locations = Array.from(document.querySelectorAll('.location-chip.active'))
                    .map(chip => chip.textContent.trim().split('(')[0].trim());
                
                // Collect time range
                if (timeSelects && timeSelects.length >= 2) {
                    currentFilters.startTime = timeSelects[0].value;
                    currentFilters.endTime = timeSelects[1].value;
                }
                
                // Apply filters
                applyFilters();
                
                // Close filter overlay
                filterOverlay.classList.remove('active');
            });
        }
        
        // Handle history navigation (back button)
        window.addEventListener('popstate', () => {
            // Close any open overlays
            const overlays = document.querySelectorAll('.favorites-overlay, .filter-overlay, .event-details-overlay');
            overlays.forEach(overlay => {
                if (overlay.classList.contains('active')) {
                    overlay.classList.remove('active');
                    if (overlay.classList.contains('event-details-overlay')) {
                        setTimeout(() => overlay.remove(), 300);
                    }
                }
            });
            // Remove body scroll lock
            document.body.classList.remove('body-no-scroll');
        });
    });







// Modify the createSoundPointCard function to match the new design
function createSoundPointCard(soundPoint) {
    const card = document.createElement('div');
    card.className = 'sound-point-card';
    card.setAttribute('data-section', soundPoint.section_toulon || '');
    card.setAttribute('data-name', soundPoint.name || '');
    
    // Prepare genres display
    let genresHtml = '';
    if (soundPoint.genres && Array.isArray(soundPoint.genres) && soundPoint.genres.length > 0) {
        genresHtml = soundPoint.genres.join(', ');
    }
    
    card.innerHTML = `
        <div class="sound-point-content">
            <div class="sound-point-header">
                <div class="sound-point-icon">
                    <img src="../../assets/pictos/pinnedsoundpoint.png" alt="Icon" class="header-icon">
                </div>
                <div class="sound-point-title-container">
                    <h3 class="sound-point-title">${soundPoint.name || 'Point de son'}</h3>
                    <p class="sound-point-subtitle">${soundPoint.type || 'style de musique'}</p>
                </div>
            </div>
            <div class="sound-point-footer">
                <div class="sound-point-genre">
                    <img src="../../assets/pictos/MusicNoteBeamed.png" alt="Music" class="info-icon">
                    <span>${genresHtml || 'Survolté'}</span>
                </div>
                <div class="sound-point-button">
                    <img src="../../assets/buttons/voir-plus.png" alt="Voir plus" class="voir-plus-icon">
                </div>
            </div>
        </div>
    `;
    
    // Add event listener to select this sound point with animation
    card.addEventListener('click', function() {
        // Add animation class
        card.classList.add('sound-point-selected');
        
        // Delay the navigation to allow animation to complete
        setTimeout(() => {
            selectSoundPoint(soundPoint);
        }, 300); // 300ms for animation
    });
    
    return card;
}

// Modify selectSoundPoint to include smooth transition
function selectSoundPoint(soundPoint) {
    selectedSoundPoint = soundPoint;
    viewMode = 'events';
    
    // Add transition class to event list
    eventList.classList.add('transition-in');
    
    // Hide tab navigation and show back button
    const tabNavigation = document.querySelector('.tab-navigation');
    if (tabNavigation) {
        tabNavigation.style.display = 'none';
    }
    
    // Create back button if it doesn't exist
    let backButton = document.querySelector('.back-to-sound-points');
    if (!backButton) {
        backButton = document.createElement('div');
        backButton.className = 'back-to-sound-points';
        backButton.innerHTML = '<span>← Revenir aux points de son</span>';
        backButton.addEventListener('click', function() {
            // Add exit animation
            eventList.classList.add('transition-out');
            
            // Delay the navigation to allow animation to complete
            setTimeout(() => {
                showSoundPointsView();
                eventList.classList.remove('transition-out');
            }, 300); // 300ms for animation
        });
        document.querySelector('.content').insertBefore(backButton, eventList);
    } else {
        backButton.style.display = 'block';
    }
    
    // Show filter button
    const filterButtonContainer = document.querySelector('.filter-button-container');
    if (filterButtonContainer) {
        filterButtonContainer.style.display = 'flex';
    }
    
    // Filter events by the selected sound point
    let filteredEvents = allEvents.filter(event => 
        event.location.toLowerCase() === soundPoint.name.toLowerCase()
    );
    
    // Update the event list with filtered events
    updateEventList(filteredEvents);
    
    // Remove transition class after animation completes
    setTimeout(() => {
        eventList.classList.remove('transition-in');
    }, 300);
}

// Add CSS styles for the new sound point card design
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for new sound point cards and animations
    const style = document.createElement('style');
    style.textContent = `

    @font-face {
            font-family: 'inter-bold';
            src: url('../../../assets/fonts/inter/Inter-Bold.otf') format('truetype');
        }

        .sound-point-card {
            background-color: white;
            border-radius: 10px;
            border: 2px solid #D9D9D9;
            margin: 6px;
            overflow: hidden;
            width: calc(50% - 20px);
            transition: transform 0.2s ease;
            cursor: pointer;
        }
        
        @media (max-width: 768px) {
            .sound-point-card {
                width: calc(100% - 20px);
            }
        }
        
        .sound-point-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(115, 68, 50, 0.15);
        }
        
        .sound-point-content {
            display: flex;
            flex-direction: column;
            padding: 15px;
            height: 100%;
        }
        
        .sound-point-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .sound-point-icon {
            width: 35px;
            height: 35px;
            margin-right: 10px;
            flex-shrink: 0;
        }
        
        .sound-point-icon .header-icon {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .sound-point-title-container {
            flex-grow: 1;
            text-align: left;
        }
        
        .sound-point-title {
        font-family: 'inter-bold', sans-serif;
            color: #F48FBB;
            font-size: 1.3em;
     
            margin: 0 0 5px 0;
        }
        
        .sound-point-subtitle {
                font-family: 'inter-medium', sans-serif;

            color: #000;
            font-size: 0.9em;
            margin: 0;
        }
        
        .sound-point-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
        }
        
        .sound-point-genre {
            display: flex;
            align-items: center;
            background-color: #EDEA87;
            padding: 5px 10px;
                            font-family: 'inter-medium', sans-serif;

            border-radius: 10px;
            color: #000;
            font-size: 12px;
        }
        
        .sound-point-genre .info-icon {
            width: 20px;
            height: 20px;
            margin-right: 6px;
        }
        
        .sound-point-button {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .sound-point-button .voir-plus-icon {
            width: fit-content;
            height: 32px;
            transition: transform 0.2s ease;
        }
        
        .sound-point-button:hover .voir-plus-icon {
            transform: scale(1.1);
        }
        
        /* Animation classes */
        .sound-point-selected {
            transform: scale(1.05);
            opacity: 0.8;
        }
        
        .transition-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        .transition-out {
            animation: fadeOut 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        
        .back-to-sound-points {
            display: flex;
            align-items: center;
            margin: 15px 0;
            color: #734432;
            font-weight: 500;
            cursor: pointer;
            transition: color 0.2s ease;
        }
        
        .back-to-sound-points:hover {
            color: #FF81A8;
        }
        
        .back-to-sound-points span {
            margin-left: 5px;
        }
        
        /* Update layout for sound points view */
        #eventList {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
        }
        
        /* Restore original layout for events view */
        .view-events #eventList {
            display: block;
        }
    `;
    document.head.appendChild(style);
    
    // Add a class to body when switching views
    const originalShowSoundPointsView = showSoundPointsView;
    showSoundPointsView = function() {
        originalShowSoundPointsView();
        document.body.classList.remove('view-events');
        document.body.classList.add('view-sound-points');
    };
    
    const originalSelectSoundPoint = selectSoundPoint;
    window.selectSoundPoint = function(soundPoint) {
        originalSelectSoundPoint(soundPoint);
        document.body.classList.remove('view-sound-points');
        document.body.classList.add('view-events');
    };
    
    // Initialize view class on load
    if (viewMode === 'sound_points') {
        document.body.classList.add('view-sound-points');
    } else {
        document.body.classList.add('view-events');
    }
});




// Modify updateSoundPointsList function to use grid layout
function updateSoundPointsList(soundPoints) {
    eventList.innerHTML = '';
    
    // Update class for proper layout
    eventList.classList.add('sound-points-grid');
    
    if (soundPoints.length === 0) {
        eventList.innerHTML = '<p style="color: #734432; text-align: center; padding: 20px; width: 100%;">Aucun point de son trouvé.</p>';
        return;
    }
    
    soundPoints.forEach(soundPoint => {
        const card = createSoundPointCard(soundPoint);
        eventList.appendChild(card);
    });
}

// Add this function to switch back to sound points view
function showSoundPointsView() {
    viewMode = 'sound_points';
    selectedSoundPoint = null;
    
    // Show tab navigation
    const tabNavigation = document.querySelector('.tab-navigation');
    if (tabNavigation) {
        tabNavigation.style.display = 'flex';
    }
    
    // Hide back button
    const backButton = document.querySelector('.back-to-sound-points');
    if (backButton) {
        backButton.style.display = 'none';
    }
    
    // Hide filter button
    const filterButtonContainer = document.querySelector('.filter-button-container');
    if (filterButtonContainer) {
        filterButtonContainer.style.display = 'none';
    }
    
    // Display sound points
    filterSoundPointsByTab();
}

// Add this function to filter sound points by tab selection
function filterSoundPointsByTab() {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) return;
    
    const filter = activeTab.getAttribute('data-filter');
    
    let filteredSoundPoints = [...allSoundPoints];
    
    if (filter !== 'all') {
        filteredSoundPoints = filteredSoundPoints.filter(point => 
            point.section_toulon && point.section_toulon.toLowerCase() === filter.toLowerCase()
        );
    }
    
    // Update display with filtered sound points
    updateSoundPointsList(filteredSoundPoints);
}




// Add CSS styles for the new elements
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS for sound point cards and back button
    
    
    // Modify tab navigation event listeners
    tabs.forEach(tab => {
        const originalClick = tab.onclick;
        tab.onclick = null; // Remove previous listener
        
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentFilters.location = tab.getAttribute('data-filter');
            
            if (viewMode === 'sound_points') {
                filterSoundPointsByTab();
            } else {
                applyFilters();
            }
        });
    });
    
    // Make sure filter button is initially hidden
    setTimeout(() => {
        const filterButtonContainer = document.querySelector('.filter-button-container');
        if (filterButtonContainer && viewMode === 'sound_points') {
            filterButtonContainer.style.display = 'none';
        }
    }, 100);
});



// Fonction pour attacher les gestionnaires d'événements sur les chips de filtres de genre
function setupGenreFilterChips() {
    const filterChips = document.querySelectorAll('.filter-chip[data-filter]');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const genre = this.getAttribute('data-filter');
            
            // Basculer la classe 'active' pour indiquer la sélection
            this.classList.toggle('active');
            
            // Initialiser le tableau des genres si nécessaire
            if (!currentFilters.genres) {
                currentFilters.genres = [];
            }
            
            // Ajouter ou supprimer le genre de la liste des filtres
            const genreIndex = currentFilters.genres.indexOf(genre);
            if (genreIndex === -1) {
                // Genre pas encore sélectionné, l'ajouter
                currentFilters.genres.push(genre);
                console.log(`Ajout du genre ${genre} aux filtres`);
            } else {
                // Genre déjà sélectionné, le supprimer
                currentFilters.genres.splice(genreIndex, 1);
                console.log(`Suppression du genre ${genre} des filtres`);
            }
            
            console.log('Genres sélectionnés:', currentFilters.genres);
        });
    });
}



// Fonction pour initialiser tous les gestionnaires d'événements
function initializeFilterHandlers() {
    // Configurer les chips de filtres de genre
    setupGenreFilterChips();
    
    // Configurer les filtres d'heure
   
    

    
    console.log('Gestionnaires de filtres initialisés');
}
function setupFilterValidation() {
    const validateBtn = document.getElementById('validate-filters'); // ou quel que soit l'ID correct
    
    if (validateBtn) {
        // Supprimer les anciens event listeners potentiels
        validateBtn.replaceWith(validateBtn.cloneNode(true));
        
        // Récupérer la nouvelle référence après remplacement
        const newValidateBtn = document.getElementById('validate-filters');
        
        // Ajouter le nouveau gestionnaire d'événements
        newValidateBtn.addEventListener('click', function(e) {
            console.log('Validate clicked (alt method)');
            e.preventDefault();
            
            // Mise à jour des filtres
            updateFiltersFromUI();
            
            // Appliquer les filtres
            applyFilters();
            
            // Fermer l'overlay
            const overlay = document.querySelector('.filter-overlay');
            if (overlay) overlay.classList.remove('active');
        });
        
        console.log('Alternative validation handler added');
    }
}



function updateFiltersFromUI() {
    // Genres
    currentFilters.genres = Array.from(document.querySelectorAll('.filter-chip.active'))
        .map(chip => chip.getAttribute('data-filter'));
    
    // Locations
    currentFilters.locations = Array.from(document.querySelectorAll('.location-chip.active'))
        .map(chip => chip.textContent.trim().split('(')[0].trim());
    
    // Temps
    const timeInputs = document.querySelectorAll('.time-select');
    if (timeInputs && timeInputs.length >= 2) {
        currentFilters.startTime = timeInputs[0].value;
        currentFilters.endTime = timeInputs[1].value;
    }
    
    console.log('Filters updated from UI:', currentFilters);
}





//PARTIE PUOR AFFICHER LES DETAILS D UN PARTENAIRE
// Function to show partner details when clicking on a partner logo
async function showPartnerDetails(partnerId, detailsOverlay) {
    try {
        // Save current content to restore later
        const currentContent = detailsOverlay.querySelector('.event-details-container').innerHTML;
        
        // Add animation for transition
        const container = detailsOverlay.querySelector('.event-details-container');
        container.style.opacity = '0';
        
        // Show skeleton loading state
        setTimeout(() => {
            container.innerHTML = `
                <div class="details-header">
                    <div class="details-image-container">
                        <div class="skeleton-image" style="height: 200px; background-color: #eee;"></div>
                        <button class="close-details">×</button>
                    </div>
                    
                    <div class="details-title-section">
                        <div class="details-title-left">
                            <div class="skeleton-title" style="height: 28px; width: 70%; background-color: #eee; margin-bottom: 10px;"></div>
                            <div class="skeleton-subtitle" style="height: 20px; width: 50%; background-color: #eee;"></div>
                        </div>
                    </div>
                    
                    <div class="details-description">
                        <div class="skeleton-description" style="height: 100px; background-color: #eee;"></div>
                    </div>
                    
                    <div class="details-info-section">
                        <div class="skeleton-info" style="height: 20px; width: 80%; background-color: #eee; margin-bottom: 10px;"></div>
                        <div class="skeleton-info" style="height: 20px; width: 60%; background-color: #eee;"></div>
                    </div>
                </div>
            `;
            
            container.style.opacity = '1';


            
            
            // Add event listener to close button
            container.querySelector('.close-details').addEventListener('click', () => {
                // Fade out
                container.style.opacity = '0';
                
                // Restore event details
                setTimeout(() => {
                    container.innerHTML = currentContent;
                    container.style.opacity = '1';
                    
                    // Re-add event listeners to restored content
                    addEventListenersToRestoredContent(detailsOverlay);
                }, 300);
            });
        }, 300);
        
        // Fetch partner data
        const partnerDoc = await getDoc(doc(db, "partners", partnerId));
        
        if (!partnerDoc.exists()) {
            throw new Error("Partner not found");
        }
        
        const partner = {
            id: partnerId,
            ...partnerDoc.data()
        };
        
        // After a short delay to ensure skeleton is shown
        setTimeout(() => {
            // Update container with partner details
            container.innerHTML = `
                <div class="details-header">
                    <div class="details-image-container">
                        <img src="${partner.imageUrl}" alt="${partner.name || 'Partenaire'}" class="details-image">
                        <button class="close-details">×</button>
                    </div>
                    
                    <div class="details-title-section">
                        <div class="details-title-left">
                            <h2 class="details-title">${partner.name || 'Partenaire'}</h2>
                            <p class="details-subtitle" style="            text-transform: uppercase;
">${partner.type || ''}</p>
                        </div>
                    </div>
                    
                    <div class="details-description">
                        <p>${partner.info || 'Aucune information disponible sur ce partenaire.'}</p>
                    </div>
                     ${partner.address || partner.phone ? `
                    <div class="details-contact-info" style="padding-left: 20px;">
                        ${partner.address ? `
                        <div class="contact-item">
                            <img src="../../assets/pictos/PinMapmarron.png" alt="Adresse" class="info-icon">
                            <span>${partner.address}</span>
                        </div>` : ''}
                        
                        ${partner.phone ? `
                        <div class="contact-item">
                            <img src="../../assets/pictos/Telephone.png" alt="Téléphone" class="info-icon">
                            <span>${partner.phone}</span>
                        </div>` : ''}
                    </div>` : ''}
                    ${partner.website ? `
                    <div class="details-more-button">
                        <a href="${partner.website}" target="_blank">
                            <img src="../../assets/buttons/savoirplusmarron.png" alt="Site web">
                        </a>
                    </div>` : ''}
                    
                   
                </div>
            `;
            
            // Add event listener to close button
            container.querySelector('.close-details').addEventListener('click', () => {
                // Fade out
                container.style.opacity = '0';
                
                // Restore event details
                setTimeout(() => {
                    container.innerHTML = currentContent;
                    container.style.opacity = '1';
                    
                    // Re-add event listeners to restored content
                    addEventListenersToRestoredContent(detailsOverlay);
                }, 300);
            });
            
            // Fade in
            container.style.opacity = '1';
        }, 800); // Delay to show skeleton
        
    } catch (error) {
        console.error("Error fetching partner details:", error);
        alert("Une erreur est survenue lors du chargement des détails du partenaire");
    }
}

// Function to re-add event listeners to restored content
function addEventListenersToRestoredContent(detailsOverlay) {
    // Add event listener for close button
    const closeButton = detailsOverlay.querySelector('.close-details');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            detailsOverlay.classList.remove('active');
            document.body.classList.remove('body-no-scroll');
            setTimeout(() => {
                detailsOverlay.remove();
                // Remove history state to avoid double-back
                history.back();
            }, 300);
        });
    }
    
    // Add event listener for favorite icon
    const favIcon = detailsOverlay.querySelector('.details-favorite-icon');
    if (favIcon) {
        const eventId = favIcon.getAttribute('data-id');
        favIcon.addEventListener('click', () => {
            const isFav = isEventFavorite(eventId);
            const favIcons = document.querySelectorAll(`.favorite-icon[data-id="${eventId}"]`);
            
            // Toggle the cookie
            toggleFavorite(eventId, favIcon);
            
            // Update other instances of the same favorite icon
            favIcons.forEach(icon => {
                icon.src = isFav ? '../../assets/pictos/star-card.png' : '../../assets/pictos/filled-star.png';
            });
        });
    }
    
    // Re-add event listeners to partner logos
    const partnerLogos = detailsOverlay.querySelectorAll('.partner-logo-container');
    partnerLogos.forEach(logo => {
        const partnerId = logo.getAttribute('data-partner-id');
        logo.addEventListener('click', () => {
            showPartnerDetails(partnerId, detailsOverlay);
        });
    });
}


// Helper function for smoother transitions
function animateTransition(element, content, callback) {
    element.style.opacity = '0';
    
    setTimeout(() => {
        if (content) {
            element.innerHTML = content;
        }
        
        if (callback && typeof callback === 'function') {
            callback();
        }
        
        element.style.opacity = '1';
    }, 300);
}