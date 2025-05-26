// Popup FDLM - Affichage toutes les 3 visites
(function() {
  const POPUP_KEY = 'fdlm_popup_shown_count';
  const SHOW_EVERY = 3; // Affiche toutes les 3 visites

  function getVisitCount() {
    const count = localStorage.getItem(POPUP_KEY);
    return count ? parseInt(count, 10) : 0;
  }

  function incrementVisitCount() {
    let count = getVisitCount();
    count++;
    localStorage.setItem(POPUP_KEY, count);
    return count;
  }

  function shouldShowPopup() {
    let count = incrementVisitCount();
    return count % SHOW_EVERY === 1;
  }

  function createPopup() {
    // Personnalise ici l'image, le titre, le texte, etc.
    const imageUrl = 'https://static.apidae-tourisme.com/filestore/objets-touristiques/images/158/177/2797982.jpg'; // Change si besoin
    const title = "Bienvenue à la Fête de la Musique !";
    const desc = "Découvre la programmation, les artistes et les événements proches de chez toi. Prêt à vibrer au rythme de la musique ?";
    const btnText = "Y aller";

    const overlay = document.createElement('div');
    overlay.className = 'fdlm-popup-overlay';
    overlay.innerHTML = `
      <div class="fdlm-popup">
        <button class="fdlm-popup-close" aria-label="Fermer">&times;</button>
        <img class="fdlm-popup-image" src="${imageUrl}" alt="Fête de la Musique">
        <div class="fdlm-popup-content">
          <div class="fdlm-popup-title">${title}</div>
          <div class="fdlm-popup-desc">${desc}</div>
          <button class="fdlm-popup-btn">${btnText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Fermeture popup (croix ou bouton)
    overlay.querySelector('.fdlm-popup-close').onclick = closePopup;
    overlay.querySelector('.fdlm-popup-btn').onclick = closePopup;
    overlay.onclick = function(e) {
      if (e.target === overlay) closePopup();
    };

    function closePopup() {
      overlay.classList.add('fdlm-popup-hide');
      setTimeout(() => overlay.remove(), 250);
    }
  }

  // Affichage automatique si besoin
  if (shouldShowPopup()) {
    window.addEventListener('DOMContentLoaded', createPopup);
  }
})();
