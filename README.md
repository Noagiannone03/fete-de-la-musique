# 🎵 Site Web Officiel - Fête de la Musique

![Fête de la Musique](assets/logo/giante-logo-fdlm.png)

**Application web mobile-first pour la Fête de la Musique**  
*Développé pour [No Id Lab](https://www.noidlab.com) - Prestataire officiel Fête de la Musique Toulon*

---

## 📱 **À Propos**

Site web officiel mobile-first de la Fête de la Musique à Toulon, développé pour No Id Lab (prestataire officiel), offrant une expérience immersive pour découvrir la programmation musicale, gérer ses événements favoris et explorer les partenaires de l'événement.

### 🎯 **Objectifs du Projet**
- Centraliser toute la programmation de la Fête de la Musique à Toulon
- Offrir une expérience utilisateur optimisée pour mobile
- Permettre la géolocalisation des événements
- Faciliter la découverte de nouveaux artistes et lieux
- Promouvoir les partenaires locaux

---

## ⚡ **Fonctionnalités Principales**

### 🎪 **Programmation Interactive**
- **Catalogue complet** des événements musicaux
- **Filtrage avancé** par lieu, heure, genre musical
- **Détails enrichis** : descriptions, horaires, coordonnées GPS
- **Intégration Google Maps** pour la navigation

### ⭐ **Système de Favoris**
- **Gestion personnalisée** des événements favoris
- **Stockage local** persistent (cookies + localStorage)
- **Interface intuitive** avec animations fluides
- **Export/partage** des sélections

### 🗺️ **Géolocalisation**
- **"Autour de moi"** : événements à proximité
- **Points sonores** géolocalisés
- **Intégration Google Maps** native
- **Calcul d'itinéraires** automatique

### 🤝 **Partenaires**
- **Annuaire complet** des partenaires locaux
- **Fiches détaillées** : contact, site web, localisation
- **Liens directs** vers les sites partenaires

### 📱 **Design Responsive**
- **Mobile-first** avec redirection automatique desktop
- **Interface adaptive** (320px → 768px+)
- **Animations fluides** et micro-interactions
- **PWA-ready** (Progressive Web App)

---

## 🛠️ **Technologies Utilisées**

### **Frontend**
- **HTML5** - Structure sémantique et accessible
- **CSS3** - Design moderne avec Flexbox/Grid, animations CSS
- **JavaScript ES6+** - Logique métier, interactions utilisateur
- **Web APIs** - Geolocation, LocalStorage, SessionStorage

### **Backend & Base de Données**
- **Firebase Firestore** - Base de données NoSQL temps réel
- **Firebase Config** :
  ```javascript
  Project ID: fete-de-la-musique-64a6b
  Collections: events, sound_points, partners
  ```

### **Outils & Utilitaires**
- **Python 3** - Scripts de scrapping et automatisation
- **Git** - Versioning et collaboration
- **Admin Panel** - Interface d'administration custom

### **APIs Externes**
- **Google Maps API** - Géolocalisation et navigation
- **UserAgent Detection** - Redirection mobile/desktop intelligente

---

## 📁 **Architecture du Projet**

```
webproject-lafetedelamusique/
├── 📄 index.html                 # Page d'accueil mobile
├── 📁 pages/                     # Pages secondaires
│   ├── 📁 programmation/         # Catalogue événements
│   ├── 📁 proche-de-moi/         # Géolocalisation
│   ├── 📁 partners/              # Annuaire partenaires
│   ├── 📁 apropos/               # À propos
│   ├── 📁 summer/                # Section été
│   └── 📁 redirect/              # Redirection desktop
├── 📁 assets/                    # Ressources statiques
│   ├── 📁 css/                   # Feuilles de style
│   ├── 📁 js/                    # Scripts JavaScript
│   ├── 📁 images/                # Images et illustrations
│   ├── 📁 fonts/                 # Polices personnalisées
│   ├── 📁 pictos/                # Icônes et pictogrammes
│   ├── 📁 buttons/               # Boutons graphiques
│   └── 📁 logo/                  # Logos et branding
├── 📁 utils/                     # Modules utilitaires
│   └── 📄 favorites-manager.js   # Gestionnaire de favoris
├── 📁 admin-panel/               # Interface d'administration
│   ├── 📄 index.html             # Dashboard admin
│   ├── 📄 script.js              # Logique admin
│   └── 📄 style.css              # Styles admin
├── 📄 scrapping.py               # Script de récupération d'images
├── 📄 cors.json                  # Configuration CORS Firebase
└── 📄 README.md                  # Documentation
```

---

## 🚀 **Installation & Déploiement**

### **Prérequis**
- Serveur web (Apache, Nginx, ou serveur de développement)
- Compte Firebase (pour la base de données)
- Python 3.7+ (pour les scripts utilitaires)

### **Installation Locale**

1. **Cloner le projet**
   ```bash
   git clone [URL_DU_REPO]
   cd webproject-lafetedelamusique
   ```

2. **Configuration Firebase**
   - Créer un projet Firebase
   - Activer Firestore Database
   - Copier la configuration dans `index.html` (ligne ~820)

3. **Lancer le serveur local**
   ```bash
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js
   npx serve .
   
   # Option 3: PHP
   php -S localhost:8000
   ```

4. **Accéder à l'application**
   ```
   Mobile: http://localhost:8000
   Admin:  http://localhost:8000/admin-panel
   ```

### **Déploiement Production**

1. **Firebase Hosting** (recommandé)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

2. **Configuration CORS**
   ```bash
   # Appliquer la configuration CORS
   gsutil cors set cors.json gs://[BUCKET_NAME]
   ```

---

## 🎛️ **Configuration**

### **Popup Publicitaire**
Le système de popup est configurable dans `assets/js/popup.js` :

```javascript
const CONFIG = {
  SHOW_ALWAYS: true,              // Affichage à chaque visite
  SHOW_EVERY_X_VISITS: {...},    // Toutes les X visites
  SHOW_ONCE_PER_SESSION: {...},  // Une fois par session
  SHOW_ONCE_FOREVER: {...},      // Une seule fois au total
  DEBUG_MODE: false,              // Logs de débogage
  DISPLAY_DELAY: 2000            // Délai d'affichage (ms)
};
```

### **Firebase Collections**

**Events** (Événements)
```javascript
{
  id: "event_id",
  title: "Nom de l'événement",
  subtitle: "Sous-titre",
  description: "Description complète",
  imageUrl: "URL de l'image",
  location: "Nom du lieu",
  startDate: Timestamp,
  endDate: Timestamp,
  plusUrl: "URL pour en savoir plus"
}
```

**Sound Points** (Points Sonores)
```javascript
{
  id: "point_id",
  name: "Nom du lieu",
  gpsCoordinates: "lat, lng",
  partners: ["partner_id_1", "partner_id_2"]
}
```

**Partners** (Partenaires)
```javascript
{
  id: "partner_id",
  name: "Nom du partenaire",
  logoUrl: "URL du logo",
  description: "Description",
  type: "Type de partenaire",
  address: "Adresse",
  phone: "Téléphone",
  website: "Site web"
}
```

---

## 🎨 **Design System**

### **Palette de Couleurs**
- **Primaire** : `#734432` (Marron chaleureux)
- **Secondaire** : `#D2775B` (Orange doux)
- **Accent** : `#d791b4` (Rose loading screen)
- **Texte** : `#403B23` (Marron foncé)
- **Fond** : `#FFFFFF` (Blanc pur)

### **Typographie**
- **Headings** : Inter Bold (`inter-bold`)
- **Sub-headings** : Inter Semi-Bold (`inter-semi-bold`)
- **Body** : Ubuntu Medium (`ubuntu-medium`)
- **Fallback** : Arial, sans-serif

### **Breakpoints Responsive**
```css
Mobile Small:  <= 360px  (font-size: 14px)
Mobile:        <= 375px  (font-size: 14px)
Mobile Large:  >= 500px  (font-size: 17px)
Tablet:        >= 768px  (font-size: 18px, redirection)
```

---

## 🧪 **Scripts Utilitaires**

### **Scrapping d'Images**
```bash
# Utilisation du script Python
python scrapping.py page.html.txt ./assets/images/ https://base-url.com
```

### **Debug Favoris**
```javascript
// Dans la console navigateur
getPopupStatus()        // État actuel du popup
resetPopupCounters()    // Réinitialiser les compteurs
forceShowPopup()        // Forcer l'affichage du popup
```

### **Admin Panel**
Interface complète d'administration accessible via `/admin-panel/` :
- Gestion des événements
- Gestion des partenaires
- Gestion des points sonores
- Import/Export de données

---

## 📱 **Fonctionnalités Avancées**

### **Détection Mobile/Desktop**
```javascript
// Redirection automatique selon le device
const uaData = navigator.userAgentData;
// Redirection vers pages/redirect/ si desktop
```

### **Gestion des Favoris**
```javascript
class FavoritesManager {
  // Système complet de gestion des favoris
  // Stockage persistant multi-niveau
  // Interface utilisateur intégrée
}
```

### **Géolocalisation**
- API Geolocation native
- Calcul de distances
- Intégration Google Maps
- Gestion des erreurs de localisation

---

## 🔧 **API Reference**

### **Principales Fonctions**

**Gestion des Événements**
```javascript
loadFirebaseData()              // Charger tous les événements
showEventDetails(event)         // Afficher les détails d'un événement
formatTime(timestamp)           // Formater l'heure d'affichage
```

**Géolocalisation**
```javascript
fetchGpsCoordinatesForLocation(name)  // Récupérer coordonnées GPS
createGoogleMapsUrl(coordinates)      // Créer URL Google Maps
```

**Favoris**
```javascript
favoritesManager.toggleFavorite(id)   // Ajouter/Retirer des favoris
favoritesManager.loadAndShowFavorites() // Afficher les favoris
```

---

## 🐛 **Debug & Troubleshooting**

### **Problèmes Courants**

**Le popup ne s'affiche pas**
```javascript
// Vérifier la configuration
console.log(CONFIG);
// Forcer l'affichage
forceShowPopup();
// Réinitialiser les compteurs
resetPopupCounters();
```

**Problème de géolocalisation**
- Vérifier les permissions navigateur
- Tester sur HTTPS (requis pour la géolocalisation)
- Vérifier la configuration Google Maps API

**Firebase non connecté**
- Vérifier les clés API dans index.html
- Contrôler les règles Firestore
- Vérifier la configuration CORS

### **Logs de Debug**
```javascript
// Activer les logs détaillés
CONFIG.DEBUG_MODE = true;
// Voir l'état des favoris
getPopupStatus();
```

---

## 👥 **Équipe & Crédits**

**Développement :** Site développé pour [No Id Lab](https://www.noidlab.com)  
**Prestataire :** No Id Lab - Prestataire officiel de la Fête de la Musique à Toulon  
**Client final :** Fête de la Musique - Toulon  
**Technologies :** HTML5, CSS3, JavaScript ES6+, Firebase  

### **Contacts**
- **No Id Lab :** [Site web](https://www.noidlab.com)
- **Support technique :** Contact via No Id Lab

---

## 📄 **Licence**

Ce projet a été développé pour No Id Lab, prestataire officiel de la Fête de la Musique à Toulon.  
Tous droits réservés.

---

## 🔄 **Changelog**

### Version 2.0.0 (Actuelle)
- ✅ Système de popup configurable
- ✅ Gestionnaire de favoris avancé
- ✅ Interface admin complète
- ✅ Géolocalisation améliorée
- ✅ Design responsive optimisé

### Version 1.0.0
- 🎵 Lancement initial du site
- 📱 Version mobile-first
- 🗄️ Intégration Firebase
- 🎪 Programmation de base

---

**Développé pour No Id Lab - Fête de la Musique Toulon 🎵**
