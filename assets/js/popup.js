// Popup FDLM - Affichage toutes les 3 visites
(function() {
  const POPUP_KEY = 'fdlm_popup_shown_count';
  const SHOW_EVERY = 3; // Affiche toutes les 3 visites

  function getVisitCount() {
    try {
      const count = localStorage.getItem(POPUP_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch (e) {
      // Fallback si localStorage n'est pas disponible (mode privé Safari)
      return 0;
    }
  }

  function incrementVisitCount() {
    try {
      let count = getVisitCount();
      count++;
      localStorage.setItem(POPUP_KEY, count);
      return count;
    } catch (e) {
      // Fallback si localStorage n'est pas disponible
      return 1;
    }
  }

  function shouldShowPopup() {
    let count = incrementVisitCount();
    return count % SHOW_EVERY === 1;
  }

  function createPopup() {
    // Image du popup - change cette URL pour ton image
    const imageUrl = 'assets/images/popup.png';
    // URL de redirection - change cette URL pour ta destination
    const redirectUrl = '4nap-festival.fr';

    const overlay = document.createElement('div');
    overlay.className = 'fdlm-popup-overlay';
    overlay.innerHTML = `
      <div class="fdlm-popup">
        <button class="fdlm-popup-close" aria-label="Fermer">&times;</button>
        <img class="fdlm-popup-image" src="${imageUrl}" alt="Fête de la Musique" loading="eager" style="cursor: pointer;">
      </div>
    `;
    
    // Ajouter au body
    document.body.appendChild(overlay);
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';

    // Fermeture popup
    const closeBtn = overlay.querySelector('.fdlm-popup-close');
    const popup = overlay.querySelector('.fdlm-popup');
    const popupImage = overlay.querySelector('.fdlm-popup-image');
    
    function closePopup(e) {
      if (e) e.preventDefault();
      overlay.classList.add('fdlm-popup-hide');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }

    // Redirection au clic sur l'image
    function redirectToUrl(e) {
      e.preventDefault();
      e.stopPropagation();
      closePopup();
      // Petit délai pour laisser l'animation de fermeture se terminer
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 200);
    }

    // Événements de fermeture
    closeBtn.addEventListener('click', closePopup);
    closeBtn.addEventListener('touchend', closePopup);
    
    // Événement de redirection sur l'image
    popupImage.addEventListener('click', redirectToUrl);
    popupImage.addEventListener('touchend', redirectToUrl);
    
    // Fermer en cliquant sur l'overlay (mais pas sur l'image)
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closePopup(e);
      }
    });
    
    // Fermer avec la touche Échap
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        closePopup(e);
        document.removeEventListener('keydown', handleKeyDown);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    
    // Gestion spéciale pour iOS - empêcher le zoom sur double-tap
    popup.addEventListener('touchstart', function(e) {
      // Ne pas empêcher le clic sur l'image
      if (e.target !== popupImage) {
        e.preventDefault();
      }
    });
  }

  function waitForLoadingScreenToHide() {
    return new Promise((resolve) => {
      const loadingScreen = document.querySelector('.loading-screen');
      
      if (!loadingScreen) {
        // Pas d'écran de chargement, on peut continuer
        resolve();
        return;
      }
      
      // Si l'écran de chargement est déjà caché
      if (loadingScreen.classList.contains('hide')) {
        resolve();
        return;
      }
      
      // Observer les changements de classe
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (loadingScreen.classList.contains('hide')) {
              observer.disconnect();
              // Attendre encore un peu pour être sûr que l'animation est finie
              setTimeout(resolve, 800);
            }
          }
        });
      });
      
      observer.observe(loadingScreen, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Fallback - si rien ne se passe après 5 secondes
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 5000);
    });
  }

  async function initPopup() {
    // Vérifier si on doit afficher le popup
    if (shouldShowPopup()) {
      // Attendre que le DOM soit complètement chargé
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Attendre que l'écran de chargement disparaisse
      await waitForLoadingScreenToHide();
      
      // Afficher le popup après un petit délai
      setTimeout(createPopup, 1000);
    }
  }

  // Démarrer l'initialisation
  initPopup();
})();
