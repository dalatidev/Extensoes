(function() {
    'use strict';
 
    // --- CONFIGURAÇÃO VISUAL PASSIFY NO BLIP ---
    const div = document.createElement('div');
    div.id = 'passify-bot-ui';
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.width = '310px';
    div.style.background = 'rgba(255, 255, 255, 0.9)';
    div.style.backdropFilter = 'blur(16px)';
    div.style.webkitBackdropFilter = 'blur(16px)';
    div.style.border = '1px solid rgba(226, 232, 240, 0.8)';
    div.style.borderRadius = '14px';
    div.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
    div.style.padding = '22px';
    div.style.zIndex = '999999';
    div.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    div.style.color = '#0f172a';
 
    div.innerHTML = `
<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
<span style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#4f46e5;">🚀 Passify Engine</span>
<button id="passify-close-btn" style="background:none; border:none; cursor:pointer; font-size:18px; color:#94a3b8; font-weight:bold; line-height:1;">&times;</button>
</div>
<div style="margin-bottom:16px;">
<div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:6px; font-weight:600;">Status do Robô</div>
<div id="bot-ui-log" style="font-size:13px; color:#0f172a; font-weight:500; min-height:38px; background:#f8fafc; border:1px solid #e2e8f0; padding:10px 12px; border-radius:8px; line-height:1.4;">Robô desligado.</div>
</div>
<div id="bot-ui-preview" style="display:none; margin-bottom:16px; border-top:1px dashed #e2e8f0; padding-top:14px;">
<div id="bot-ui-ticket" style="font-size:24px; font-weight:700; color:#0f172a; margin-bottom:4px;">#0000000</div>
<div id="bot-ui-fila" style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; background:#4f46e5; color:#fff; padding:3px 8px; border-radius:6px; width:fit-content;">Sem Fila</div>
</div>
<button id="bot-ui-btn" style="width:100%; padding:14px; background:#0f172a; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; transition: all 0.2s ease;">Iniciar Ciclo</button>
    `;

    document.body.appendChild(div);
 
    let isRunning = false;
    const btn = document.getElementById('bot-ui-btn');
    const logDiv = document.getElementById('bot-ui-log');
    const previewDiv = document.getElementById('bot-ui-preview');
    const ticketDiv = document.getElementById('bot-ui-ticket');
    const filaDiv = document.getElementById('bot-ui-fila');
    const closeBtn = document.getElementById('passify-close-btn');
 
    function setLog(text) { logDiv.innerHTML = text; }
 
    // Configurações do banco mantidas do original
    const firebaseConfig = {
        apiKey: "AIzaSyBNLdfRTpJbrdKOwkW4TPfK2d6lVCZxoyY",
        authDomain: "passify-2026-tf.firebaseapp.com",
        databaseURL: "https://passify-2026-tf-default-rtdb.firebaseio.com/",
        projectId: "passify-2026-tf",
        storageBucket: "passify-2026-tf.firebasestorage.app",
        messagingSenderId: "784145166265",
        appId: "1:784145166265:web:3e3987612982f016fe9068"
    };
 
    let database = null;
 
    function iniciarFirebase() {
        // Como o script local roda no escopo da extensão, checamos se o objeto global está disponível
        const fb do Contexto = window.firebase || (typeof firebase !== 'undefined' ? firebase : null);
        if (fb do Contexto && !database) {
            const app = fb do Contexto.initializeApp(firebaseConfig);
            database = fb do Contexto.database(app);
        }
    }
 
    function atualizarStatusGlobalBot(status) {
        iniciarFirebase();
        if (database) {
            database.ref('status_do_bot').set(status);
        }
    }
 
    function stopPassifyBot() {
        isRunning = false;
        btn.textContent = 'Iniciar Ciclo';
        btn.style.background = '#0f172a';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        previewDiv.style.display = 'none';
        setLog('Robô desligado.');
        atualizarStatusGlobalBot('Desligado');
    }
 
    closeBtn.onclick = function() {
        stopPassifyBot();
        document.getElementById('passify-bot-ui').remove();
    };

    btn.onclick = function() {
        if (!isRunning) {
            isRunning = true;
            btn.textContent = 'Parar Bot';
            btn.style.background = '#f1f5f9';
            btn.style.color = '#0f172a';
            btn.style.border = '1px solid #cbd5e1';
            setLog('🤖 Ciclo iniciado! Conectando...');
            atualizarStatusGlobalBot('Funcionando');
            procurarProximoTicket();
        } else {
            atualizarStatusGlobalBot('Inativo');
            stopPassifyBot();
        }
    };
 
    // --- FUNÇÕES DE NAVEGAÇÃO DOM / SHADOW DOM ---
    function findInputDeep(root=document) {
        const input = root.querySelector('input[placeholder*="Nº do ticket"]');
        if (input) return input;
        const elements = root.querySelectorAll('*');
        for (let el of elements) {
            if (el.shadowRoot) {
                const deepInput = findInputDeep(el.shadowRoot);
                if (deepInput) return deepInput;
            }
        }
        return null;
    }
 
    function findQueueByTicketNumber(targetTicket, root=document) {
        const rows = root.querySelectorAll('bds-table-row');
        for (let row of rows) {
            const hasTicketCell = row.querySelector(`bds-table-cell[title="#${targetTicket}"]`);
            if (hasTicketCell) {
                const cells = row.querySelectorAll('bds-table-cell[type="action"]');
                for (let cell of cells) {
                    const title = cell.getAttribute('title');
                    if (title && title.trim().length > 0 &&
                        title !== `#${targetTicket}` &&
                        !title.includes(':') &&
                        !title.includes('São Lu') && !title.includes('Ristelle') && !title.includes('.br')) {
                        return title.trim();
                    }
                }
            }
        }
        const allElements = root.querySelectorAll('*');
        for (let el of allElements) {
            if (el.shadowRoot) {
                const found = findQueueByTicketNumber(targetTicket, el.shadowRoot);
                if (found) return found;
            }
        }
        return null;
    }
 
    function findTransferButtonDeep(root=document) {
        const target = root.querySelector('[data-testid="btn-open-transfer-modal"]') || root.querySelector('bds-icon[name="transfer"]');
        if (target) return target;
        const elements = root.querySelectorAll('*');
        for (let el of elements) {
            if (el.shadowRoot) {
                const deepBtn = findTransferButtonDeep(el.shadowRoot);
                if (deepBtn) return deepBtn;
            }
        }
        return null;
    }
 
    function copiarParaAreaTransferencia(texto) {
        navigator.clipboard.writeText(texto)
            .then(() => console.log(`Copiado: ${texto}`))
            .catch(err => console.error('Erro clipboard:', err));
    }
 
    function findQueueInputDeep(root=document) {
        const input = root.querySelector('input[placeholder="Selecionar fila"]');
        if (input) return input;
        const elements = root.querySelectorAll('*');
        for (let el of elements) {
            if (el.shadowRoot) {
                const deepInput = findQueueInputDeep(el.shadowRoot);
                if (deepInput) return deepInput;
            }
        }
        return null;
    }
 
    function findAnyFinalButton(root=document) {
        const target = root.querySelector('[data-testid="transfer-button"]') || root.querySelector('bds-button[variant="primary"]') || root.querySelector('.button__primary');
        if (target) return target;
        const elements = root.querySelectorAll('*');
        for (let el of elements) {
            if (el.shadowRoot) {
                const deepBtn = findAnyFinalButton(el.shadowRoot);
                if (deepBtn) return deepBtn;
            }
        }
        return null;
    }
 
    // --- PROCESSAMENTO PRINCIPAL ---
    async function procurarProximoTicket() {
        if (!isRunning) return;
 
        try {
            iniciarFirebase();
            
            if (!database) {
                setLog('Aguardando inicialização do Banco...');
                setTimeout(procurarProximoTicket, 1000);
                return;
            }
 
            setLog('⏳ Buscando ticket pendente...');
 
            database.ref('tickets_para_transferir').orderByChild('status').equalTo('Pendente').limitToFirst(1).once('value', async (snapshot) => {
                if (!snapshot.exists()) {
                    setLog('💤 Fila vazia. Aguardando operadores...');
                    previewDiv.style.display = 'none';
                    setTimeout(procurarProximoTicket, 3000);
                    return;
                }
 
                const idBanco = Object.keys(snapshot.val())[0];
                const atual = snapshot.val()[idBanco];
 
                const numLimpo = atual.ticket.replace('#', '');
                ticketDiv.textContent = atual.ticket;
                filaDiv.textContent = atual.fila;
                previewDiv.style.display = 'block';
 
                await executarAutomacaoNoBlip(idBanco, numLimpo, atual.fila);
            }, (error) => {
                setLog('❌ Erro Firebase: ' + error.message);
                stopPassifyBot();
            });
 
        } catch (e) {
            setLog('❌ Erro de ciclo: ' + e.message);
            stopPassifyBot();
        }
    }
 
    async function executarAutomacaoNoBlip(idBanco, ticket, fila) {
        try {
            let filaAlvo = fila;
 
            setLog(`🔍 Filtrando ticket #${ticket}...`);
            let searchInput = findInputDeep();
 
            if (!searchInput) {
                setLog('❌ Erro: Barra de busca oculta.');
                stopPassifyBot();
                return;
            }
 
            searchInput.focus();
            searchInput.value = ticket;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
 
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
 
            setLog('⏳ Aguardando filtro do Blip renderizar...');
            await new Promise(r => setTimeout(r, 2000));
 
            if (!isRunning) return;
 
            if (filaAlvo === "Pausa 20 / Fim de expediente") {
                setLog(`⏳ Analisando linha filtrada para capturar origem...`);
                let filaDetectada = null;
                let tentativas = 0;
 
                while (!filaDetectada && tentativas < 15 && isRunning) {
                    filaDetectada = findQueueByTicketNumber(ticket);
                    if (!filaDetectada) {
                        await new Promise(r => setTimeout(r, 400));
                        tentativas++;
                    }
                }
 
                if (filaDetectada) {
                    filaAlvo = filaDetectada;
                    setLog(`🎯 <span style="color:#10b981"><b>Fila Capturada:</b> ${filaAlvo}</span>`);
                    copiarParaAreaTransferencia(filaAlvo);
                    filaDiv.textContent = filaAlvo;
                    await new Promise(r => setTimeout(r, 600));
                } else {
                    setLog('⚠️ <span style="color:#ef4444"><b>Erro:</b> Linha correspondente não apareceu.</span> Pulando...');
                    await database.ref(`tickets_para_transferir/${idBanco}`).update({ status: "Não localizado no Blip" });
                    previewDiv.style.display = 'none';
                    setTimeout(procurarProximoTicket, 2000);
                    return;
                }
            } else {
                setLog(`⚙️ Direcionando para destino informado (<b>${filaAlvo}</b>)`);
            }
 
            if (!isRunning) return;
 
            setLog('📂 Abrindo painel de transferência...');
            const transferBtn = findTransferButtonDeep();
 
            if (!transferBtn) {
                setLog(`⚠️ Botão de transferir não encontrado na linha. Pulando...`);
                await database.ref(`tickets_para_transferir/${idBanco}`).update({ status: "Indisponível no Blip" });
                previewDiv.style.display = 'none';
                setTimeout(procurarProximoTicket, 2000);
                return;
            }
 
            transferBtn.click();
            setLog('⏳ Aguardando abertura do modal...');
            await new Promise(r => setTimeout(r, 1800));
 
            if (!isRunning) return;
 
            setLog(`🏷️ Inserindo fila destino: <b>${filaAlvo}</b>...`);
            const queueInput = findQueueInputDeep();
 
            if (!queueInput) {
                setLog('❌ Erro: Campo de seleção de fila sumiu.');
                stopPassifyBot();
                return;
            }
 
            queueInput.focus();
            queueInput.value = filaAlvo;
            queueInput.dispatchEvent(new Event('input', { bubbles: true }));
            queueInput.dispatchEvent(new Event('change', { bubbles: true }));
 
            setLog('⏳ Vinculando dropdown...');
            await new Promise(r => setTimeout(r, 1000));
 
            const option = document.querySelector('bds-select-option') || document.querySelector('[part="option"]');
            if (option) option.click();
 
            await new Promise(r => setTimeout(r, 1200));
            if (!isRunning) return;
 
            setLog('🚀 Confirmando envio...');
            let clicou = false;
 
            for (let i = 0; i < 10; i++) {
                const finalBtn = findAnyFinalButton();
                if (finalBtn) {
                    finalBtn.click();
                    if (finalBtn.shadowRoot) {
                        const innerBtn = finalBtn.shadowRoot.querySelector('button') || finalBtn.shadowRoot.querySelector('.button__primary');
                        if (innerBtn) innerBtn.click();
                    }
                    clicou = true;
                    break;
                }
                await new Promise(r => setTimeout(r, 200));
            }
 
            if (!clicou) {
                setLog('⚠️ Tentando atalho via Teclado...');
                queueInput.focus();
                queueInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
                await new Promise(r => setTimeout(r, 100));
                document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true }));
                await new Promise(r => setTimeout(r, 100));
                document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            }
 
            setLog('🧹 Finalizando registro no Firebase...');
            await database.ref(`tickets_para_transferir/${idBanco}`).update({ status: "Concluído" });
 
            setLog('✅ Concluído com sucesso! Próximo em 2s...');
            await new Promise(r => setTimeout(r, 2000));
 
            if (isRunning) {
                previewDiv.style.display = 'none';
                procurarProximoTicket();
            }
 
        } catch (err) {
            setLog('❌ Erro na execução: ' + err.message);
            stopPassifyBot();
        }
    }
 
    // Mantém a autenticação da rede interna ativa
    setInterval(function() {
        fetch('http://sophosweb.grupoelo.com:8090/')
            .then(() => console.log('Ping de rede enviado.'))
            .catch(() => console.log('Tráfego gerado para manutenção de rede.'));
    }, 300000);
 
})();
