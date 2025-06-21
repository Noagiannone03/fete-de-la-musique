// Popup FDLM - Affichage configurable
(function() {
  // === CONFIGURATION ===
  const CONFIG = {
    // Options d'affichage (choisir UNE seule option) :
    
    // Option 1: Afficher à chaque visite (pour les tests)
    SHOW_ALWAYS: true,  // ← Activé : popup à chaque visite !
    
    // Option 2: Afficher toutes les X visites
    SHOW_EVERY_X_VISITS: {
      enabled: false,
      interval: 3  // Affiche toutes les 3 visites (1ère, 4ème, 7ème, etc.)
    },
    
    // Option 3: Afficher une seule fois par session
    SHOW_ONCE_PER_SESSION: {
      enabled: false  // ← Désactivé
    },
    
    // Option 4: Afficher une seule fois au total (jamais plus)
    SHOW_ONCE_FOREVER: {
      enabled: false
    },
    
    // Debug: afficher les logs dans la console
    DEBUG_MODE: true,  // ← Réactivé pour vérifier que ça marche
    
    // Délai avant affichage du popup (en millisecondes)
    DISPLAY_DELAY: 200  // ← 2 secondes après le chargement
  };

  const STORAGE_KEYS = {
    VISIT_COUNT: 'fdlm_popup_visit_count',
    SESSION_SHOWN: 'fdlm_popup_session_shown',
    FOREVER_SHOWN: 'fdlm_popup_forever_shown'
  };

  function log(message, data = null) {
    if (CONFIG.DEBUG_MODE) {
      console.log('[POPUP FDLM]', message, data || '');
    }
  }

  function getStorageValue(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      log('Erreur localStorage:', e.message);
      return defaultValue;
    }
  }

  function setStorageValue(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      log('Erreur écriture localStorage:', e.message);
      return false;
    }
  }

  function getSessionValue(key, defaultValue = null) {
    try {
      const value = sessionStorage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      log('Erreur sessionStorage:', e.message);
      return defaultValue;
    }
  }

  function setSessionValue(key, value) {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      log('Erreur écriture sessionStorage:', e.message);
      return false;
    }
  }

  function shouldShowPopup() {
    log('=== VÉRIFICATION AFFICHAGE POPUP ===');
    
    // Option 1: Toujours afficher (pour debug/tests)
    if (CONFIG.SHOW_ALWAYS) {
      log('✅ Mode SHOW_ALWAYS activé - popup affiché');
      return true;
    }
    
    // Option 2: Toutes les X visites
    if (CONFIG.SHOW_EVERY_X_VISITS.enabled) {
      let visitCount = parseInt(getStorageValue(STORAGE_KEYS.VISIT_COUNT, '0'), 10);
      visitCount++;
      setStorageValue(STORAGE_KEYS.VISIT_COUNT, visitCount.toString());
      
      log(`Visite numéro: ${visitCount}`);
      log(`Intervalle configuré: ${CONFIG.SHOW_EVERY_X_VISITS.interval}`);
      
      const shouldShow = visitCount % CONFIG.SHOW_EVERY_X_VISITS.interval === 1;
      
      if (shouldShow) {
        log('✅ Popup affiché (toutes les X visites)');
      } else {
        log(`❌ Popup non affiché - prochaine fois à la visite ${visitCount + (CONFIG.SHOW_EVERY_X_VISITS.interval - (visitCount % CONFIG.SHOW_EVERY_X_VISITS.interval))}`);
      }
      
      return shouldShow;
    }
    
    // Option 3: Une fois par session
    if (CONFIG.SHOW_ONCE_PER_SESSION.enabled) {
      const sessionShown = getSessionValue(STORAGE_KEYS.SESSION_SHOWN);
      if (sessionShown) {
        log('❌ Popup déjà affiché dans cette session');
        return false;
      }
      
      setSessionValue(STORAGE_KEYS.SESSION_SHOWN, 'true');
      log('✅ Popup affiché (première fois de la session)');
      return true;
    }
    
    // Option 4: Une seule fois pour toujours
    if (CONFIG.SHOW_ONCE_FOREVER.enabled) {
      const foreverShown = getStorageValue(STORAGE_KEYS.FOREVER_SHOWN);
      if (foreverShown) {
        log('❌ Popup déjà affiché définitivement');
        return false;
      }
      
      setStorageValue(STORAGE_KEYS.FOREVER_SHOWN, 'true');
      log('✅ Popup affiché (première et dernière fois)');
      return true;
    }
    
    log('❌ Aucune condition d\'affichage activée');
    return false;
  }

  function createPopup() {
    log('🎨 Création du popup...');
    
    // Vidéo du popup - optimisée pour le chargement mobile
    const videoUrl = 'assets/videos/4nap-phone.mov';
    // URL de redirection - change cette URL pour ta destination
    const redirectUrl = 'https://fb.me/e/2lyU8hYyY';

    const overlay = document.createElement('div');
    overlay.className = 'fdlm-popup-overlay';
    overlay.innerHTML = `
      <div class="fdlm-popup">
        <button class="fdlm-popup-close" aria-label="Fermer">&times;</button>
        <video 
          class="fdlm-popup-video" 
          src="${videoUrl}" 
          preload="metadata"
          muted
          autoplay
          loop
          playsinline
          webkit-playsinline
          style="cursor: pointer; width: 100%; height: auto; max-height: 80vh; object-fit: contain;"
          poster=""
          onloadstart="console.log('[POPUP] Début du chargement vidéo')"
          oncanplay="console.log('[POPUP] Vidéo prête à être lue')"
          onerror="console.error('[POPUP] Erreur de chargement vidéo'); this.style.display='none';"
        >
          Votre navigateur ne supporte pas la vidéo HTML5.
        </video>
      </div>
    `;
    
    // Ajouter au body
    document.body.appendChild(overlay);
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';

    log('✅ Popup créé et affiché');

    // Fermeture popup
    const closeBtn = overlay.querySelector('.fdlm-popup-close');
    const popup = overlay.querySelector('.fdlm-popup');
    const popupVideo = overlay.querySelector('.fdlm-popup-video');
    
    // Optimisations vidéo pour mobile
    if (popupVideo) {
      // Forcer le démarrage de la vidéo
      popupVideo.load();
      
      // Gestion des événements vidéo
      popupVideo.addEventListener('loadedmetadata', () => {
        log('📹 Métadonnées vidéo chargées');
      });
      
      popupVideo.addEventListener('canplay', () => {
        log('📹 Vidéo prête à être lue');
        // Tenter de lancer la vidéo
        const playPromise = popupVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            log('⚠️ Autoplay bloqué, vidéo en attente d\'interaction:', error.message);
          });
        }
      });
      
      popupVideo.addEventListener('error', (e) => {
        log('❌ Erreur de chargement vidéo:', e);
        // Fallback : masquer la vidéo et afficher un message
        popupVideo.style.display = 'none';
        const errorMsg = document.createElement('div');
        errorMsg.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">Impossible de charger la vidéo</p>';
        popup.appendChild(errorMsg);
      });
    }
    
    function closePopup(e) {
      if (e) e.preventDefault();
      log('❌ Fermeture du popup');
      
      // Arrêter la vidéo avant de fermer
      if (popupVideo && !popupVideo.paused) {
        popupVideo.pause();
        popupVideo.currentTime = 0;
      }
      
      overlay.classList.add('fdlm-popup-hide');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }

    // Redirection au clic sur la vidéo
    function redirectToUrl(e) {
      e.preventDefault();
      e.stopPropagation();
      log('🔗 Redirection vers:', redirectUrl);
      closePopup();
      // Petit délai pour laisser l'animation de fermeture se terminer
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 200);
    }

    // Événements de fermeture
    closeBtn.addEventListener('click', closePopup);
    closeBtn.addEventListener('touchend', closePopup);
    
    // Événement de redirection sur la vidéo
    if (popupVideo) {
      popupVideo.addEventListener('click', redirectToUrl);
      popupVideo.addEventListener('touchend', redirectToUrl);
    }
    
    // Fermer en cliquant sur l'overlay (mais pas sur la vidéo)
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
      // Ne pas empêcher le clic sur la vidéo
      if (e.target !== popupVideo) {
        e.preventDefault();
      }
    });
  }

  function waitForLoadingScreenToHide() {
    return new Promise((resolve) => {
      const loadingScreen = document.querySelector('.loading-screen');
      
      if (!loadingScreen) {
        log('Pas d\'écran de chargement détecté');
        resolve();
        return;
      }
      
      // Si l'écran de chargement est déjà caché
      if (loadingScreen.classList.contains('hide')) {
        log('Écran de chargement déjà masqué');
        resolve();
        return;
      }
      
      log('Attente de la fin de l\'écran de chargement...');
      
      // Observer les changements de classe
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (loadingScreen.classList.contains('hide')) {
              log('Écran de chargement masqué détecté');
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
        log('Timeout écran de chargement - continuation forcée');
        observer.disconnect();
        resolve();
      }, 5000);
    });
  }

  async function initPopup() {
    log('🚀 Initialisation du popup...');
    
    // Vérifier si on doit afficher le popup
    if (shouldShowPopup()) {
      log('⏳ Popup autorisé - préparation de l\'affichage...');
      
      // Attendre que le DOM soit complètement chargé
      if (document.readyState === 'loading') {
        log('Attente du chargement du DOM...');
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Attendre que l'écran de chargement disparaisse
      await waitForLoadingScreenToHide();
      
      // Afficher le popup après un petit délai
      log(`Affichage du popup dans ${CONFIG.DISPLAY_DELAY}ms...`);
      setTimeout(createPopup, CONFIG.DISPLAY_DELAY);
    } else {
      log('🚫 Popup non affiché selon les conditions configurées');
    }
  }

  // === FONCTIONS UTILITAIRES POUR DEBUG ===
  
  // Fonction pour réinitialiser les compteurs (utile pour les tests)
  window.resetPopupCounters = function() {
    try {
      localStorage.removeItem(STORAGE_KEYS.VISIT_COUNT);
      localStorage.removeItem(STORAGE_KEYS.FOREVER_SHOWN);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_SHOWN);
      console.log('✅ Compteurs popup réinitialisés');
    } catch (e) {
      console.error('❌ Erreur lors de la réinitialisation:', e);
    }
  };

  // Fonction pour forcer l'affichage du popup (utile pour les tests)
  window.forceShowPopup = function() {
    createPopup();
    console.log('✅ Popup forcé');
  };

  // Fonction pour voir l'état actuel
  window.getPopupStatus = function() {
    const status = {
      visitCount: getStorageValue(STORAGE_KEYS.VISIT_COUNT, '0'),
      sessionShown: getSessionValue(STORAGE_KEYS.SESSION_SHOWN),
      foreverShown: getStorageValue(STORAGE_KEYS.FOREVER_SHOWN),
      config: CONFIG
    };
    console.table(status);
    return status;
  };

  log('📋 Fonctions debug disponibles:');
  log('- resetPopupCounters() : réinitialise les compteurs');
  log('- forceShowPopup() : force l\'affichage du popup');
  log('- getPopupStatus() : affiche l\'état actuel');

  // Démarrer l'initialisation
  initPopup();
})();
