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
 
    let localRunning = false;
    const btn = document.getElementById('bot-ui-btn');
    const logDiv = document.getElementById('bot-ui-log');
    const previewDiv = document.getElementById('bot-ui-preview');
    const ticketDiv = document.getElementById('bot-ui-ticket');
    const filaDiv = document.getElementById('bot-ui-fila');
    const closeBtn = document.getElementById('passify-close-btn');
 
    function setLog(text) { logDiv.innerHTML = text; }
 
    function stopLocalBot() {
        localRunning = false;
        btn.textContent = 'Iniciar Ciclo';
        btn.style.background = '#0f172a';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        previewDiv.style.display = 'none';
        setLog('Robô desligado.');
        chrome.runtime.sendMessage({ action: "STOP_BOT" });
    }
 
    closeBtn.onclick = function() {
        stopLocalBot();
        div.remove();
    };

    btn.onclick = function() {
        if (!localRunning) {
            localRunning = true;
            btn.textContent = 'Parar Bot';
            btn.style.background = '#f1f5f9';
            btn.style.color = '#0f172a';
            btn.style.border = '1px solid #cbd5e1';
            setLog('🤖 Ciclo iniciado! Conectando...');
            chrome.runtime.sendMessage({ action: "START_BOT" });
        } else {
            stopLocalBot();
        }
    };

    // Ouvinte de ordens vindas do Background Script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "UPDATE_LOG") {
            setLog(message.text);
        }
        if (message.action === "EXECUTE_TRANSFER") {
            ticketDiv.textContent = message.originalTicketStr;
            filaDiv.textContent = message.fila;
            previewDiv.style.display = 'block';
            
            executarAutomacaoNoBlip(message.idBanco, message.ticket, message.fila);
        }
    });
 
    // --- FUNÇÕES DE NAVEGAÇÃO DOM / SHADOW DOM (FIÉIS AO SEU ORIGINAL) ---
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
        navigator.clipboard.writeText(texto).catch(err => console.error('Erro clipboard:', err));
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
 
    // --- EXECUÇÃO DE INTERAÇÃO COM A TELA ---
    async function executarAutomacaoNoBlip(idBanco, ticket, fila) {
        try {
            let filaAlvo = fila;
            setLog(`🔍 Filtrando ticket #${ticket}...`);
            let searchInput = findInputDeep();
 
            if (!searchInput) {
                setLog('❌ Erro: Barra de busca oculta.');
                stopLocalBot();
                return;
            }
 
            searchInput.focus();
            searchInput.value = ticket;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
 
            setLog('⏳ Aguardando filtro do Blip renderizar...');
            await new Promise(r => setTimeout(r, 2000));
 
            if (!localRunning) return;
 
            if (filaAlvo === "Pausa 20 / Fim de expediente") {
                setLog(`⏳ Analisando linha filtrada...`);
                let filaDetectada = null;
                let tentativas = 0;
 
                while (!filaDetectada && tentativas < 15 && localRunning) {
                    filaDetectada = findQueueByTicketNumber(ticket);
                    if (!filaDetectada) {
                        await new Promise(r => setTimeout(r, 400));
                        tentativas++;
                    }
                }
 
                if (filaDetectada) {
                    filaAlvo = filaDetectada;
                    setLog(`🎯 <span style="color:#10b981"><b>Fila:</b> ${filaAlvo}</span>`);
                    copiarParaAreaTransferencia(filaAlvo);
                    filaDiv.textContent = filaAlvo;
                    await new Promise(r => setTimeout(r, 600));
                } else {
                    // Como o Firebase está no background, mandamos uma requisição de update via fetch ou deixamos o background cuidar.
                    // Para manter simples e fiel, faremos um fetch parcial ou um aviso. 
                    setLog('⚠️ Não localizado na tela. Ignorando...');
                    chrome.runtime.sendMessage({ action: "TICKET_PROCESSED" });
                    return;
                }
            }
 
            if (!localRunning) return;
 
            const transferBtn = findTransferButtonDeep();
            if (!transferBtn) {
                setLog(`⚠️ Botão transferir ausente.`);
                chrome.runtime.sendMessage({ action: "TICKET_PROCESSED" });
                return;
            }
 
            transferBtn.click();
            await new Promise(r => setTimeout(r, 1800));
 
            const queueInput = findQueueInputDeep();
            if (!queueInput) {
                setLog('❌ Erro: Campo fila sumiu.');
                return;
            }
 
            queueInput.focus();
            queueInput.value = filaAlvo;
            queueInput.dispatchEvent(new Event('input', { bubbles: true }));
            queueInput.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 1000));
 
            const option = document.querySelector('bds-select-option') || document.querySelector('[part="option"]');
            if (option) option.click();
 
            await new Promise(r => setTimeout(r, 1200));
 
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
 
            setLog('✅ Ação executada na página!');
            
            // Avisa o Background que a aba terminou a parte dela. O Background atualiza o Firebase e reinicia o ciclo.
            chrome.runtime.sendMessage({ action: "TICKET_PROCESSED" });
 
        } catch (err) {
            setLog('❌ Erro na execução da aba: ' + err.message);
        }
    }
})();
