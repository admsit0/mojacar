 // Data storage
        let items = [];
        let plans = [];
        let whatsappMessages = [];

        let expenses = [];


        const JSONBIN_URL = 'https://api.jsonbin.io/v3/b/685e820b8960c979a5b255be';
        const JSONBIN_KEY = '$2a$10$cqoemLVjqR12TfWv5mf3TufozK/iTAtZw3O5b1j1GD2BvJpLrq9fG';

        document.addEventListener('DOMContentLoaded', () => {
            init();
            populateExpenseForm();
            document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);
        });


        // Initialize app
        async function init() {
            await loadFromStorage();
            renderAll();
            createParticles();
            
            // // Auto-save every 30 seconds
            // setInterval(saveToStorage, 30000);
        }

        // Storage functions
        async function loadFromStorage() {
            try {
                const res = await fetch(`${JSONBIN_URL}/latest`, {
                    headers: { 'X-Master-Key': JSONBIN_KEY }
                });
                const data = (await res.json()).record;
                items = data.items || [];
                plans = data.plans || [];
                whatsappMessages = data.whatsappMessages || [];
                expenses = data.expenses || [];
                showNotification('✅ Datos cargados desde JSONBin');
                renderAll(); // importante para renderizar gastos también
            } catch (err) {
                console.error('Error cargando datos:', err);
                showNotification('❌ Error al cargar datos');
            }
        }


        async function saveToStorage() {
            const data = {
                items,
                plans,
                whatsappMessages,
                expenses,
                lastUpdated: new Date().toISOString()
            };
            try {
                await fetch(JSONBIN_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_KEY
                    },
                    body: JSON.stringify(data)
                });
                showNotification('💾 Datos guardados en JSONBin');
            } catch (err) {
                console.error('Error guardando datos:', err);
                showNotification('❌ Error al guardar datos');
            }
        }


        function deleteExpense(id) {
            if (confirm('¿Seguro que quieres eliminar este gasto?')) {
                expenses = expenses.filter(exp => exp.id !== id);
                saveToStorage();
                renderExpenses();
                renderBalances();
                showNotification('🗑️ Gasto eliminado');
            }
        }



        // Create animated background particles
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = window.innerWidth < 768 ? 15 : 25;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.width = (Math.random() * 20 + 10) + 'px';
                particle.style.height = particle.style.width;
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
                particlesContainer.appendChild(particle);
            }
        }

        // Tab functionality
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        // Notification system
        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 4000);
        }

        // Clipboard functionality
        async function copyToClipboard(text, showNotif = true) {
            try {
                await navigator.clipboard.writeText(text);
                if (showNotif) {
                    showNotification('¡Copiado al portapapeles! 📋');
                }
                return true;
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                if (showNotif) {
                    showNotification('❌ Error al copiar');
                }
                return false;
            }
        }

        // WhatsApp message formatting
        function addWhatsAppMessage(type, data) {
            let message = '';
            const timestamp = new Date().toLocaleString('es-ES');
            
            if (type === 'item') {
                const carrierName = data.carrierProfile.charAt(0).toUpperCase() + data.carrierProfile.slice(1);
                message = `🎒 *NUEVO ARTÍCULO AÑADIDO*\n\n` +
                         `📦 *Artículo:* ${data.name}\n` +
                         `👤 *Lo lleva:* ${carrierName}\n` +
                         `✍️ *Añadido por:* ${data.profile.charAt(0).toUpperCase() + data.profile.slice(1)}\n` +
                         `🕐 *Fecha:* ${timestamp}\n\n` +
                         `¡Ya tenemos ${items.length} artículos en la lista! 🎉`;
            } else if (type === 'plan') {
                message = `🗺️ *NUEVO PLAN PROPUESTO*\n\n` +
                         `🎯 *Plan:* ${data.name}\n` +
                         `📍 *Ubicación:* ${data.location}\n` +
                         `💰 *Precio:* ${data.price}€\n` +
                         `💭 *Por qué:* ${data.justification}\n` +
                         `👤 *Propuesto por:* ${data.profile.charAt(0).toUpperCase() + data.profile.slice(1)}\n` +
                         `🕐 *Fecha:* ${timestamp}\n\n` +
                         `¡Votemos si lo hacemos! 🗳️`;
            }
            
            whatsappMessages.unshift({ message, timestamp, type });
            saveToStorage();
            renderWhatsAppMessages();
            
            // Auto-copy to clipboard
            copyToClipboard(message, false);
            showNotification(`📋 ${type === 'item' ? 'Artículo' : 'Plan'} añadido y copiado!`);
        }

        // Form validation
        function validateForm(formData, type) {
            const errors = [];
            
            if (type === 'item') {
                if (!formData.name.trim()) errors.push('El nombre del artículo es obligatorio');
                if (!formData.carrierProfile) errors.push('Debes seleccionar quién lo lleva');
                if (!formData.profile) errors.push('Debes seleccionar tu perfil');
                
                // Check for duplicates
                if (items.some(item => item.name.toLowerCase() === formData.name.toLowerCase().trim())) {
                    errors.push('Este artículo ya está en la lista');
                }
            } else if (type === 'plan') {
                if (!formData.name.trim()) errors.push('El nombre del plan es obligatorio');
                if (!formData.location.trim()) errors.push('La ubicación es obligatoria');
                if (!formData.justification.trim()) errors.push('La justificación es obligatoria');
                if (!formData.profile) errors.push('Debes seleccionar tu perfil');
                if (isNaN(formData.price) || formData.price < 0) errors.push('El precio debe ser un número válido');
            }
            
            return errors;
        }

        // Items functionality
        document.getElementById('itemForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('itemBtnText');
            const originalText = submitBtn.textContent;
            
            try {
                // Show loading state
                submitBtn.innerHTML = '<span class="loading"></span> Añadiendo...';
                
                const formData = {
                    name: document.getElementById('itemName').value.trim(),
                    carrierProfile: document.getElementById('itemCarrierProfile').value,
                    profile: document.getElementById('itemProfile').value
                };
                
                // Validate form
                const errors = validateForm(formData, 'item');
                if (errors.length > 0) {
                    throw new Error(errors.join('\n'));
                }
                
                const item = {
                    id: Date.now(),
                    ...formData,
                    timestamp: new Date().toLocaleString('es-ES')
                };
                
                items.push(item);
                saveToStorage();
                addWhatsAppMessage('item', item);
                renderItems();
                this.reset();
                
            } catch (error) {
                showNotification(`❌ ${error.message}`);
            } finally {
                submitBtn.textContent = originalText;
            }
        });

        // Plans functionality
        document.getElementById('planForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('planBtnText');
            const originalText = submitBtn.textContent;
            
            try {
                // Show loading state
                submitBtn.innerHTML = '<span class="loading"></span> Proponiendo...';
                
                const formData = {
                    name: document.getElementById('planName').value.trim(),
                    location: document.getElementById('planLocation').value.trim(),
                    justification: document.getElementById('planJustification').value.trim(),
                    price: parseFloat(document.getElementById('planPrice').value) || 0,
                    profile: document.getElementById('planProfile').value
                };
                
                // Validate form
                const errors = validateForm(formData, 'plan');
                if (errors.length > 0) {
                    throw new Error(errors.join('\n'));
                }
                
                const plan = {
                    id: Date.now(),
                    ...formData,
                    timestamp: new Date().toLocaleString('es-ES')
                };
                
                plans.push(plan);
                saveToStorage();
                addWhatsAppMessage('plan', plan);
                renderPlans();
                this.reset();
                
            } catch (error) {
                showNotification(`❌ ${error.message}`);
            } finally {
                submitBtn.textContent = originalText;
            }
        });

        // Delete functionality
        function deleteItem(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
                items = items.filter(item => item.id !== id);
                saveToStorage();
                renderItems();
                showNotification('🗑️ Artículo eliminado');
            }
        }

        function deletePlan(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este plan?')) {
                plans = plans.filter(plan => plan.id !== id);
                saveToStorage();
                renderPlans();
                showNotification('🗑️ Plan eliminado');
            }
        }

        function deleteMessage(index) {
            if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
                whatsappMessages.splice(index, 1);
                saveToStorage();
                renderWhatsAppMessages();
                showNotification('🗑️ Mensaje eliminado');
            }
        }

        // Render functions
        function renderItems() {
            const container = document.getElementById('itemsList');
            const countElement = document.getElementById('itemsCount');
            
            countElement.textContent = items.length;
            
            if (items.length === 0) {
                container.innerHTML = '<div class="empty-state">No hay artículos añadidos aún. ¡Sé el primero!</div>';
                return;
            }
            
            container.innerHTML = items.map(item => {
                const carrierName = item.carrierProfile.charAt(0).toUpperCase() + item.carrierProfile.slice(1);
                const addedBy = item.profile.charAt(0).toUpperCase() + item.profile.slice(1);
                
                return `
                    <div class="item-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <h4>📦 ${item.name}</h4>
                                <p style="margin: 10px 0;"><strong>Lo lleva:</strong> <span class="profile-badge profile-${item.carrierProfile}">${carrierName}</span></p>
                                <p style="font-size: 0.9em; color: var(--text-secondary);">
                                    Añadido por <span class="profile-badge profile-${item.profile}">${addedBy}</span> el ${item.timestamp}
                                </p>
                            </div>
                            <button class="delete-btn" onclick="deleteItem(${item.id})" title="Eliminar artículo">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderPlans() {
            const container = document.getElementById('plansList');
            const countElement = document.getElementById('plansCount');
            
            countElement.textContent = plans.length;
            
            if (plans.length === 0) {
                container.innerHTML = '<div class="empty-state">No hay planes propuestos aún. ¡Propón algo genial!</div>';
                return;
            }
            
            container.innerHTML = plans.map(plan => {
                const proposedBy = plan.profile.charAt(0).toUpperCase() + plan.profile.slice(1);
                
                return `
                    <div class="plan-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <h4>🎯 ${plan.name}</h4>
                                <p style="margin: 8px 0;"><strong>📍 Ubicación:</strong> ${plan.location}</p>
                                <p style="margin: 8px 0;"><strong>💰 Precio:</strong> ${plan.price}€</p>
                                <p style="margin: 8px 0;"><strong>💭 Justificación:</strong> ${plan.justification}</p>
                                <p style="font-size: 0.9em; color: var(--text-secondary); margin-top: 15px;">
                                    Propuesto por <span class="profile-badge profile-${plan.profile}">${proposedBy}</span> el ${plan.timestamp}
                                </p>
                            </div>
                            <button class="delete-btn" onclick="deletePlan(${plan.id})" title="Eliminar plan">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderWhatsAppMessages() {
            const container = document.getElementById('whatsappMessages');
            const countElement = document.getElementById('alertsCount');
            
            countElement.textContent = whatsappMessages.length;
            
            if (whatsappMessages.length === 0) {
                container.innerHTML = '<div class="empty-state">No hay alertas pendientes.</div>';
                return;
            }
            
            container.innerHTML = whatsappMessages.map((msg, index) => `
                <div style="margin-bottom: 30px;">
                    <div class="whatsapp-preview">${msg.message}</div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="copy-btn" onclick="copyToClipboard(this.previousElementSibling.textContent)">
                            📋 Copiar mensaje
                        </button>
                        <button class="delete-btn" onclick="deleteMessage(${index})" title="Eliminar mensaje">
                            🗑️ Eliminar
                        </button>
                    </div>
                    <small style="display: block; margin-top: 10px; color: var(--text-secondary);">
                        Generado el ${msg.timestamp}
                    </small>
                </div>
            `).join('');
        }

        function getProfiles() {
            return ['ana', 'adam', 'alberto', 'arancha', 'jorge'];
        }

        function populateExpenseForm() {
            const payersDiv = document.getElementById('payersContainer');
            const beneficiariesDiv = document.getElementById('beneficiariesContainer');
            payersDiv.innerHTML = '';
            beneficiariesDiv.innerHTML = '';

            getProfiles().forEach(profile => {
                payersDiv.innerHTML += `
                    <label>
                        <input type="number" step="0.01" min="0" value="0" name="payer-${profile}" placeholder="€ pagado por ${profile}">
                        <span class="profile-badge profile-${profile}">${profile}</span>
                    </label><br>
                `;

                beneficiariesDiv.innerHTML += `
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 5px;">
                        <input type="checkbox" name="beneficiary-${profile}" checked style="transform: scale(0.9);">
                        <span class="profile-badge profile-${profile}">${profile}</span>
                    </label>
                `;
            });
        }

        async function handleAddExpense(e) {
            e.preventDefault();
            const concept = document.getElementById('expenseConcept').value.trim();
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const payers = {};
            const beneficiaries = [];

            getProfiles().forEach(profile => {
                const paid = parseFloat(document.querySelector(`[name="payer-${profile}"]`).value) || 0;
                if (paid > 0) payers[profile] = paid;

                const isBeneficiary = document.querySelector(`[name="beneficiary-${profile}"]`).checked;
                if (isBeneficiary) beneficiaries.push(profile);
            });

            if (!concept || isNaN(amount) || amount <= 0) {
                return showNotification('❌ Debes introducir un concepto válido y una cantidad > 0');
            }

            if (Object.keys(payers).length === 0) {
                return showNotification('❌ Al menos una persona debe haber pagado algo');
            }

            if (beneficiaries.length === 0) {
                return showNotification('❌ Debe haber al menos un beneficiario');
            }

            const totalPaid = Object.values(payers).reduce((sum, val) => sum + val, 0);
            if (Math.abs(totalPaid - amount) > 0.01) {
                return showNotification(`❌ La suma de lo pagado (${totalPaid.toFixed(2)}€) no coincide con el total (${amount.toFixed(2)}€)`);
            }

            const newExpense = {
                id: Date.now(),
                concept,
                amount,
                payers,
                beneficiaries,
                timestamp: new Date().toISOString()
            };

            expenses.push(newExpense);
            await saveToStorage();
            renderExpenses();
            e.target.reset();
            populateExpenseForm();
            showNotification('✅ Gasto añadido correctamente');
        }


        function renderExpenses() {
            const list = document.getElementById('expensesList');
            if (expenses.length === 0) {
                list.innerHTML = '<div class="empty-state">No hay gastos registrados aún.</div>';
                return;
            }

            list.innerHTML = expenses.map(exp => `
                <div class="item-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <h4>💸 ${exp.concept}</h4>
                            <p><strong>Total:</strong> ${exp.amount.toFixed(2)}€</p>
                            <p><strong>Pagado por:</strong> ${
                                Object.entries(exp.payers)
                                    .map(([p, amt]) => `<span class="profile-badge profile-${p}">${p}</span>: ${amt.toFixed(2)}€`)
                                    .join(', ')
                            }</p>
                            <p><strong>Beneficiarios:</strong> ${
                                exp.beneficiaries.map(b => `<span class="profile-badge profile-${b}">${b}</span>`).join(', ')
                            }</p>
                            <small style="color: var(--text-secondary);">🕒 ${new Date(exp.timestamp).toLocaleString('es-ES')}</small>
                        </div>
                        <button class="delete-btn" onclick="deleteExpense(${exp.id})" title="Eliminar gasto">🗑️</button>
                    </div>
                </div>
            `).join('');

            renderBalances();
        }


        function renderAll() {
            renderItems();
            renderPlans();
            renderExpenses();
            renderWhatsAppMessages();
        }

        function renderBalances() {
            const balances = {};
            getProfiles().forEach(p => balances[p] = 0);

            for (const e of expenses) {
                const total = e.amount;
                const split = total / e.beneficiaries.length;

                e.beneficiaries.forEach(b => balances[b] -= split);
                for (const [payer, amt] of Object.entries(e.payers)) {
                    balances[payer] += amt;
                }
            }

            const creditors = [], debtors = [];
            for (const [person, amount] of Object.entries(balances)) {
                if (amount > 0.01) creditors.push([person, amount]);
                else if (amount < -0.01) debtors.push([person, -amount]);
            }

            creditors.sort((a, b) => b[1] - a[1]);
            debtors.sort((a, b) => b[1] - a[1]);

            const transactions = [];

            while (creditors.length && debtors.length) {
                const [cred, credAmt] = creditors[0];
                const [debt, debtAmt] = debtors[0];
                const amount = Math.min(credAmt, debtAmt);

                transactions.push(`${debt} ➡️ ${cred}: ${amount.toFixed(2)}€`);

                creditors[0][1] -= amount;
                debtors[0][1] -= amount;

                if (creditors[0][1] < 0.01) creditors.shift();
                if (debtors[0][1] < 0.01) debtors.shift();
            }

            const container = document.getElementById('balancesList');
            if (transactions.length === 0) {
                container.innerHTML = '<div class="empty-state">Todos están a mano 🤝</div>';
                return;
            }

            container.innerHTML = transactions.map(t => `
                <div class="item-card">
                    ${t}
                </div>
            `).join('');
        }


        // Export/Import functionality
        function exportData() {
            const data = {
                items,
                plans,
                whatsappMessages,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mojacar-2025-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('📁 Datos exportados correctamente');
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.items && data.plans && data.whatsappMessages) {
                        if (confirm('¿Estás seguro de que quieres importar estos datos? Se sobrescribirán los datos actuales.')) {
                            items = data.items || [];
                            plans = data.plans || [];
                            whatsappMessages = data.whatsappMessages || [];
                            
                            saveToStorage();
                            renderAll();
                            showNotification('✅ Datos importados correctamente');
                        }
                    } else {
                        throw new Error('Formato de archivo inválido');
                    }
                } catch (error) {
                    showNotification('❌ Error al importar: ' + error.message);
                }
            };
            reader.readAsText(file);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        showTab('items');
                        document.querySelector('[onclick="showTab(\'items\')"]').classList.add('active');
                        break;
                    case '2':
                        e.preventDefault();
                        showTab('plans');
                        document.querySelector('[onclick="showTab(\'plans\')"]').classList.add('active');
                        break;
                    case '3':
                        e.preventDefault();
                        showTab('alerts');
                        document.querySelector('[onclick="showTab(\'alerts\')"]').classList.add('active');
                        break;
                    case 's':
                        e.preventDefault();
                        saveToStorage();
                        showNotification('💾 Datos guardados manualmente');
                        break;
                }
            }
        });

        // Service Worker registration for offline support
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }

        // Handle online/offline status
        window.addEventListener('online', function() {
            showNotification('🟢 Conexión restaurada');
        });

        window.addEventListener('offline', function() {
            showNotification('🔴 Sin conexión - Los datos se guardan localmente');
        });

        // Initialize app when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        // Handle page visibility changes
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Refresh data when page becomes visible
                loadFromStorage();
                renderAll();
            }
        });

        // Add resize handler for particles
        window.addEventListener('resize', function() {
            const particlesContainer = document.getElementById('particles');
            particlesContainer.innerHTML = '';
            createParticles();
        });