const featuresList = document.querySelector('.features-list');
const resetHelper = document.getElementById('reset-helper');
const listViewHelper = document.getElementById('list-view-helper');
const doubleClickHelper = document.querySelectorAll('.feature-item')[2];

if (window.innerWidth <= 900) {
    if (resetHelper) resetHelper.querySelector('.feature-key').innerText = 'Tap';
    if (listViewHelper) listViewHelper.querySelector('.feature-key').innerText = 'Tap';
    if (doubleClickHelper) doubleClickHelper.querySelector('.feature-key').innerText = 'Double Tap';
    
    const dragMsg = document.getElementById('drag-msg');
    if (dragMsg) dragMsg.innerText = 'Drag to Explore';
}

if (resetHelper) {
    resetHelper.addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    });
}
if (listViewHelper) {
    listViewHelper.addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    });
}
