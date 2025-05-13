document.addEventListener('DOMContentLoaded', function() {
    // Références aux éléments UI
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    
    // Fonction améliorée pour afficher une page avec transition fluide
    function showPage(pageId) {
        // Trouver la page active actuelle
        const currentActivePage = document.querySelector('.page.active');
        // Trouver la nouvelle page à afficher
        const newPage = document.getElementById(pageId + '-page');
        
        if (!newPage) {
            console.error('Page non trouvée:', pageId + '-page');
            return;
        }
        
        // Si une page est déjà active, faire d'abord la transition de sortie
        if (currentActivePage && currentActivePage !== newPage) {
            // Animation de sortie
            currentActivePage.style.opacity = '0';
            currentActivePage.style.transform = 'translateX(-20px)';
            
            // Attendre que l'animation de sortie soit terminée avant d'afficher la nouvelle page
            setTimeout(() => {
                currentActivePage.classList.remove('active');
                
                // Animation d'entrée pour la nouvelle page
                newPage.style.opacity = '0';
                newPage.style.transform = 'translateX(20px)';
                newPage.classList.add('active');
                
                // Petit délai pour que le navigateur prenne en compte le changement
                setTimeout(() => {
                    newPage.style.opacity = '1';
                    newPage.style.transform = 'translateX(0)';
                }, 20);
            }, 300); // Attendre 300ms (durée de l'animation de sortie)
        } else {
            // Aucune page active, afficher directement la nouvelle page
            newPage.style.opacity = '0';
            newPage.style.transform = 'translateX(20px)';
            newPage.classList.add('active');
            
            setTimeout(() => {
                newPage.style.opacity = '1';
                newPage.style.transform = 'translateX(0)';
            }, 20);
        }
        
        // Mettre à jour l'élément actif du menu
        menuItems.forEach(item => {
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Fermer le menu sur mobile après la sélection
        if (window.innerWidth < 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        }
    }
    
    // Gestion des clics sur les éléments du menu
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });
    
    // Toggle du menu sur mobile
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    });
    
    // Fermer le menu quand on clique sur l'overlay
    sidebarOverlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
    
    // Correction des liens de menu pour correspondre aux pages
    function setupMenuLinks() {
        // Trouver tous les éléments de menu
        const allMenuItems = document.querySelectorAll('.sidebar-menu .menu-item');
        
        // Map corrigé - la page summer-events est distincte de partners-list
        const linkToPageMap = {
            'dashboard': 'dashboard',
            'summer-events': 'summer-events', // Maintenir "summer-events" comme une page distincte
            'add-event': 'add-event',
            'add-partner': 'add-partner'
        };
        
        // Corriger les attributs data-page
        allMenuItems.forEach(item => {
            const dataPage = item.getAttribute('data-page');
            const correctPage = linkToPageMap[dataPage];
            
            if (correctPage) {
                item.setAttribute('data-page', correctPage);
            }
            
            // Si c'est le lien "Ajouter un partenaire", s'assurer qu'il pointe vers add-partner
            const spanText = item.querySelector('span')?.textContent.trim();
            if (spanText === 'Ajouter un partenaire') {
                item.setAttribute('data-page', 'add-partner');
            }
        });
    }
    
    // Assurer que les identifiants des pages correspondent aux liens du menu
    function fixPageIds() {
        // S'assurer que la page summer-events existe et est bien nommée
        const summerEventsPage = document.getElementById('summer-events-page');
        
        // Si la page n'existe pas, vérifier si elle est sous un autre nom
        if (!summerEventsPage) {
            const partnersList = document.getElementById('partners-list-page');
            if (partnersList) {
                // Ne pas renommer partners-list en summer-events
                // Au lieu de cela, nous allons laisser les deux pages distinctes
            }
        }
        
        // S'assurer que la page add-partner existe
        const addPartnerPage = document.getElementById('add-partner-page');
        if (!addPartnerPage) {
            console.warn("La page 'add-partner-page' n'a pas été trouvée.");
        }
    }
    
    // Ajouter du CSS pour les animations
    function addAnimationStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .page {
                opacity: 0;
                transition: opacity 0.3s ease, transform 0.3s ease;
                display: none;
                position: absolute;
                width: 100%;
            }
            
            .page.active {
                display: block;
                position: relative;
            }
            
            .sidebar {
                transition: transform 0.3s ease;
            }
            
            .sidebar.open {
                transform: translateX(0);
            }
            
            @media (max-width: 767px) {
                .sidebar {
                    transform: translateX(-100%);
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    z-index: 1000;
                }
                
                .sidebar-overlay {
                    display: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                }
                
                .sidebar-overlay.active {
                    display: block;
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
    
   
    
    // Exécuter les fonctions de mise en place
    setupMenuLinks();
    fixPageIds();
    addAnimationStyles();
    addDashboardNavigation();
    
    // Initialiser la page d'accueil (dashboard)
    showPage('dashboard');
});




// Correction des problèmes HTML et ajout de fonctionnalités

document.addEventListener('DOMContentLoaded', function() {
    // 1. Correction des liens du menu de navigation
    fixNavigationLinks();
    
    // 2. Ajout des en-têtes de tableau manquants
    addTableHeaders();
    
    // 3. Configuration du compteur pour la fête de la musique
    setupCountdownTimer();
    
    // 4. Simulation des données pour le tableau de bord
    setupDashboardData();
    
    // 5. Assurer que la page des événements d'été est accessible depuis le dashboard
    setupSummerEventsNavigation();
});

// Fonction pour corriger les liens de navigation
function fixNavigationLinks() {
    // Trouver les liens du menu
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    
    // Texte à rechercher pour chaque page
    const menuTextMap = {
        'Tableau de bord': 'dashboard',
        'Liste des partenaires': 'partners-list',
        'Ajouter un événement': 'add-event',
        'Ajouter un partenaire': 'add-partner'
    };
    
    // Mettre à jour les attributs data-page en fonction du texte
    menuItems.forEach(item => {
        const spanElement = item.querySelector('span');
        if (spanElement) {
            const text = spanElement.textContent.trim();
            if (menuTextMap[text]) {
                item.setAttribute('data-page', menuTextMap[text]);
            }
        }
    });
}






// Fonction pour configurer la navigation entre le dashboard et les événements d'été
function setupSummerEventsNavigation() {
    // S'assurer que la page summer-events-page existe
    let summerEventsPage = document.getElementById('summer-events-page');
    
    // Si la page n'existe pas, nous utilisons le HTML fourni
    if (!summerEventsPage) {
        console.warn("La page des événements d'été n'a pas été trouvée. Elle devrait avoir l'ID 'summer-events-page'.");
    }
    
    // Ajouter un style CSS personnalisé pour l'animation de rafraîchissement
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .stats-card.refreshing {
            animation: pulse 0.5s ease;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status.confirmed {
            background-color: rgba(22, 163, 74, 0.1);
            color: rgb(22, 163, 74);
        }
        
        .status.pending {
            background-color: rgba(245, 158, 11, 0.1);
            color: rgb(245, 158, 11);
        }
        
        .actions {
            display: flex;
            gap: 8px;
        }
        
        .action-btn {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .action-btn.view {
            background-color: rgba(59, 130, 246, 0.1);
            color: rgb(59, 130, 246);
        }
        
        .action-btn.edit {
            background-color: rgba(245, 158, 11, 0.1);
            color: rgb(245, 158, 11);
        }
        
        .action-btn.delete {
            background-color: rgba(239, 68, 68, 0.1);
            color: rgb(239, 68, 68);
        }
        
        .action-btn:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(styleElement);
}