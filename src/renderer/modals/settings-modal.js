import { setLanguage } from '../localization.js';

export function loadSettingsModal(modalFile) {
    fetch(modalFile)
        .then(response => response.text())
        .then(html => {
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = html;
            document.body.appendChild(modalContainer);

            // Display the modal
            const modal = modalContainer.querySelector('#settings-modal');
            modal.style.display = 'block';

            const currentLanguage = localStorage.getItem('defaultLanguage') || 'en';
            const languageSelect = modalContainer.querySelector('#default-language');
            if (languageSelect) {
                languageSelect.value = currentLanguage;
            }

            attachEventListeners(modalContainer, modal);
        })
        .catch(err => console.error('Error loading modal:', err));
}

function attachEventListeners(modalContainer, modal) {
    const closeModalButton = modalContainer.querySelector('#close-settings');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            modal.style.display = 'none';
            modalContainer.remove();
        });
    }

    const saveButton = modalContainer.querySelector('#save-settings');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const defaultLanguage = modalContainer.querySelector('#default-language').value;
            localStorage.setItem('defaultLanguage', defaultLanguage);
            setLanguage(defaultLanguage);
            modal.style.display = 'none';
            modalContainer.remove();
        });
    }
}