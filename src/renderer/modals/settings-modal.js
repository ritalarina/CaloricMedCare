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

            // Add close behavior
            modalContainer.querySelector('#close-settings').addEventListener('click', () => {
                modal.style.display = 'none';
                modalContainer.remove();
            });
        })
        .catch(err => console.error('Error loading modal:', err));
}