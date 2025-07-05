// Main page JavaScript
function goToSender() {
    window.location.href = '/sender';
}

function goToReceiver() {
    // Check if there's a room code in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        window.location.href = `/receiver?code=${code}`;
    } else {
        window.location.href = '/receiver';
    }
}

function goHome() {
    window.location.href = '/';
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to role cards
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        // Add click effect
        card.addEventListener('click', function() {
            const id = this.id;
            if (id === 'sender-card') {
                goToSender();
            } else if (id === 'receiver-card') {
                goToReceiver();
            }
        });
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === '1') {
            goToSender();
        } else if (e.key === '2') {
            goToReceiver();
        }
    });
});