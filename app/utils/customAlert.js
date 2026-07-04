export const customAlert = (message, title = 'Notification', onConfirm = null) => {
    if (typeof window === 'undefined') return;

    // If a dialog already exists, remove it
    const existing = document.getElementById('dripp-custom-dialog-overlay');
    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'dripp-custom-dialog-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 5, 5, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '100000',
        opacity: '0',
        transition: 'opacity 0.2s ease'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
        background: '#111',
        border: '1px solid rgba(235, 215, 63, 0.2)',
        padding: '40px',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        transform: 'scale(0.95)',
        transition: 'transform 0.2s ease',
        fontFamily: "'Inter', sans-serif"
    });

    const titleEl = document.createElement('h3');
    titleEl.innerText = title;
    Object.assign(titleEl.style, {
        fontSize: '24px',
        color: '#ebd73f',
        margin: '0 0 20px 0',
        fontFamily: "'Panchang', sans-serif"
    });

    const msgEl = document.createElement('p');
    msgEl.innerText = message;
    Object.assign(msgEl.style, {
        fontSize: '16px',
        color: '#ccc',
        marginBottom: '30px',
        lineHeight: '1.5'
    });

    const btnContainer = document.createElement('div');
    Object.assign(btnContainer.style, {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center'
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'OK';
    Object.assign(closeBtn.style, {
        flex: '1',
        padding: '12px',
        background: '#ebd73f',
        border: 'none',
        color: '#111',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold'
    });

    const removeDialog = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        setTimeout(() => overlay.remove(), 200);
    };

    closeBtn.onclick = () => {
        if (onConfirm) onConfirm();
        removeDialog();
    };

    btnContainer.appendChild(closeBtn);
    modal.appendChild(titleEl);
    modal.appendChild(msgEl);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Trigger animations
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });
};

export const customConfirm = (message, onConfirm, title = 'Confirm Action') => {
    if (typeof window === 'undefined') return;

    // If a dialog already exists, remove it
    const existing = document.getElementById('dripp-custom-dialog-overlay');
    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'dripp-custom-dialog-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 5, 5, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '100000',
        opacity: '0',
        transition: 'opacity 0.2s ease'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
        background: '#111',
        border: '1px solid rgba(235, 215, 63, 0.2)',
        padding: '40px',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        transform: 'scale(0.95)',
        transition: 'transform 0.2s ease',
        fontFamily: "'Inter', sans-serif"
    });

    const titleEl = document.createElement('h3');
    titleEl.innerText = title;
    Object.assign(titleEl.style, {
        fontSize: '24px',
        color: '#ebd73f',
        margin: '0 0 20px 0',
        fontFamily: "'Panchang', sans-serif"
    });

    const msgEl = document.createElement('p');
    msgEl.innerText = message;
    Object.assign(msgEl.style, {
        fontSize: '16px',
        color: '#ccc',
        marginBottom: '30px',
        lineHeight: '1.5'
    });

    const btnContainer = document.createElement('div');
    Object.assign(btnContainer.style, {
        display: 'flex',
        gap: '15px',
        justifyContent: 'center'
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    Object.assign(cancelBtn.style, {
        flex: '1',
        padding: '12px',
        background: 'transparent',
        border: '1px solid #444',
        color: '#888',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold'
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = 'Confirm';
    Object.assign(confirmBtn.style, {
        flex: '1',
        padding: '12px',
        background: '#ebd73f',
        border: 'none',
        color: '#111',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold'
    });

    const removeDialog = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        setTimeout(() => overlay.remove(), 200);
    };

    cancelBtn.onclick = () => {
        removeDialog();
    };

    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        removeDialog();
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    
    modal.appendChild(titleEl);
    modal.appendChild(msgEl);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Trigger animations
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });
};
