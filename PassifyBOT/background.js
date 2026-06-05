// ============================================================================
// PASSO 1: INJECTE O CONTEÚDO DO FIREBASE AQUI NO TOPO
// Abra o arquivo 'firebase-app-compat.js' que você baixou, copie TUDO e cole aqui.
// Em seguida, abra o 'firebase-database-compat.js', copie TUDO e cole logo abaixo.
// ============================================================================

// --- ABAIXO DO CÓDIGO DO FIREBASE, COLE A LÓGICA DO PASSIFY: ---

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
let isRunning = false;
let blipTabId = null;

function iniciarFirebase() {
    if (typeof firebase !== 'undefined' && !database) {
        const app = firebase.initializeApp(firebaseConfig);
        database = firebase.database(app);
    }
}

// Escuta comandos vindos da interface visual (content.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "START_BOT") {
        isRunning = true;
        blipTabId = sender.tab.id;
        iniciarFirebase();
        if (database) database.ref('status_do_bot').set('Funcionando');
        procurarProximoTicket();
    }
    if (message.action === "STOP_BOT") {
        isRunning = false;
        if (database) database.ref('status_do_bot').set('Desligado');
    }
    if (message.action === "TICKET_PROCESSED") {
        // Quando a aba termina de processar, espera 2s e busca o próximo
        setTimeout(procurarProximoTicket, 2000);
    }
});

async function procurarProximoTicket() {
    if (!isRunning) return;
    iniciarFirebase();
    if (!database) {
        setTimeout(procurarProximoTicket, 1000);
        return;
    }

    database.ref('tickets_para_transferir').orderByChild('status').equalTo('Pendente').limitToFirst(1).once('value', async (snapshot) => {
        if (!snapshot.exists()) {
            enviarLogParaInterface("💤 Fila vazia. Aguardando operadores...");
            setTimeout(procurarProximoTicket, 3000);
            return;
        }

        const idBanco = Object.keys(snapshot.val())[0];
        const atual = snapshot.val()[idBanco];
        const numLimpo = atual.ticket.replace('#', '');

        // Envia os dados do ticket encontrado para a aba do Blip executar a ação física
        if (blipTabId) {
            chrome.tabs.sendMessage(blipTabId, {
                action: "EXECUTE_TRANSFER",
                idBanco: idBanco,
                ticket: numLimpo,
                fila: atual.fila,
                originalTicketStr: atual.ticket
            });
        }
    }, (error) => {
        enviarLogParaInterface("❌ Erro Firebase: " + error.message);
    });
}

function enviarLogParaInterface(texto) {
    if (blipTabId) {
        chrome.tabs.sendMessage(blipTabId, { action: "UPDATE_LOG", text: texto });
    }
}

// Mantém o Sophos vivo direto do Background (Inabalável)
setInterval(function() {
    fetch('http://sophosweb.grupoelo.com:8090/')
        .then(() => console.log('Ping Sophos via Background OK.'))
        .catch(() => console.log('Manutenção de rede Background ativa.'));
}, 60000); // Reduzi para 1 minuto para garantir que a VPN não derrube o Worker
