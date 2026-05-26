(function () {
  const id = "fasttrack-apple-final-v1";
  
  // Se já existir na página, o clique no ícone fecha e encerra o script
  const existingPanel = document.getElementById(id);
  if (existingPanel) {
    existingPanel.remove();
    return; 
  }
  // ESTADO E TEMA
  let isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  let activeTab = "ext";

  const style = document.createElement("style");
  function updateTheme() {
    style.innerHTML = `
              #${id} {
                  position: fixed; top: 20px; right: 20px; z-index: 9999999;
                  width: 340px; border-radius: 20px; padding: 20px;
                  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
                  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                  border: 1px solid ${
                    isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                  };
                  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                  background: ${
                    isDark
                      ? "rgba(28, 28, 30, 0.9)"
                      : "rgba(255, 255, 255, 0.85)"
                  };
                  color: ${isDark ? "#fff" : "#000"};
                  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                  display: flex; flex-direction: column; gap: 15px;
              }
              .apple-header { display: flex; justify-content: space-between; align-items: center; }
              .theme-toggle { background: ${
                isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
              }; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; }
              .apple-tabs { display: flex; background: ${
                isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
              }; padding: 3px; border-radius: 12px; gap: 2px; }
              .apple-tab-btn { flex: 1; border: none; background: transparent; padding: 8px 2px; border-radius: 9px; font-size: 10px; font-weight: 600; cursor: pointer; color: inherit; opacity: 0.5; transition: 0.2s; }
              .apple-tab-btn.active { opacity: 1; background: ${
                isDark ? "#444" : "#fff"
              }; box-shadow: 0 2px 8px rgba(0,0,0,0.1); color: #007AFF; }
              .apple-card { padding: 12px; border-radius: 12px; font-size: 11px; line-height: 1.5; background: ${
                isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
              }; }
              .apple-card b { color: #007AFF; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
              .ghost-input { width: 100%; border-radius: 12px; padding: 12px; font-size: 12px; outline: none; resize: none; box-sizing: border-box; font-family: inherit; border: 1px solid ${
                isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
              }; background: ${
      isDark ? "rgba(0,0,0,0.2)" : "#fff"
    }; color: inherit; }
              .ghost-btn-main { width: 100%; border: none; padding: 14px; border-radius: 14px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; color: white; margin-top: 5px; }
              .ghost-btn-main:hover { transform: scale(0.98); opacity: 0.9; }
          `;
  }
  document.head.appendChild(style);
  updateTheme();

  const c = document.createElement("div");
  c.id = id;
  c.innerHTML = `
          <div class="apple-header">
              <span style="font-weight:700; font-size:15px;">FastTrack LS 🏁</span>
              <div style="display:flex; gap:8px;">
                  <button id="sw-theme" class="theme-toggle">🌓</button>
                  <button id="close-ghost" class="theme-toggle" style="color:#FF453A;">&times;</button>
              </div>
          </div>
          <div class="apple-tabs">
              <button id="t-ext" class="apple-tab-btn active">Curso</button>
              <button id="t-fill" class="apple-tab-btn">Inscrição</button>
              <button id="t-check" class="apple-tab-btn">Check-out</button>
          </div>
          <div id="ghost-content"></div>
      `;
  document.body.appendChild(c);

  let cur = "",
    dur = "",
    fdi = "",
    monitorExt = null,
    loopAutoFill = null;

  monitorExt = setInterval(() => {
    const rc = document.getElementById("res-c"),
      rd = document.getElementById("res-d"),
      rf = document.getElementById("res-f");
    const inp = document.querySelector('input[placeholder="Curso"]');
    if (inp && inp.value && cur !== inp.value) {
      cur = inp.value;
      if (rc) rc.innerText = cur;
      dur = "";
      if (rd) rd.innerText = 'Acesse a aba "Sobre"';
    }
    if (!dur) {
      const f = Array.from(document.querySelectorAll("p")).find((el) =>
        el.innerText.match(/\d+\s*(anos|semestres)/i)
      );
      if (f) {
        dur = f.innerText;
        if (rd) rd.innerText = dur;
      }
    }
    const container = document.querySelector(
      '[data-testid="enroll-button-group"]'
    );
    if (container) {
      const btns = container.querySelectorAll(
        'button[data-testid="tag-select"]'
      );
      let enc = fdi || "Selecione...";
      btns.forEach((b) => {
        const bg = window.getComputedStyle(b).backgroundColor;
        const isI = b.className.includes("17ywp6g");
        const isH =
          bg.includes("245, 245, 245") || bg.includes("235, 235, 235");
        if (
          bg !== "transparent" &&
          bg !== "rgba(0, 0, 0, 0)" &&
          bg !== "rgb(255, 255, 255)" &&
          !isH &&
          !isI
        ) {
          enc = b.querySelector("p")
            ? b.querySelector("p").innerText
            : b.innerText;
        }
      });
      fdi = enc.trim();
      if (rf) rf.innerText = fdi;
    }
  }, 1000);

  const render = (type) => {
    activeTab = type;
    const cont = document.getElementById("ghost-content");
    document
      .querySelectorAll(".apple-tab-btn")
      .forEach((b) => b.classList.remove("active"));
    const activeTabEl = document.getElementById("t-" + type);
    if (activeTabEl) activeTabEl.classList.add("active");

    if (type === "ext") {
      cont.innerHTML = `
                  <div class="apple-card">
                      <b>CURSO:</b> <span id="res-c">${cur || "..."}</span><br>
                      <b>DURAÇÃO:</b> <span id="res-d">${
                        dur || "..."
                      }</span><br>
                      <b>FDI:</b> <span id="res-f" style="font-weight:bold; color:#007AFF">${
                        fdi || "..."
                      }</span>
                  </div>
                  <textarea id="txt-in" class="ghost-input" style="height:70px; margin-top:10px;" placeholder="Forma de oferta, turno, valores e endereço..."></textarea>
                  <button id="btn-copy-ext" class="ghost-btn-main" style="background:#34C759;">GERAR E COPIAR</button>`;

      document.getElementById("btn-copy-ext").onclick = async function () {
        const raw = document.getElementById("txt-in").value;
        if (!raw) return;
        const lines = raw
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");

        const vals = raw.match(/\d{1,3}(\.\d{3})*,\d{2}/g);
        const mesesRaw = raw.match(/\d+[°º]/g) || [];
        const meses = mesesRaw.map((m) => m.replace(/[°º]/g, "").trim());

        if (!vals) return;

        let precoFinal = "";

        if (vals.length >= 4 && meses.length >= 5) {
          precoFinal = `📅 Do 1° ao ${meses[3]}° mês:\nDe ~~R$ ${vals[0]}/mês~~ por apenas R$ ${vals[2]}/mês\n\n📅 Do ${meses[4]}° mês até o fim do curso:\nPor apenas R$ ${vals[3]}/mês\n\n(Sujeito apenas ao reajuste anual).`;
        } else if (vals.length >= 3 && meses.length >= 3) {
          precoFinal = `📅 Mensalidade do 1º mês até o fim:\nDe ~~R$ ${vals[0]}/mês~~ por apenas R$ ${vals[2]}/mês`;
        } else {
          precoFinal = `De ~~R$ ${vals[0]}/mês~~ por apenas R$ ${
            vals[vals.length - 1]
          }/mês até o fim do curso.\n\nE você ainda pode contar com o programa Parcela Leve, pagando a primeira ou até as três primeiras mensalidades no valor de R$ 79,00 cada, sendo o restante deduzido do valor integral da mensalidade e diluído ao longo do seu curso. Vale lembrar que, conforme previsto em contrato, as mensalidades, incluindo a parte diluída, estão sujeitas a reajustes anuais.`;
        }

        const msg =
          "⚡ CONDIÇÕES ESPECIAIS\n🎓 Curso: " +
          cur +
          "\n📖 Forma de Oferta: " +
          lines[0] +
          "\n🎟️ Ingresso: " +
          fdi +
          "\n⏳ Duração: " +
          dur +
          "\n🌓 Turno: " +
          (lines[1] === "|" ? lines[2] : lines[1]) +
          "\n📍 Local: " +
          lines[lines.length - 1] +
          "\n\n" +
          precoFinal +
          "\n\n🚀 Para garantir essas ofertas do dia vamos seguir com sua inscrição?";
        await navigator.clipboard.writeText(msg);
        this.innerText = "✅ COPIADO!";
        setTimeout(() => render("ext"), 2000);
      };
    } else if (type === "fill") {
      cont.innerHTML = `
                  <textarea id="txt-fill-in" class="ghost-input" style="height:100px;" placeholder="Nome completo, cpf, data de nascimento, ano de conclusão do ensino médio, telefone, e-mail, cep, nome e número da rua..."></textarea>
                  <button id="btn-run-fill" class="ghost-btn-main" style="background:#007AFF;">🚀 INICIAR PREENCHIMENTO</button>
                  <button id="btn-stop-fill" class="ghost-btn-main" style="background:#FF453A; padding:8px; font-size:10px;">🛑 PARAR</button>
                  <div id="fill-status" style="font-size:10px; text-align:center; margin-top:8px; opacity:0.6;">Aguardando dados...</div>`;

      document.getElementById("btn-run-fill").onclick = function () {
        const t = document.getElementById("txt-fill-in").value;
        if (!t) return;
        const g = (regexLabel, regexFormat) => {
          const byLabel = t.match(regexLabel);
          if (byLabel && byLabel[1]) return byLabel[1].trim();
          const byFormat = t.match(regexFormat);
          return byFormat ? byFormat[0].trim() : "";
        };
        const d = {
          nome: g(/completo:\s*(.*)/i, /^[a-zA-ZÀ-ÿ\s]{10,50}/m),
          cpf:
            g(/CPF:\s*([\d.-]+)/i, /\d{3}\.\d{3}\.\d{3}-\d{2}/) ||
            (t.match(/\d{11}/) ? t.match(/\d{11}/)[0] : ""),
          nasc:
            g(/nascimento:\s*([\d/]+)/i, /\d{2}\/\d{2}\/\d{4}/) ||
            (t.match(/\d{8}/) ? t.match(/\d{8}/)[0] : ""),
          ano: g(/Médio:\s*(\d{4})/i, /20[0-2]\d/),
          mail: g(
            /E-mail:\s*([^\s]+)/i,
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
          ),
          cep:
            g(/CEP:\s*([\d.-]+)/i, /\d{5}-\d{3}/) ||
            (t.match(/\d{8}/) ? t.match(/\d{8}/)[0] : ""),
          num:
            g(/rua.*,\s*(\d+)/i, /(?:,\s*)(\d+)/) ||
            (t.match(/\s(\d+)$/m) ? t.match(/\s(\d+)$/m)[1] : ""),
          tel:
            g(/Telefone:\s*([\d\s()-]+)/i, /\(?\d{2}\)?\s?9\d{4}-?\d{4}/) ||
            (t.match(/\d{10,11}/) ? t.match(/\d{10,11}/)[0] : ""),
        };
        this.innerText = "⚡ MONITORANDO...";
        document.getElementById("fill-status").innerText =
          "Processando: " + (d.nome ? d.nome.split(" ")[0] : "Candidato");
        if (loopAutoFill) clearInterval(loopAutoFill);
        loopAutoFill = setInterval(() => {
          const f = (id, v) => {
            const el = document.getElementById(id);
            if (el && v && (!el.value || el.value.length < 2)) {
              const s = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
              ).set;
              s.call(el, v);
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          };
          f("nome", d.nome);
          f("cpf", d.cpf.replace(/\D/g, ""));
          f("email", d.mail);
          f("cep", d.cep.replace(/\D/g, ""));
          f("anoConclusaoEnsinoMedio", d.ano);
          f("numero", d.num);
          f(
            "dataNascimento",
            d.nasc
              .replace(/\D/g, "")
              .replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3")
          );
          if (d.tel) {
            const c = d.tel.replace(/\D/g, "");
            f(
              "telefone",
              c.length == 11
                ? c.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
                : c
            );
          }
          document.querySelectorAll("input[type='checkbox']").forEach((cb) => {
            if (!cb.checked && cb.id !== "aceite-whats") cb.click();
          });
        }, 1000);
      };
      document.getElementById("btn-stop-fill").onclick = () => {
        clearInterval(loopAutoFill);
        render("fill");
      };
    } else if (type === "check") {
      cont.innerHTML = `
                  <textarea id="txt-check-in" class="ghost-input" style="height:120px;" placeholder="Número de oportunidade, nome, campus, curso, turno e forma de oferta..."></textarea>
                  <button id="btn-run-check" class="ghost-btn-main" style="background:#34C759;">GERAR E COPIAR</button>`;

      document.getElementById("btn-run-check").onclick = async function () {
        const input = document.getElementById("txt-check-in").value;
        if (!input) return;
        const lines = input
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");
        const f = (label) => {
          const idx = lines.findIndex((l) =>
            l.toLowerCase().includes(label.toLowerCase())
          );
          return idx !== -1 && lines[idx + 1] ? lines[idx + 1] : "[---]";
        };
        const msg = `Parabéns por dar esse passo, ${f(
          "Nome da conta"
        )}! 🥳📋\nSua inscrição foi realizada com sucesso! Aqui está o resumo das suas escolhas:\n\nCurso: ${f("Curso")}\nForma de oferta: ${f("Modelo de Ensino")} - ${f(
          "Turno"
        )}\nUnidade: ${f("Campus / Polo")}\nNúmero de inscrição: ${f(
          "Oportunidade"
        )}\n\nPara garantir as ofertas e os descontos especiais da sua inscrição, lembre-se de realizar o pagamento até o vencimento. Segue o link direto, de forma rápida e segura: 🔗 [Inserir Link]\n\nPara o envio de documentos, você pode acessar o Portal do Candidato: 🔗 https://candidatos.portal.estacio.br/acompanhe-sua-matricula. É só entrar com seu CPF, criar uma senha para dar o aceite no contrato e anexar os documentos obrigatórios.\n\nAssim que os documentos forem enviados, nossa área acadêmica fará a análise deles. Depois, com a formação da sua turma, sua matrícula oficial será gerada! 🎉\n\nFicou com alguma dúvida sobre como funciona esse processo após a inscrição?`;
        await navigator.clipboard.writeText(msg);
        this.innerText = "✅ COPIADO!";
        setTimeout(() => render("check"), 2000);
      };
    }
  };

  document.getElementById("sw-theme").onclick = () => {
    isDark = !isDark;
    updateTheme();
    render(activeTab);
  };
  document.getElementById("close-ghost").onclick = () => {
    clearInterval(monitorExt);
    if (loopAutoFill) clearInterval(loopAutoFill);
    document.getElementById(id).remove();
  };

  document.getElementById("t-ext").onclick = () => render("ext");
  document.getElementById("t-fill").onclick = () => render("fill");
  document.getElementById("t-check").onclick = () => render("check");

  render("ext");
})();
