/**
 * Module de gestion des favoris - Système réutilisable
 * Peut être intégré à n'importe quelle page du site
 */

class FavoritesManager {
    constructor(options = {}) {
        this.options = {
            cookiePrefix: 'favorite_event_',
            cookieDuration: 180, // 6 mois par défaut
            assetsPath: '../../assets/',
            ...options
        };
        
        this.allEvents = [];
        this.soundPoints = [];
        this.favoritesOverlay = null;
        
        this.init();
    }
    
    /**
     * Initialisation du gestionnaire de favoris
     */
    init() {
        this.favoritesOverlay = document.querySelector('.favorites-overlay');
        if (!this.favoritesOverlay) {
            console.warn('Élément .favorites-overlay non trouvé');
            return;
        }
        
        this.setupEventListeners();
        this.addRequiredStyles();
    }
    
    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        const favoritesBtn = document.querySelector('.favorites-btn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                this.loadAndShowFavorites();
            });
        }
        
        // Fermer l'overlay en cliquant en dehors
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.favorites-btn') && 
                !event.target.closest('.favorites-overlay') &&
                this.favoritesOverlay.classList.contains('active')) {
                this.closeFavorites();
            }
        });
    }
    
    /**
     * Ajouter les styles CSS nécessaires
     */
    addRequiredStyles() {
        if (document.getElementById('favorites-manager-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'favorites-manager-styles';
        style.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(20px); height: 0; margin: 0; padding: 0; border: none; }
            }
            
            .favorites-overlay {
                position: fixed;
                top: 4.375rem;
                left: 0;
                width: 100%;
                height: calc(100vh - 4.375rem);
                background-color: white;
                z-index: 99;
                padding: 1.25rem;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            .favorites-overlay.active {
                display: block;
                opacity: 1;
            }
            
            .favorites-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding-top: 2.5rem;
            }
            
            .favorites-empty img#favorites-icon {
                width: 90%;
                max-width: 900px;
                margin-bottom: 1.7rem;
            }
            
            .favorites-empty img#program-icon {
                width: 25%;
                max-width: 150px;
                margin-bottom: 1.5rem;
            }
            
            .favorites-empty img#program-btn {
                width: 50%;
                max-width: 300px;
                margin-bottom: 1.5rem;
            }
            
            .favorites-empty h3 {
                font-family: 'inter-semi-bold', sans-serif;
                color: #232222;
                font-weight: normal;
                margin-bottom: 1.7rem;
                font-size: 1.6rem;
                line-height: 1.4;
                text-align: center;
                width: 70%;
                max-width: 350px;
            }
            
            .favorites-empty .action-img {
                width: 50%;
                max-width: 230px;
                margin: 1rem 0;
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            
            .favorites-empty .action-img:hover {
                transform: scale(1.05);
            }
            
            .favorites-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
                padding: 0 20px 20px 20px;
            }
            
            .favorites-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 20px;
                padding: 20px;
            }
            
            .favorites-back-btn {
                align-self: flex-start;
                color: #1f1e1e;
                text-decoration: none;
                font-size: 15px;
                margin-bottom: 15px;
                font-family: 'inter-regular', sans-serif;
            }
            
            .favorites-title-img {
                width: 70%;
                max-width: 250px;
                height: auto;
            }
            
            /* Styles pour les cartes d'événements dans les favoris - Design exact de programmation */
            .favorites-overlay .event-card {
                width: 100%;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
                background-color: #fff;
                position: relative;
                margin-bottom: 0; /* Utilise gap du container */
            }
            
            .favorites-overlay .card-image-container {
                position: relative;
                width: 100%;
                height: 180px;
                overflow: hidden;
            }
            
            .favorites-overlay .card-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .favorites-overlay .time-tag {
                position: absolute;
                top: 5px;
                left: 0px;
                background-color: #D892B4;
                color: white;
                padding: 5px 10px;
                transform: rotate(-7deg);
                font-size: 12px;
                font-weight: bold;
                border-radius: 5px;
                box-shadow: 1px 1px 3px rgba(0,0,0,0.2);
                z-index: 10;
                font-family: 'inter-bold', sans-serif;
            }
            
            .favorites-overlay .card-info {
                padding: 15px;
                position: relative;
            }
            
            .favorites-overlay .event-title {
                color: #734432;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
                font-family: 'inter-bold', sans-serif;
                text-align: left;
            }
            
            .favorites-overlay .event-type {
                color: #D892B4;
                font-size: 14px;
                margin-bottom: 10px;
                font-family: 'inter-medium', sans-serif;
                text-align: left;
            }
            
            .favorites-overlay .event-location, 
            .favorites-overlay .event-style {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                color: #734432;
                font-size: 14px;
                font-family: 'inter-regular', sans-serif;
                text-align: left;
            }
            
            .favorites-overlay .info-icon {
                width: 20px;
                height: 20px;
                margin-right: 8px;
                flex-shrink: 0;
            }
            
            .favorites-overlay .favorite-icon {
                position: absolute;
                top: 15px;
                right: 15px;
                width: 37px;
                height: 37px;
                cursor: pointer;
            }
            
            .favorites-overlay .info-btn {
                position: absolute;
                bottom: 15px;
                right: 15px;
                width: 100px;
                height: auto;
                cursor: pointer;
            }
            
            /* Styles pour les détails d'événements - Design de programmation */
            .event-details-overlay {
                position: fixed;
                top: 8vh;
                left: 0;
                width: 100%;
                height: 92vh;
                background-color: #ffffff;
                z-index: 999;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                opacity: 0;
                transform: scale(0.8);
                transition: transform 0.4s ease-out, opacity 0.3s ease-out;
                transform-origin: center center;
            }
            
            .event-details-overlay.active {
                transform: scale(1);
                opacity: 1;
            }
            
            .event-details-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .details-header {
                width: 100%;
                display: flex;
                flex-direction: column;
                flex: 1;
                min-height: 0;
            }
            
            .details-image-container {
                width: 100%;
                aspect-ratio: 1 / 1;
                overflow: hidden;
                flex-shrink: 0;
                position: relative;
            }
            
            .details-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
                display: block;
            }
            
            .close-details {
                position: absolute;
                top: 10px;
                right: 15px;
                width: 45px;
                height: 45px;
                background-color: #734432;
                border-radius: 50%;
                border: none;
                font-size: 26px;
                font-weight: bold;
                color: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 2;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            
            .details-title-section {
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                background-color: #fff;
                flex-shrink: 0;
            }
            
            .details-title-left {
                flex: 1;
            }
            
            .details-title {
                color: #D2775B;
                font-family: 'inter-bold', sans-serif;
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .details-subtitle {
                color: #403B23;
                font-size: 18px;
                font-family: 'inter-medium', sans-serif;
            }
            
            .details-title-right {
                padding-left: 15px;
                padding-top: 5px;
            }
            
            .details-favorite-icon {
                width: 38px;
                height: 38px;
                cursor: pointer;
            }
            
            .details-description {
                padding: 0 20px 20px;
                color: #403B23;
                font-size: 16px;
                font-family: 'inter-regular', sans-serif;
            }
            
            .details-more-button {
                padding: 0 20px 20px;
                display: flex;
                justify-content: start;
                margin: 10px 0 25px;
                flex-shrink: 0;
            }
            
            .details-more-button img {
                height: 35px;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .details-more-button img:hover {
                transform: scale(1.05);
            }
            
            .details-info-section {
                padding: 0 20px 25px;
                display: flex;
                flex-direction: column;
                align-items: center;
                flex-shrink: 0;
            }
            
            .details-info-item {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                color: #403B23;
                font-family: 'inter-semi-bold', sans-serif;
                font-size: 16px;
            }
            
            .details-separator {
                margin: 0 15px;
                color: #403B23;
                font-weight: bold;
            }
            
            .details-map-button {
                width: 100%;
                display: flex;
                justify-content: center;
                margin-top: 15px;
            }
            
            .details-map-button img {
                height: 43px;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .details-map-button img:hover {
                transform: scale(1.05);
            }
            
            .details-partners {
                background-color: #734432;
                color: white;
                padding: 25px 20px;
                flex-shrink: 0;
                margin-top: auto;
            }
            
            .details-partners h3 {
                text-align: center;
                font-size: 20px;
                margin-bottom: 20px;
                letter-spacing: 1px;
                font-family: 'inter-bold', sans-serif;
                color: white;
            }
            
            .partners-grid {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 15px;
                padding: 0 10px;
            }
            
            .details-partner {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 90px;
                text-decoration: none;
                cursor: pointer;
            }
            
            .partner-logo {
                width: 90px;
                height: 90px;
                object-fit: cover;
                background-color: white;
                padding: 2px;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                transition: transform 0.2s ease;
                border: none;
            }
            
            .details-partner:hover .partner-logo {
                transform: scale(1.05);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .partner-name {
                font-size: 12px;
                text-align: center;
                color: white;
                font-family: 'inter-regular', sans-serif;
                line-height: 1.3;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            .details-contact-info {
                padding: 0 20px 20px;
            }
            
            .contact-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 10px;
                color: #333;
                font-size: 0.95rem;
            }
            
            .contact-item .info-icon {
                width: 20px;
                height: 20px;
                margin-right: 10px;
                margin-top: 2px;
            }
            
            /* Skeleton loading */
            @keyframes skeleton-loading {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
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
                width: 70px;
                height: 70px;
                border-radius: 50%;
                margin: 0 5px 15px;
            }
            
            .skeleton-image {
                height: 200px;
                background-color: #eee;
            }
            
            .skeleton-title {
                height: 28px;
                width: 70%;
                background-color: #eee;
                margin-bottom: 10px;
            }
            
            .skeleton-subtitle {
                height: 20px;
                width: 50%;
                background-color: #eee;
            }
            
            .skeleton-description {
                height: 100px;
                background-color: #eee;
            }
            
            .skeleton-info {
                height: 20px;
                width: 80%;
                background-color: #eee;
                margin-bottom: 10px;
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
            
            .body-no-scroll {
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Définir un cookie
     */
    setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + d.toUTCString();
        const cookieString = `${name}=${value};${expires};path=/;SameSite=Lax`;
        document.cookie = cookieString;
    }
    
    /**
     * Récupérer un cookie
     */
    getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    /**
     * Supprimer un cookie
     */
    deleteCookie(name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    }
    
    /**
     * Vérifier si un événement est en favori
     */
    isEventFavorite(eventId) {
        return this.getCookie(this.options.cookiePrefix + eventId) === 'true';
    }
    
    /**
     * Basculer l'état de favori d'un événement
     */
    toggleFavorite(eventId, iconElement = null) {
        const wasFavorite = this.isEventFavorite(eventId);
        
        if (wasFavorite) {
            this.deleteCookie(this.options.cookiePrefix + eventId);
            if (iconElement) {
                iconElement.src = this.options.assetsPath + 'pictos/star-card.png';
            }
        } else {
            this.setCookie(this.options.cookiePrefix + eventId, 'true', this.options.cookieDuration);
            if (iconElement) {
                iconElement.src = this.options.assetsPath + 'pictos/filled-star.png';
            }
        }
        
        // Mettre à jour toutes les icônes de cet événement sur la page
        this.updateAllFavoriteIcons(eventId);
        
        return !wasFavorite;
    }
    
    /**
     * Mettre à jour toutes les icônes de favori pour un événement donné
     */
    updateAllFavoriteIcons(eventId) {
        const isFavorite = this.isEventFavorite(eventId);
        const iconSrc = isFavorite ? 
            this.options.assetsPath + 'pictos/filled-star.png' : 
            this.options.assetsPath + 'pictos/star-card.png';
        
        // Mettre à jour dans les cartes d'événements
        const eventIcons = document.querySelectorAll(`[data-id="${eventId}"]`);
        eventIcons.forEach(icon => {
            if (icon.tagName === 'IMG') {
                icon.src = iconSrc;
            } else {
                const img = icon.querySelector('img');
                if (img) img.src = iconSrc;
            }
        });
        
        // Mettre à jour dans l'overlay des détails
        const detailsIcon = document.querySelector(`.details-favorite-icon[data-id="${eventId}"]`);
        if (detailsIcon) {
            detailsIcon.src = iconSrc;
        }
    }
    
    /**
     * Formater l'heure à partir d'un timestamp
     */
    formatTime(timestamp) {
        if (!timestamp) return '00h00';
        
        try {
            let date;
            
            if (typeof timestamp === 'object') {
                if (timestamp instanceof Date) {
                    date = timestamp;
                } else if (timestamp.seconds !== undefined) {
                    // Timestamp Firestore
                    date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
                } else if (typeof timestamp.toDate === 'function') {
                    // Timestamp Firestore avec méthode toDate
                    date = timestamp.toDate();
                } else {
                    date = new Date(timestamp);
                }
            } else if (typeof timestamp === 'number') {
                // Timestamp Unix
                date = new Date(timestamp * 1000);
            } else if (typeof timestamp === 'string') {
                // Essayer le parsing standard
                date = new Date(timestamp);
                
                // Si le parsing standard ne fonctionne pas, essayer des expressions régulières
                if (isNaN(date.getTime())) {
                    // Format français: "5 mai 5555 à 05:55:00 UTC+2"
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
                            date = new Date(parseInt(year), monthIndex, parseInt(day), 
                                           parseInt(hours), parseInt(minutes), parseInt(seconds));
                        }
                    }
                }
            }
            
            if (!date || isNaN(date.getTime())) {
                console.warn('Invalid timestamp after processing:', timestamp);
                return '00h00';
            }
            
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}h${minutes}`;
        } catch (error) {
            console.error("Erreur lors du formatage de l'heure:", error, timestamp);
            return '00h00';
        }
    }
    
    /**
     * Définir les données d'événements
     */
    setEventsData(events, soundPoints = []) {
        this.allEvents = events || [];
        this.soundPoints = soundPoints || [];
    }
    
    /**
     * Récupérer tous les événements favoris
     */
    getFavoriteEvents() {
        const favoriteEvents = [];
        const addedEventIds = new Set(); // Pour éviter les doublons
        
        // Si on a des événements directs
        if (this.allEvents && Array.isArray(this.allEvents)) {
            this.allEvents.forEach(event => {
                if (this.isEventFavorite(event.id) && !addedEventIds.has(event.id)) {
                    favoriteEvents.push(event);
                    addedEventIds.add(event.id);
                }
            });
        }
        
        // Si on a des points sonores avec des événements (seulement si pas déjà ajoutés)
        if (this.soundPoints && Array.isArray(this.soundPoints)) {
            this.soundPoints.forEach(point => {
                if (point.events && Array.isArray(point.events)) {
                    point.events.forEach(event => {
                        if (this.isEventFavorite(event.id) && !addedEventIds.has(event.id)) {
                            favoriteEvents.push({
                                ...event,
                                location: point.name
                            });
                            addedEventIds.add(event.id);
                        }
                    });
                }
            });
        }
        
        return favoriteEvents;
    }
    
    /**
     * Créer le HTML d'une carte d'événement favori avec le design de la programmation
     */
    createFavoriteEventCardHTML(event) {
        // Formater l'heure
        const startTime = this.formatTime(event.startDate || event.timestamp?.start);
        const endTime = this.formatTime(event.endDate || event.timestamp?.end);
        const timeTag = `${startTime}-${endTime}`;
        
        // Définir l'icône de favori
        const favoriteIconSrc = this.isEventFavorite(event.id) ? 
            this.options.assetsPath + 'pictos/filled-star.png' : 
            this.options.assetsPath + 'pictos/star-card.png';
        
        return `
            <div class="event-card" data-id="${event.id}">
                <div class="card-image-container">
                    <img src="${event.imageUrl || this.options.assetsPath + 'images/default-event.jpg'}" 
                         alt="${event.title}" 
                         class="card-image"
                         loading="lazy">
                    <div class="time-tag">${timeTag}</div>
                </div>
                <div class="card-info">
                    <h3 class="event-title">${event.title || 'Événement'}</h3>
                    <p class="event-type">${event.subtitle || ''}</p>
                    <div class="event-location">
                        <img src="${this.options.assetsPath}pictos/pinMap.png" alt="Location" class="info-icon">
                        <span>${event.location || ''}</span>
                    </div>
                    <div class="event-style">
                        <img src="${this.options.assetsPath}pictos/MusicNoteBeamed.png" alt="Music" class="info-icon">
                        <span>${Array.isArray(event.genre) ? event.genre.join(', ') : (event.genre || '')}</span>
                    </div>
                    <img src="${favoriteIconSrc}" alt="Favorite" class="favorite-icon" data-id="${event.id}">
                    <img src="${this.options.assetsPath}buttons/plus-info.png" alt="Plus d'infos" class="info-btn" data-id="${event.id}">
                </div>
            </div>
        `;
    }
    
    /**
     * Ajouter les écouteurs d'événements aux cartes de favoris
     */
    addFavoritesEventListeners(favoriteEvents) {
        favoriteEvents.forEach(event => {
            const eventCard = this.favoritesOverlay.querySelector(`[data-id="${event.id}"]`);
            if (eventCard) {
                this.addEventCardListeners(eventCard, event);
            }
        });
    }
    
    /**
     * Créer une carte d'événement favori avec le design de la programmation (méthode legacy)
     */
    createFavoriteEventCard(event) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.setAttribute('data-id', event.id);
        eventCard.innerHTML = this.createFavoriteEventCardHTML(event);
        this.addEventCardListeners(eventCard, event);
        return eventCard;
    }
    
    /**
     * Ajouter les écouteurs d'événements à une carte d'événement
     */
    addEventCardListeners(eventCard, event) {
        // Clic sur l'icône de favori
        const favoriteIcon = eventCard.querySelector('.favorite-icon');
        if (favoriteIcon) {
            favoriteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const isNowFavorite = this.toggleFavorite(event.id, favoriteIcon);
                
                // Si l'événement est supprimé des favoris, retirer la carte avec animation
                if (!isNowFavorite) {
                    eventCard.style.animation = 'fadeOut 0.3s forwards';
                    setTimeout(() => {
                        eventCard.remove();
                        // Si plus de favoris, recharger pour afficher l'état vide
                        const container = this.favoritesOverlay.querySelector('.favorites-container');
                        if (container && container.children.length === 0) {
                            this.loadAndShowFavorites();
                        }
                    }, 300);
                }
            });
        }
        
        // Clic sur le bouton "Plus d'infos" ou sur la carte pour afficher les détails
        const infoBtn = eventCard.querySelector('.info-btn');
        if (infoBtn) {
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof window.showEventDetails === 'function') {
                    window.showEventDetails(event);
                } else {
                    console.warn('Fonction showEventDetails non disponible');
                }
            });
        }
        
        // Clic sur la carte pour afficher les détails (sauf sur les icônes)
        eventCard.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-icon') && !e.target.closest('.info-btn')) {
                if (typeof window.showEventDetails === 'function') {
                    window.showEventDetails(event);
                } else {
                    console.warn('Fonction showEventDetails non disponible');
                }
            }
        });
    }
    
    /**
     * Charger et afficher les favoris
     */
    loadAndShowFavorites() {
        if (!this.favoritesOverlay) return;
        
        // Afficher l'overlay
        this.favoritesOverlay.classList.add('active');
        document.body.classList.add('body-no-scroll');
        
        // Vider le contenu et afficher le loader
        this.favoritesOverlay.innerHTML = `
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
            const favoriteEvents = this.getFavoriteEvents();
            
            // Supprimer le loader et afficher le contenu
            const loader = this.favoritesOverlay.querySelector('.favorites-loading');
            if (loader) {
                loader.remove();
            }
            
            // Vider complètement l'overlay
            this.favoritesOverlay.innerHTML = '';
            
            if (favoriteEvents.length === 0) {
                this.showEmptyState();
            } else {
                this.showFavoritesList(favoriteEvents);
            }
        }, 300);
    }
    
    /**
     * Afficher l'état vide (aucun favori)
     */
    showEmptyState() {
        this.favoritesOverlay.innerHTML = `
            <div class="favorites-empty">
                <img src="${this.options.assetsPath}headline/programmation-outline.png" 
                     alt="Icône favoris" 
                     id="favorites-icon">
                <h3>Vous n'avez pas encore sélectionné de programme favoris</h3>
                <img src="${this.options.assetsPath}pictos/material-symbols_stars-outline.png" 
                     alt="Icône programme" 
                     id="program-icon">
                <h3>Rendez-vous sur la programmation pour faire votre choix</h3>
                <img src="${this.options.assetsPath}buttons/programmation-button.png" 
                     alt="Aller à la programmation" 
                     class="action-img" 
                     id="go-to-program">
            </div>
        `;
        
        // Ajouter l'écouteur pour le bouton de programmation
        const programButton = this.favoritesOverlay.querySelector('#go-to-program');
        if (programButton) {
            programButton.addEventListener('click', () => {
                // Fermer l'overlay des favoris
                this.closeFavorites();
                // Rediriger vers la programmation (adapter le chemin selon la page actuelle)
                const currentPath = window.location.pathname;
                if (currentPath.includes('/programmation/')) {
                    // Déjà sur la page programmation, juste fermer l'overlay
                    return;
                } else if (currentPath.includes('/pages/')) {
                    // Dans un dossier de page, aller vers programmation
                    window.location.href = '../programmation/programmation.html';
                } else {
                    // Depuis la racine ou autre
                    window.location.href = 'pages/programmation/programmation.html';
                }
            });
        }
    }
    
    /**
     * Afficher la liste des favoris
     */
    showFavoritesList(favoriteEvents) {
        this.favoritesOverlay.innerHTML = `
            <div class="favorites-header">
                <a href="#" class="favorites-back-btn">← Retour</a>
                <img src="${this.options.assetsPath}headline/favoris.png" 
                     alt="Mes Favoris" 
                     class="favorites-title-img">
            </div>
            <div class="favorites-container">
                ${favoriteEvents.map(event => this.createFavoriteEventCardHTML(event)).join('')}
            </div>
        `;
        
        // Ajouter les écouteurs d'événements après avoir créé le HTML
        this.addFavoritesEventListeners(favoriteEvents);
        
        // Ajouter l'écouteur pour le bouton de retour
        const backButton = this.favoritesOverlay.querySelector('.favorites-back-btn');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeFavorites();
            });
        }
    }
    
    /**
     * Fermer l'overlay des favoris
     */
    closeFavorites() {
        if (this.favoritesOverlay) {
            this.favoritesOverlay.classList.remove('active');
            setTimeout(() => {
                if (!document.querySelector('.event-details-overlay.active')) {
                    document.body.classList.remove('body-no-scroll');
                }
            }, 300);
        }
    }
    
    /**
     * Méthode publique pour ajouter un écouteur de favori à un élément
     */
    addFavoriteListener(element, eventId) {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            const icon = element.tagName === 'IMG' ? element : element.querySelector('img');
            this.toggleFavorite(eventId, icon);
        });
    }
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesManager;
}

// Disponible globalement
window.FavoritesManager = FavoritesManager; 