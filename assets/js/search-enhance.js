// assets/js/search-enhance.js
// Sichere Erweiterung für Hinode FlexSearch ohne Theme-Konflikte

(function() {
  'use strict';

  // Warten bis Hinode komplett geladen ist
  function waitForHinode() {
    return new Promise((resolve) => {
      // Prüfen ob FlexSearch und Hinode bereit sind
      const checkReady = setInterval(() => {
        if (typeof FlexSearch !== 'undefined' && document.querySelector('[data-search-input]')) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      
      // Timeout nach 10 Sekunden
      setTimeout(() => {
        clearInterval(checkReady);
        console.warn('Hinode search not found, skipping enhancement');
      }, 10000);
    });
  }

  // Kontext um Suchtreffer extrahieren
  function getContextSnippet(text, searchTerm, contextLength = 150) {
    if (!text || !searchTerm) return '';
    
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    
    if (index === -1) return text.substring(0, contextLength) + '...';
    
    let start = Math.max(0, index - contextLength / 2);
    let end = Math.min(text.length, index + searchTerm.length + contextLength / 2);
    
    // An Wortgrenzen ausrichten
    if (start > 0) {
      const spaceIndex = text.lastIndexOf(' ', start);
      if (spaceIndex !== -1) start = spaceIndex + 1;
    }
    
    if (end < text.length) {
      const spaceIndex = text.indexOf(' ', end);
      if (spaceIndex !== -1) end = spaceIndex;
    }
    
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }

  // Text mit Highlighting versehen
  function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // Suchergebnisse verbessern
  function enhanceSearchResults(query) {
    // Kurze Verzögerung damit Hinode seine Ergebnisse rendern kann
    setTimeout(() => {
      const resultItems = document.querySelectorAll('[data-search-results] .list-group-item, [data-search-results] .card');
      
      if (resultItems.length === 0) return;
      
      resultItems.forEach((item) => {
        try {
          // Content/Description finden und anpassen
          const contentElement = item.querySelector('.card-text, p');
          if (contentElement && query) {
            const originalText = contentElement.getAttribute('data-original') || contentElement.textContent;
            
            // Original speichern falls noch nicht geschehen
            if (!contentElement.getAttribute('data-original')) {
              contentElement.setAttribute('data-original', originalText);
            }
            
            // Kontext-Snippet erstellen
            const snippet = getContextSnippet(originalText, query);
            const highlighted = highlightText(snippet, query);
            contentElement.innerHTML = highlighted;
          }
          
          // Titel highlighten
          const titleElement = item.querySelector('.card-title, h3, h4, h5, h6, a');
          if (titleElement && query) {
            const originalTitle = titleElement.getAttribute('data-original-title') || titleElement.textContent;
            
            if (!titleElement.getAttribute('data-original-title')) {
              titleElement.setAttribute('data-original-title', originalTitle);
            }
            
            const highlighted = highlightText(originalTitle, query);
            titleElement.innerHTML = highlighted;
          }
        } catch (e) {
          console.warn('Error enhancing result:', e);
        }
      });
    }, 100);
  }

  // Suchfeld überwachen
  function observeSearch() {
    const searchInput = document.querySelector('[data-search-input]');
    if (!searchInput) return;

    let debounceTimer;
    
    // Input Event Listener
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          enhanceSearchResults(query);
        }
      }, 300);
    });
  }

  // Initialisierung
  async function init() {
    try {
      await waitForHinode();
      observeSearch();
      console.log('Search enhancement initialized');
    } catch (e) {
      console.error('Failed to initialize search enhancement:', e);
    }
  }

  // Starten wenn DOM bereit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
