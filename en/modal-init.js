document.addEventListener("DOMContentLoaded", function() {
    // Check if modals are already on the page (to avoid duplicates)
    if (document.getElementById('checkoutModal')) return;

    const modalHTML = `
    <div id="checkoutModal" class="modal">
        <div class="modal-box">
            <button class="close-btn" onclick="closeCheckout()">&times;</button>
            
            <div class="checkout-header">
                <h2 class="modal-title"><span>Placing</span> an order</h2>
            </div>

            <div id="modal-main-content" class="checkout-grid">
                <div class="checkout-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Surname and First Name</label>
                            <input type="text" id="cust-name" placeholder="Your name">
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="cust-phone" placeholder="+380..." maxlength="13">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Delivery Method</label>
                        <select id="cust-delivery">
                            <option value="Nova Poshta (Branch)">Nova Poshta (Branch)</option>
                            <option value="Nova Poshta (Parcel Locker)">Nova Poshta (Parcel Locker)</option>
                            <option value="Ukrposhta">Ukrposhta</option>
                            <option value="Nova Poshta (Courier)">Nova Poshta (Courier)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Payment method</label>
                        <select id="cust-payment">
                            <option value="Online payment (prepayment)">Online payment (prepayment)</option>
                            <option value="Cash on delivery">Cash on delivery</option>
                        </select>
                        <div id="cod-payment-hint" style="display:none; color: var(--primary-orange); font-size: 13px; margin-top: 5px; font-style: italic; line-height: 1.3;">
                            ℹ️ Please note that Nova Poshta charges a fee for money transfer (~2% of amount + 20 UAH).
                        </div>
                        <div id="online-payment-hint" style="display:none; color: var(--primary-orange); font-size: 13px; margin-top: 5px; font-style: italic; line-height: 1.3;">
                            ℹ️ The item will be shipped only after payment is confirmed. Payment details and links will appear immediately after checkout and will be duplicated to your Email.
                        </div>
                    </div>

                    <div class="form-group">
                        <label>City (start typing...)</label>
                        <div style="position: relative;">
                            <input type="text" id="cust-city" placeholder="E.g., Kyiv" autocomplete="off">
                            <div id="city-suggestions" class="np-suggestions"></div>
                        </div>
                        <small>Ukrainian cities only</small>
                    </div>

                    <div class="form-group" id="branch-group">
                        <label>Branch or parcel locker (number or address)</label>
                        <div style="position: relative;">
                            <input type="text" id="cust-branch-input" placeholder="Enter number or name..." autocomplete="off">
                            <div id="branch-suggestions" class="np-suggestions"></div>
                        </div>
                        <input type="hidden" id="cust-branch">
                    </div>

                    <div class="form-group">
                        <label>E-mail</label>
                        <input type="email" id="email">
                    </div>

                    <div class="form-group">
                        <label>Order comment</label>
                        <textarea id="cust-comment"></textarea>
                    </div>

                    <div style="position: absolute; left: -9999px; opacity: 0;">
                        <input type="text" id="website_url" tabindex="-1" autocomplete="off">
                    </div>
                </div>

                <div class="checkout-summary">
                    <div class="summary-header-row">
                        <h3 class="summary-title">Your order</h3>
                        <button onclick="clearFullCart()" class="clear-cart-btn">Clear cart</button>
                    </div>
                    <div id="final-list" class="cart-items-list"></div> 
                    <div class="cart-total-block">
                        <div class="total-row">
                            <span>total:</span>
                            <span class="total-price-display"><span id="final-price">0.00</span> ₴</span>
                        </div>
                        <button class="order-btn" onclick="submitOrder()">Submit Order</button>
                    </div>
                </div>
            </div>

            <div id="success-msg" style="display:none; text-align: center; padding: 50px 20px;">
                <h2 style="color: var(--primary-orange);">🌿 Order accepted!</h2>
                <p>Number: <strong id="orderNumberDisplay"></strong></p>
                <p>Thank you! If you selected online payment, please pay according to the details below so we can start shipping. When paying, please indicate the order number. If you selected cash on delivery - we will contact you soon. All order details have been duplicated to your email 🔥.</p>
                <div id="payment-details-success" style="display:none; margin-top: 30px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 20px;"></div>
                <button class="order-btn" style="max-width: 200px; margin: 20px auto 0;" onclick="closeCheckout()">Close</button>
            </div>
        </div>
    </div>

    <div id="notifyModal" class="modal">
        <div class="modal-box" style="max-width: 500px; padding: 40px; text-align: center;">
            <button class="close-btn" onclick="document.getElementById('notifyModal').style.display='none'">&times;</button>
            <h2 class="modal-title">Notify me about <span>launch</span></h2>
            <p style="margin: 20px 0; opacity: 0.8;" id="notify-text">Leave your email, and we'll send you a hellish notification as soon as the product arrives!</p>
            <div class="form-group">
                <input type="email" id="notify-email" placeholder="Your Email" style="width: 100%; margin-bottom: 20px;">
                <button class="order-btn" onclick="submitNotification()">Notify me</button>
            </div>
            <div id="notify-success" style="display:none; color: var(--primary-color); margin-top: 20px; font-weight: bold;">
                Noted! Get ready for something hot in your inbox. 🌶️
            </div>
        </div>
    </div>

    <div id="emptyCartModal" class="modal">
        <div class="modal-box" style="max-width: 700px; padding: 0; overflow: hidden;">
            <button class="close-btn" onclick="closeEmptyCartModal()">&times;</button>
            
            <div class="empty-cart-header">
                <h2 class="modal-title">Your cart is still <span>empty</span></h2>
                <p class="empty-cart-subtitle">Open the world of spicy flavors! Choose a product category:</p>
            </div>

            <div class="empty-cart-categories">
                <a href="sauces.html" class="empty-cart-card">
                    <div class="card-emoji">🔥</div>
                    <h3>Craft sauces</h3>
                    <p>Authentic spicy sauces without preservatives</p>
                    <span class="card-arrow">→</span>
                </a>
                
                <a href="seedsandseedlings.html" class="empty-cart-card">
                    <div class="card-emoji">🌱</div>
                    <h3>Super-hot pepper seeds</h3>
                    <p>Authentic super-hot pepper seeds</p>
                    <span class="card-arrow">→</span>
                </a>
                
                <a href="otherseeds.html" class="empty-cart-card">
                    <div class="card-emoji">🌿</div>
                    <h3>Vegetable seeds</h3>
                    <p>Tomatoes and other vegetables from our farm</p>
                    <span class="card-arrow">→</span>
                </a>

                <a href="fresh-peppers.html" class="empty-cart-card">
                    <div class="card-emoji">🌶️</div>
                    <h3>Harvest of Hell</h3>
                    <p>Fresh and Dried Peppers</p>
                    <span class="card-arrow">→</span>
                </a>

                <a href="javascript:void(0)" style="opacity: 0.5; cursor: not-allowed;" class="empty-cart-card">
                    <div class="card-emoji">🥚</div>
                    <h3>Hatching Eggs</h3>
                    <p></p>
                    <span class="card-arrow">→</span>
                </a>

            </div>

            <div class="empty-cart-footer">
                <button class="order-btn" onclick="closeEmptyCartModal()" style="width: auto; padding: 12px 30px;">Close</button>
            </div>
        </div>
    </div>`;

    // HTML for floating cart that will be visible always
    const floatingCartHTML = `
    <a href="javascript:void(0)" class="floating-cart" onclick="openCheckout()" title="Open cart">
        <span class="cart-icon">🛒</span>
        <span id="cart-count">0</span>
    </a>`;

    // HTML for text cart button in top right corner
    const headerCartHTML = `
    <a href="javascript:void(0)" class="header-cart-link" onclick="openCheckout()" title="Open cart">
        <span class="cart-text">Cart</span>
        <span class="cart-icon">🛒</span>
        <span class="cart-count">0</span>
    </a>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML + floatingCartHTML + headerCartHTML);

    // Close modal window when clicking on dark area outside the form (overlay)
    const modal = document.getElementById('checkoutModal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeCheckout();
        }
    });


    // Close emptyCartModal on overlay click (here - because element is already in DOM)
    const emptyCartModal = document.getElementById('emptyCartModal');
    if (emptyCartModal) {
        emptyCartModal.addEventListener('click', function(event) {
            if (event.target === emptyCartModal) {
                closeEmptyCartModal();
            }
        });
    }
    // Update cart interface immediately after adding, if function is available
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
});

// INSERT YOUR LINK FROM cart.js HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyiEM5NnSk-Hg6-ObFifQQf3Xfmt8AjRcqHuinxkueImuEbBUKWl0AlAYUcmn5v0tfm/exec";

let currentNotifyCategory = '';

function openNotifyModal(category) {
    const modal = document.getElementById('notifyModal');
    const text = document.getElementById('notify-text');
    currentNotifyCategory = category;
    
    if (category === 'fresh-peppers') {
        text.innerText = "We'll let you know as soon as we harvest the first crop of fresh super-hots in the fall of 2026! 🍂";
    } else if (category === 'poultry') {
        text.innerText = "Our flock is getting ready! We will notify you when sales of hatching eggs begin. 🐣";
    }
    
    modal.style.display = 'flex';
}

// Universal function for sending data to Google Sheet
async function sendToGoogleSheet(data) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Scripts
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        console.error('Sending error:', error);
        return false;
    }
}

// Helper function to validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function submitNotification() {
    const emailInput = document.getElementById('notify-email');
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
        alert('Please enter a valid email address!');
        emailInput.classList.add('input-error');
        return;
    }
    emailInput.classList.remove('input-error');

    const btn = document.querySelector('#notifyModal .order-btn');
    btn.disabled = true;
    btn.innerText = "Saving...";

    const data = {
        date: new Date().toLocaleString("en-US"),
        email: email,
        orderType: "LAUNCH_NOTIFICATION",
        details: `Category: ${currentNotifyCategory}`,
        secret_token: "summerof26"
    };

    await sendToGoogleSheet(data);

    document.getElementById('notify-success').style.display = 'block';
    setTimeout(() => {
        document.getElementById('notifyModal').style.display = 'none';
        document.getElementById('notify-success').style.display = 'none';
        emailInput.value = '';
        btn.disabled = false;
        btn.innerText = "Notify me";
    }, 2000);
}

// Functions for managing empty cart modal
function openEmptyCartModal() {
    const modal = document.getElementById('emptyCartModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeEmptyCartModal() {
    const modal = document.getElementById('emptyCartModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
async function handleGeneralSubscribe(event) {
    event.preventDefault();
    const emailInput = document.getElementById('sub-email');
    const email = emailInput.value.trim();
    const btn = document.getElementById('sub-btn');

    if (!validateEmail(email)) {
        alert('Please enter a valid email address!');
        emailInput.classList.add('input-error');
        return;
    }
    emailInput.classList.remove('input-error');

    btn.disabled = true;
    btn.innerText = "Saving...";

    await sendToGoogleSheet({
        date: new Date().toLocaleString("en-US"),
        email: email,
        orderType: "MARKETING_SUBSCRIPTION",
        details: "Subscription from main page (footer)",
        secret_token: "summerof26"
    });

    alert('Thank you! 🔥');
    btn.disabled = false;
    btn.innerText = "Subscribe";
    document.getElementById('sub-email').value = '';
}