document.getElementById('cart-btn').addEventListener('click', function() {
    document.getElementById('checkout-modal').style.display = 'flex';
});

document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('checkout-modal').style.display = 'none';
});

window.addEventListener('click', function(e) {
    const modal = document.getElementById('checkout-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});
