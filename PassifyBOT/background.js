// Importa os arquivos locais do Firebase para o segundo plano
importScripts('firebase-app-compat.js', 'firebase-database-compat.js');

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
    // Como os arquivos foram importados acima, o objeto 'firebase' fica disponível globalmente aqui
    if (typeof firebase !== 'undefined' && !database) {
        const app = firebase.initializeApp(firebaseConfig);
        database = firebase.database(app);
    }
}

// Escuta ordens da interface visual da aba (content.js)
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

// Manutenção da VPN ativa via Background
setInterval(function() {
    fetch('http://sophosweb.grupoelo.com:8090/')
        .then(() => console.log('Ping Sophos via Background OK.'))
        .catch(() => console.log('Manutenção de rede ativa.'));
}, 60000);
