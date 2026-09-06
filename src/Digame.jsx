import React, { useMemo, useState } from "react";

/*
  Dígame — phone call scripts for people new to Spain.
  Daily AI build. React, calls the Anthropic API directly.
  Two sections (Spelling and numbers, On the call) work with no API call at all.
*/

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root{
  --ink:#191333;
  --muted:#6B6688;
  --line:#E7E2F7;
  --v900:#2A1A6B;
  --v600:#5B34E0;
  --v400:#8E6BF0;
  --v150:#DDD3FB;
  --v100:#EDE7FE;
  --v50:#F6F3FF;
  --page:#FBFAFF;
  --stop:#B4322A;
  --warn:#9C5B00;
  --go:#1B6E46;
}
.dg *{box-sizing:border-box}
.dg{
  font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  color:var(--ink); background:var(--page);
  height:100dvh; display:flex; overflow:hidden;
  -webkit-font-smoothing:antialiased; line-height:1.5;
}
.dg button{font-family:inherit}

/* ---------- sidebar ---------- */
.side{
  width:280px; flex:0 0 280px; height:100dvh; overflow-y:auto;
  background:#fff; border-right:1px solid var(--line);
  padding:26px 18px 28px; display:flex; flex-direction:column; gap:22px;
}
.brand{padding:0 8px}
.brand h1{margin:0; font-size:27px; font-weight:800; letter-spacing:-0.02em; color:var(--v600)}
.brand p{margin:5px 0 0; font-size:13px; color:var(--muted)}
.nav{display:flex; flex-direction:column; gap:4px}
.navbtn{
  text-align:left; border:0; background:transparent; cursor:pointer;
  padding:11px 12px; border-radius:14px; display:block; width:100%;
  transition:background .15s ease;
}
.navbtn:hover{background:var(--v50)}
.navbtn.on{background:var(--v100)}
.navbtn .t{font-size:14.5px; font-weight:600; color:var(--ink); display:block}
.navbtn.on .t{color:var(--v900)}
.navbtn .d{font-size:12.2px; color:var(--muted); display:block; margin-top:2px; line-height:1.35}
.sidefoot{margin-top:auto; padding:14px 12px 0; border-top:1px solid var(--line); font-size:12px; color:var(--muted)}

/* ---------- main ---------- */
.main{flex:1; overflow-y:auto; padding:38px 40px 90px}
.wrap{max-width:760px; margin:0 auto}
.h2{font-size:26px; font-weight:800; letter-spacing:-0.02em; margin:0 0 6px}
.sub{font-size:15px; color:var(--muted); margin:0 0 26px; max-width:62ch}
.card{background:#fff; border:1px solid var(--line); border-radius:20px; padding:22px 24px; margin-bottom:16px; box-shadow:0 2px 10px rgba(43,26,107,.05)}
.card h3{margin:0 0 10px; font-size:17px; font-weight:700}
.card p{margin:0 0 10px; font-size:14.6px; color:#3C3557}
.card p:last-child{margin-bottom:0}
.lede{font-size:16.5px; color:#3C3557; max-width:62ch}

/* hero */
.hero{background:linear-gradient(160deg,var(--v600),#3A1FB0); color:#fff; border-radius:26px; padding:34px 34px 30px; margin-bottom:22px}
.hero .say{font-size:52px; font-weight:800; letter-spacing:-0.03em; margin:0; line-height:1}
.hero .gloss{font-size:15px; color:#D9CEFF; margin:10px 0 20px; max-width:52ch}
.hero button{
  border:0; background:rgba(255,255,255,.16); color:#fff; font-size:14px; font-weight:600;
  padding:10px 18px; border-radius:999px; cursor:pointer;
}
.hero button:hover{background:rgba(255,255,255,.26)}

/* form bits */
.field{margin-bottom:24px}
.label{font-size:14.5px; font-weight:700; margin-bottom:3px}
.hint{font-size:13px; color:var(--muted); margin-bottom:10px}
.chips{display:flex; flex-wrap:wrap; gap:8px}
.chip{
  border:1px solid var(--line); background:#fff; color:#3C3557;
  padding:8px 15px; border-radius:999px; font-size:13.6px; font-weight:500; cursor:pointer;
  transition:all .14s ease;
}
.chip:hover{border-color:var(--v400)}
.chip.on{background:var(--v600); border-color:var(--v600); color:#fff; font-weight:600}
.chip.add{border-style:dashed; color:var(--v600)}
.ta,.inp{
  width:100%; border:1px solid var(--line); border-radius:14px; padding:12px 14px;
  font-size:15px; font-family:inherit; color:var(--ink); background:#fff; resize:vertical;
}
.ta:focus,.inp:focus{outline:2px solid var(--v400); outline-offset:1px; border-color:transparent}
.row{display:flex; gap:10px; flex-wrap:wrap}
.go{
  border:0; background:var(--v600); color:#fff; font-size:15.5px; font-weight:700;
  padding:14px 28px; border-radius:999px; cursor:pointer;
}
.go:hover{background:#4A26CC}
.go:disabled{background:var(--v150); color:#fff; cursor:not-allowed}
.ghost{border:1px solid var(--line); background:#fff; color:var(--v600); font-weight:600; font-size:14px; padding:11px 20px; border-radius:999px; cursor:pointer}
.ghost:hover{border-color:var(--v400)}

/* steps */
.step{display:flex; gap:16px; margin-bottom:16px}
.num{
  flex:0 0 34px; height:34px; border-radius:12px; background:var(--v100); color:var(--v900);
  font-weight:800; font-size:15px; display:flex; align-items:center; justify-content:center; margin-top:2px;
}
.stepbody{flex:1; min-width:0}
.steptitle{font-size:17px; font-weight:700; margin:4px 0 10px}

/* phrase block */
.phrase{background:var(--v50); border:1px solid var(--v100); border-radius:16px; padding:15px 17px; margin-bottom:10px}
.phrase .es{font-size:17.5px; font-weight:600; color:var(--v900); margin:0 0 6px; line-height:1.35}
.phrase .en{font-size:14px; color:#3C3557; margin:0 0 4px}
.phrase .sayit{font-size:13.2px; color:var(--muted); margin:0}
.phrase .tools{display:flex; gap:8px; margin-top:11px}
.tiny{
  border:1px solid var(--v150); background:#fff; color:var(--v600); font-size:12.5px; font-weight:600;
  padding:6px 13px; border-radius:999px; cursor:pointer;
}
.tiny:hover{background:var(--v100)}

.qa{border-left:3px solid var(--v150); padding:2px 0 2px 15px; margin-bottom:16px}
.qa .q{font-size:15.5px; font-weight:700; color:var(--v900); margin:0 0 2px}
.qa .qe{font-size:13.4px; color:var(--muted); margin:0 0 9px}
.qa .a{font-size:15px; color:var(--ink); margin:0 0 2px}
.qa .ae{font-size:13.4px; color:var(--muted); margin:0}

ul.plain{margin:0; padding-left:18px}
ul.plain li{font-size:14.8px; color:#3C3557; margin-bottom:7px}

.flag{border:1px solid #F0CFC9; background:#FDF4F2; border-radius:16px; padding:16px 18px; margin-bottom:16px}
.flag .ft{font-size:14.5px; font-weight:700; color:var(--stop); margin:0 0 5px}
.flag p{font-size:14.2px; color:#5A3A37; margin:0}

.note{background:var(--v50); border:1px solid var(--v100); border-radius:16px; padding:16px 18px; font-size:14px; color:#3C3557}

/* call mode */
.big{background:#fff; border:1px solid var(--line); border-radius:22px; padding:26px; margin-bottom:14px}
.big .lbl{font-size:13px; font-weight:700; color:var(--v600); margin:0 0 8px}
.big .txt{font-size:26px; font-weight:700; line-height:1.3; color:var(--ink); margin:0 0 8px; letter-spacing:-0.01em}
.big .gl{font-size:15px; color:var(--muted); margin:0}
.padrow{display:flex; gap:12px; margin-bottom:10px; align-items:center}
.padrow label{flex:0 0 168px; font-size:14px; font-weight:600}

/* spelling */
.spellout{display:flex; flex-wrap:wrap; gap:7px; margin-top:14px}
.letter{background:#fff; border:1px solid var(--line); border-radius:12px; padding:8px 11px; text-align:center; min-width:52px}
.letter .c{font-size:16px; font-weight:800; color:var(--v600); display:block; line-height:1.1}
.letter .n{font-size:11.6px; color:var(--muted); display:block; margin-top:2px}

.exrow{display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px}
.exbtn{border:1px solid var(--line); background:#fff; border-radius:16px; padding:14px 16px; text-align:left; cursor:pointer; flex:1 1 210px}
.exbtn:hover{border-color:var(--v400)}
.exbtn.on{border-color:var(--v600); background:var(--v50)}
.exbtn .et{font-size:14.5px; font-weight:700; display:block; margin-bottom:3px}
.exbtn .ed{font-size:12.8px; color:var(--muted); display:block; line-height:1.35}

.err{border:1px solid #F0CFC9; background:#FDF4F2; border-radius:16px; padding:16px 18px; font-size:14.4px; color:#5A3A37; margin-bottom:16px}
.load{font-size:14.5px; color:var(--v600); font-weight:600}

@media (max-width:820px){
  .dg{flex-direction:column; height:auto; overflow:visible}
  .side{width:100%; flex:none; height:auto; border-right:0; border-bottom:1px solid var(--line); padding:20px 16px}
  .nav{flex-direction:row; overflow-x:auto; gap:8px; padding-bottom:4px}
  .navbtn{flex:0 0 auto; width:auto; padding:9px 14px; border:1px solid var(--line); border-radius:999px}
  .navbtn .d{display:none}
  .sidefoot{display:none}
  .main{padding:24px 18px 70px; overflow:visible}
  .hero{padding:26px 22px}
  .hero .say{font-size:40px}
  .padrow{flex-direction:column; align-items:stretch; gap:6px}
  .padrow label{flex:none}
}
`;

/* ------------------------------------------------------------------ */
/*  Static option data                                                  */
/* ------------------------------------------------------------------ */

const OFFICES = [
  "Oficina de Extranjería",
  "Seguridad Social",
  "Ayuntamiento (padrón)",
  "Agencia Tributaria (Hacienda)",
  "Health centre or hospital",
  "DGT / Tráfico",
  "Electricity, water or gas company",
  "Bank",
  "Landlord or estate agency",
  "Internet or phone provider",
  "School or guardería",
];

const LEVELS = [
  "No Spanish at all",
  "A few words",
  "I can follow if they go slowly",
  "Fine in person, lost on the phone",
];

const SITUATIONS = [
  "First time asking",
  "Chasing something that has not happened",
  "Fixing a mistake they made",
  "Cancelling or ending something",
  "Booking an appointment",
];

const HAVE = [
  "NIE or TIE number",
  "Expediente (file) number",
  "Passport",
  "Padrón certificate",
  "Contract or policy number",
  "A bill or invoice",
  "Bank IBAN",
  "Nothing yet",
];

const LETTERS = {
  A: "a", B: "be", C: "ce", D: "de", E: "e", F: "efe", G: "ge", H: "hache",
  I: "i", J: "jota", K: "ka", L: "ele", M: "eme", N: "ene", "Ñ": "eñe",
  O: "o", P: "pe", Q: "cu", R: "erre", S: "ese", T: "te", U: "u",
  V: "uve", W: "uve doble", X: "equis", Y: "i griega", Z: "zeta",
  "0": "cero", "1": "uno", "2": "dos", "3": "tres", "4": "cuatro",
  "5": "cinco", "6": "seis", "7": "siete", "8": "ocho", "9": "nueve",
  "@": "arroba", ".": "punto", "-": "guion", "_": "guion bajo", "/": "barra",
  " ": "(pausa)",
};

/* ------------------------------------------------------------------ */
/*  Worked examples, saved so the app works with no API call            */
/* ------------------------------------------------------------------ */

const EXAMPLES = [
  {
    key: "tie",
    tab: "The card that never came",
    tabdesc: "Extranjería, chasing a TIE eight weeks after applying, no Spanish.",
    sheet: {
      office: "Oficina de Extranjería",
      goal_en: "Find out what stage your TIE card is at and what happens next.",
      menu: {
        expect:
          "A recorded menu in Spanish before any person answers. It normally asks for your province first, then the type of procedure, then your NIE.",
        tips: [
          "Have the expediente number on the desk before you dial. Some menus ask you to key it in.",
          "If you press the wrong option, stop pressing. Many systems pass you to a person after two failed attempts.",
          "Lines are usually answered mornings only, and the first ten minutes after opening are the best chance.",
        ],
      },
      opening: {
        es: "Buenos días. Disculpe, hablo poco español. ¿Puede hablar despacio, por favor?",
        en: "Good morning. Sorry, I speak little Spanish. Could you speak slowly, please?",
        say: "bwe-nos DEE-as. dis-KUL-peh, AH-blo PO-ko es-pan-YOL. PWE-deh ab-LAR des-PA-syo, por fa-VOR",
      },
      reason: {
        es: "Llamo por mi tarjeta de identidad de extranjero. Presenté la solicitud hace ocho semanas y no he recibido nada.",
        en: "I'm calling about my foreigner ID card. I applied eight weeks ago and I have received nothing.",
        say: "YA-mo por mee tar-HE-ta de ee-den-tee-DAD de ex-tran-HE-ro",
      },
      have_ready: [
        {
          item: "Expediente number",
          why: "Nothing moves until they have it. It is printed on the resguardo you were handed when you applied.",
          es: "Mi número de expediente es ...",
        },
        {
          item: "NIE and full name as it appears on the application",
          why: "They cross-check the file against the name, and foreign surnames are often entered wrongly.",
          es: "Mi NIE es ... y mi apellido se escribe ...",
        },
        {
          item: "The date you applied",
          why: "They will ask how long you have waited before deciding whether the file is genuinely overdue.",
          es: "Presenté la solicitud el ... de ... .",
        },
      ],
      their_questions: [
        {
          q_es: "¿Me puede deletrear su apellido?",
          q_en: "Can you spell your surname?",
          answer_es: "Sí, se lo deletreo despacio: ...",
          answer_en: "Yes, I'll spell it slowly for you: ... (use the Spelling section for the letter names)",
        },
        {
          q_es: "¿Ha recibido algún SMS o alguna carta nuestra?",
          q_en: "Have you had any text message or letter from us?",
          answer_es: "No he recibido nada. / Sí, recibí un mensaje pero no lo entiendo.",
          answer_en: "I have not received anything. / Yes, I got a message but I do not understand it.",
        },
        {
          q_es: "¿En qué oficina presentó la solicitud?",
          q_en: "Which office did you submit the application at?",
          answer_es: "La presenté en la oficina de ... .",
          answer_en: "I submitted it at the ... office.",
        },
      ],
      rescue: [
        {
          es: "Más despacio, por favor.",
          en: "Slower, please.",
          say: "mas des-PA-syo, por fa-VOR",
        },
        {
          es: "Un momento, por favor, lo estoy apuntando.",
          en: "One moment please, I'm writing it down.",
          say: "oon mo-MEN-to, por fa-VOR, lo es-TOY a-poon-TAN-do",
        },
        {
          es: "No le entiendo. ¿Me lo puede enviar por correo electrónico?",
          en: "I don't understand you. Can you send it to me by email?",
          say: "no leh en-TYEN-do. meh lo PWE-deh en-vee-AR por ko-RRE-o e-lek-TRO-nee-ko",
        },
      ],
      before_hanging_up: [
        "Ask for a reference for the call itself: ¿Me puede dar un número de referencia de esta llamada?",
        "Write down the name of the person and the time you spoke.",
        "Ask what you have to do next and by when: ¿Qué tengo que hacer ahora y cuándo?",
      ],
      if_it_fails: [
        "The line being permanently engaged is normal rather than a sign something is wrong. Try again on the hour they open.",
        "You can check the state of the file yourself online using the expediente number, which is faster than the phone.",
        "If the call gets you nowhere, a written request submitted at the office register creates a dated record they have to answer.",
      ],
      watch_out:
        "Extranjería will never ask you to pay anything over the phone. If a caller asks for card details or a transfer to speed up a file, hang up.",
    },
  },
  {
    key: "ss",
    tab: "Starting work on Monday",
    tabdesc: "Seguridad Social, asking for your social security number, a few words of Spanish.",
    sheet: {
      office: "Tesorería General de la Seguridad Social",
      goal_en: "Get your número de la Seguridad Social so your employer can register you.",
      menu: {
        expect:
          "A menu that asks whether you are calling as a citizen or a company, then offers appointment booking before anything else.",
        tips: [
          "The option for a person is usually near the end of the list, so wait through it rather than pressing early.",
          "If the menu offers a callback slot, take it. It is often quicker than holding.",
          "Say the word cita if you get a voice-recognition menu rather than a keypad one.",
        ],
      },
      opening: {
        es: "Buenos días. Hablo un poco de español. Despacio, por favor.",
        en: "Good morning. I speak a little Spanish. Slowly, please.",
        say: "bwe-nos DEE-as. AH-blo oon PO-ko de es-pan-YOL. des-PA-syo, por fa-VOR",
      },
      reason: {
        es: "Llamo para solicitar mi número de la Seguridad Social. Empiezo a trabajar y la empresa me lo pide.",
        en: "I'm calling to request my social security number. I'm starting work and my employer is asking for it.",
        say: "YA-mo PA-ra so-lee-see-TAR mee NOO-me-ro de la se-goo-ree-DAD so-SYAL",
      },
      have_ready: [
        {
          item: "NIE and passport, both in front of you",
          why: "They will ask for the NIE and often check it against the passport number when the NIE is recent.",
          es: "Mi NIE es ... y mi pasaporte es ... .",
        },
        {
          item: "Your registered address",
          why: "The number is issued against an address, and a mismatch with the padrón sends the request back.",
          es: "Mi domicilio es ... .",
        },
        {
          item: "Employer name and start date",
          why: "It explains the urgency and lets them tell you whether the company can request it instead.",
          es: "Empiezo a trabajar el ... en la empresa ... .",
        },
      ],
      their_questions: [
        {
          q_es: "¿Ha tenido alguna vez un número de la Seguridad Social en España?",
          q_en: "Have you ever had a Spanish social security number before?",
          answer_es: "No, es la primera vez. / Creo que sí, pero no lo tengo.",
          answer_en: "No, this is the first time. / I think so, but I do not have it.",
        },
        {
          q_es: "¿Tiene cita previa?",
          q_en: "Do you have an appointment?",
          answer_es: "No, todavía no. ¿Me puede dar una cita, por favor?",
          answer_en: "Not yet. Could you give me an appointment, please?",
        },
        {
          q_es: "¿Me confirma su correo electrónico?",
          q_en: "Can you confirm your email address?",
          answer_es: "Sí. Se lo deletreo: ...",
          answer_en: "Yes. I'll spell it out: ... (arroba for @, punto for the dot)",
        },
      ],
      rescue: [
        {
          es: "¿Cómo se escribe?",
          en: "How is that spelt?",
          say: "KO-mo seh es-KREE-beh",
        },
        {
          es: "¿Me lo puede repetir, por favor?",
          en: "Could you repeat that, please?",
          say: "meh lo PWE-deh re-pe-TEER, por fa-VOR",
        },
        {
          es: "Perdone, ¿qué documentos tengo que llevar?",
          en: "Sorry, which documents do I have to bring?",
          say: "per-DO-neh, keh do-koo-MEN-tos TEN-go keh yeh-VAR",
        },
      ],
      before_hanging_up: [
        "Read the number back to them digit by digit and ask them to confirm it.",
        "Ask which office the appointment is at and what you must bring: ¿En qué oficina y con qué documentos?",
        "Ask whether the number will also arrive in writing.",
      ],
      if_it_fails: [
        "The request can be made online through the Seguridad Social portal without a call, which avoids the queue entirely.",
        "Employers with a gestoría can usually request the number for you, so ask your new company before you spend a morning on hold.",
        "In-person appointments are often available sooner in smaller towns than in the provincial capital.",
      ],
      watch_out:
        "The number is free and permanent. Anyone charging a fee to obtain it for you is selling you something you can get yourself.",
    },
  },
  {
    key: "luz",
    tab: "The bill that tripled",
    tabdesc: "Electricity supplier, querying a reading and a tariff, can follow slowly.",
    sheet: {
      office: "Your electricity supplier",
      goal_en: "Find out whether the reading is real or estimated, and open a formal complaint if it is wrong.",
      menu: {
        expect:
          "A long menu that asks whether you are an existing customer, then for your NIE or DNI, then the reason for the call.",
        tips: [
          "Choosing the option about ending your contract usually reaches a person fastest, because it routes to the retention team.",
          "Keep saying agente or operador at a voice menu until it gives up and transfers you.",
          "Call from the number listed on the bill itself rather than one found through a search, which avoids look-alike call centres.",
        ],
      },
      opening: {
        es: "Buenas tardes. Llamo por una factura. Hablo español despacio, disculpe.",
        en: "Good afternoon. I'm calling about a bill. I speak Spanish slowly, sorry.",
        say: "BWE-nas TAR-des. YA-mo por OO-na fak-TOO-ra",
      },
      reason: {
        es: "Mi última factura es mucho más alta de lo normal. ¿Me puede decir si la lectura es real o estimada?",
        en: "My last bill is much higher than usual. Can you tell me whether the reading is actual or estimated?",
        say: "mee OOL-tee-ma fak-TOO-ra es MOO-cho mas AL-ta de lo nor-MAL",
      },
      have_ready: [
        {
          item: "The CUPS number from the bill",
          why: "It identifies the physical supply point and is the only thing that never changes. It starts with ES.",
          es: "Mi CUPS es ... .",
        },
        {
          item: "Invoice number, period and amount",
          why: "They will pull up the wrong month otherwise, and the comparison with previous months is the whole argument.",
          es: "La factura número ... del mes de ... por ... euros.",
        },
        {
          item: "Today's meter reading",
          why: "It settles in one sentence whether an estimate was too high.",
          es: "La lectura de mi contador hoy es ... .",
        },
      ],
      their_questions: [
        {
          q_es: "¿Me facilita el CUPS o el número de contrato?",
          q_en: "Can you give me the CUPS or the contract number?",
          answer_es: "Sí, se lo leo: ...",
          answer_en: "Yes, I'll read it out: ...",
        },
        {
          q_es: "¿Ha cambiado algo en su consumo este mes?",
          q_en: "Has anything changed in your consumption this month?",
          answer_es: "No, nada. Vivimos igual que el mes pasado.",
          answer_en: "No, nothing. We're living the same as last month.",
        },
        {
          q_es: "¿Quiere que le abra una reclamación?",
          q_en: "Would you like me to open a complaint for you?",
          answer_es: "Sí, quiero poner una reclamación. ¿Me da el número, por favor?",
          answer_en: "Yes, I want to file a complaint. Can you give me the number, please?",
        },
      ],
      rescue: [
        {
          es: "Perdone, no entiendo esa palabra. ¿Qué significa?",
          en: "Sorry, I don't understand that word. What does it mean?",
          say: "per-DO-neh, no en-TYEN-do E-sa pa-LA-bra",
        },
        {
          es: "¿Me lo puede confirmar por escrito?",
          en: "Can you confirm that to me in writing?",
          say: "meh lo PWE-deh kon-feer-MAR por es-KREE-to",
        },
        {
          es: "¿Me puede pasar con un agente?",
          en: "Can you put me through to an agent?",
          say: "meh PWE-deh pa-SAR kon oon a-HEN-teh",
        },
      ],
      before_hanging_up: [
        "Get the complaint number and repeat it back: ¿Me confirma el número de reclamación?",
        "Ask whether the bill is on hold while it is reviewed: ¿La factura queda parada mientras tanto?",
        "Ask when the next real reading is due.",
      ],
      if_it_fails: [
        "Meter readings are handled by the distributor rather than the company that bills you, so a second call may be needed.",
        "Every supplier has to give you a complaint reference. Without one you have no case later, so do not end the call until you have it.",
        "If the supplier will not move, the regional consumer office takes complaints about utility billing.",
      ],
      watch_out:
        "Do not agree to any tariff change during this call. Cold callers claiming to be your supplier and offering a discount in exchange for confirming your details are common, so if in doubt hang up and dial the number on your own bill.",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function speak(text) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.82;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* no voice available, the written pronunciation still works */
  }
}

function copy(text) {
  try {
    if (navigator && navigator.clipboard) navigator.clipboard.writeText(text);
  } catch (e) {
    /* clipboard blocked */
  }
}

function Phrase({ es, en, say }) {
  return (
    <div className="phrase">
      <p className="es">{es}</p>
      {en ? <p className="en">{en}</p> : null}
      {say ? <p className="sayit">Sounds like: {say}</p> : null}
      <div className="tools">
        <button className="tiny" onClick={() => speak(es)}>Hear it</button>
        <button className="tiny" onClick={() => copy(es)}>Copy</button>
      </div>
    </div>
  );
}

function Chips({ options, value, onChange, multi, custom, setCustom }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const all = custom ? options.concat(custom) : options;

  const toggle = (o) => {
    if (multi) {
      onChange(value.includes(o) ? value.filter((v) => v !== o) : value.concat(o));
    } else {
      onChange(value === o ? "" : o);
    }
  };

  const on = (o) => (multi ? value.includes(o) : value === o);

  const commit = () => {
    const d = draft.trim();
    if (d) {
      if (setCustom) setCustom((c) => (c.includes(d) ? c : c.concat(d)));
      if (multi) onChange(value.concat(d));
      else onChange(d);
    }
    setDraft("");
    setAdding(false);
  };

  return (
    <div>
      <div className="chips">
        {all.map((o) => (
          <button key={o} className={on(o) ? "chip on" : "chip"} onClick={() => toggle(o)}>
            {o}
          </button>
        ))}
        {setCustom && !adding ? (
          <button className="chip add" onClick={() => setAdding(true)}>
            Add your own
          </button>
        ) : null}
      </div>
      {adding ? (
        <div className="row" style={{ marginTop: 10 }}>
          <input
            className="inp"
            style={{ flex: 1, minWidth: 200 }}
            autoFocus
            value={draft}
            placeholder="Type it and press enter"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(""); setAdding(false); }
            }}
          />
          <button className="ghost" onClick={commit}>Add</button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The prompt                                                          */
/* ------------------------------------------------------------------ */

/* The two prompts live in api/script.js on the server, not in this bundle.
   The browser only sends which half it wants and the caller's brief. */

/* The reply is parsed by tag rather than as JSON. A cut-off reply simply loses
   its last lines instead of becoming unparseable, and Spanish text containing
   quotes, accents or line breaks cannot corrupt the structure. */

function parseTagged(text) {
  const out = {};
  const lines = String(text || "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*\**\s*([A-Z_]{3,10})\s*:\s*(.+?)\s*\**\s*$/);
    if (!m) continue;
    const val = m[2].trim();
    if (!val) continue;
    const parts = val.split("|").map((p) => p.trim()).filter((p) => p.length > 0);
    if (!parts.length) continue;
    if (!out[m[1]]) out[m[1]] = [];
    out[m[1]].push(parts);
  }
  return out;
}

const trio = (p) => ({ es: p[0], en: p[1] || "", say: p[2] || "" });

function shapeA(text) {
  const t = parseTagged(text);
  const s = {};
  if (t.OFFICE) s.office = t.OFFICE[0][0];
  if (t.GOAL) s.goal_en = t.GOAL[0][0];
  if (t.MENU) s.menu = { expect: t.MENU[0][0], tips: (t.MENUTIP || []).map((p) => p[0]) };
  if (t.OPENING) s.opening = trio(t.OPENING[0]);
  if (t.REASON) s.reason = trio(t.REASON[0]);
  if (t.READY) s.have_ready = t.READY.map((p) => ({ item: p[0], why: p[1] || "", es: p[2] || "" }));
  return s;
}

function shapeB(text) {
  const t = parseTagged(text);
  const s = {};
  if (t.ASK) {
    s.their_questions = t.ASK.map((p) => ({
      q_es: p[0],
      q_en: p[1] || "",
      answer_es: p[2] || "",
      answer_en: p[3] || "",
    }));
  }
  if (t.RESCUE) s.rescue = t.RESCUE.map(trio);
  if (t.CLOSE) s.before_hanging_up = t.CLOSE.map((p) => p[0]);
  if (t.FAIL) s.if_it_fails = t.FAIL.map((p) => p[0]);
  if (t.WATCH) s.watch_out = t.WATCH[0][0];
  return s;
}

/* Kept as a fallback for the case where the model ignores the format and
   answers in JSON anyway. Truncated or fenced JSON is repaired rather than
   thrown away. */

function closeJson(fragment) {
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < fragment.length; i++) {
    const c = fragment[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") stack.pop();
  }
  let out = fragment;
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === "{" ? "}" : "]";
  return out;
}

function relaxedParse(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  const body = text.slice(start);
  try {
    return JSON.parse(body);
  } catch (e) {
    /* fall through to repair */
  }
  for (let i = body.length; i > 40; i--) {
    const c = body[i - 1];
    if (c !== '"' && c !== "}" && c !== "]" && !/[a-zA-Z0-9]/.test(c)) continue;
    try {
      const parsed = JSON.parse(closeJson(body.slice(0, i)));
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) {
      /* keep trimming */
    }
  }
  return null;
}

async function ask(half, brief, shaper) {
  let res;
  try {
    res = await fetch("/api/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ half: half, brief: brief }),
    });
  } catch (e) {
    const err = new Error("network");
    err.kind = "network";
    err.detail = String(e && e.message ? e.message : e);
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* the server sent something that is not JSON, handled below */
  }

  if (!res.ok) {
    const err = new Error("http");
    err.kind = "http";
    err.status = res.status;
    err.detail = (data && (data.error || data.raw)) || "No detail returned.";
    throw err;
  }

  const text = data && typeof data.text === "string" ? data.text.trim() : "";
  if (!text) {
    const err = new Error("empty");
    err.kind = "empty";
    err.detail = JSON.stringify(data).slice(0, 400);
    throw err;
  }

  let shaped = shaper(text);
  if (!Object.keys(shaped).length) {
    const asJson = relaxedParse(text);
    if (asJson && typeof asJson === "object") shaped = asJson;
  }

  if (!Object.keys(shaped).length) {
    const err = new Error("shape");
    err.kind = "shape";
    err.detail = text.slice(0, 500);
    throw err;
  }
  return shaped;
}

/* ------------------------------------------------------------------ */
/*  App                                                                 */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "start", t: "Start here", d: "What this does and how to use it on a real call." },
  { id: "build", t: "Build your script", d: "Tell it who you are ringing and what you need." },
  { id: "sheet", t: "Your call sheet", d: "The call in order, from the menu to hanging up." },
  { id: "call", t: "On the call", d: "Big text to hold up while you are talking." },
  { id: "spell", t: "Spelling and numbers", d: "Say your name, NIE or email out loud in Spanish." },
  { id: "examples", t: "Worked examples", d: "Three finished call sheets, no key needed." },
  { id: "about", t: "How this works", d: "Where the wording comes from and what it cannot do." },
];

export default function Digame() {
  const [tab, setTab] = useState("start");

  const [office, setOffice] = useState("");
  const [officeCustom, setOfficeCustom] = useState([]);
  const [need, setNeed] = useState("");
  const [level, setLevel] = useState("A few words");
  const [situation, setSituation] = useState("");
  const [have, setHave] = useState([]);
  const [haveCustom, setHaveCustom] = useState([]);
  const [where, setWhere] = useState("");

  const [sheet, setSheet] = useState(null);
  const [partial, setPartial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [exKey, setExKey] = useState(EXAMPLES[0].key);
  const [spellIn, setSpellIn] = useState("");
  const [pad, setPad] = useState({ ref: "", who: "", next: "", when: "" });

  const ready = office && need.trim().length > 3;

  function describe(err) {
    if (!err) return null;
    if (err.kind === "http") {
      return {
        msg:
          "The request did not get through" +
          (err.status ? " (status " + err.status + ")" : "") +
          ". The message underneath comes from the server, not from this page.",
        detail: err.detail,
      };
    }
    if (err.kind === "network") {
      return { msg: "The request could not leave the page. Check the connection and try again.", detail: err.detail };
    }
    if (err.kind === "empty") {
      return { msg: "The reply arrived with no text in it. This is the raw response.", detail: err.detail };
    }
    return {
      msg: "The reply came back in a shape this page could not read. It is printed below exactly as it arrived.",
      detail: err.detail,
    };
  }

  async function build() {
    setBusy(true);
    setError(null);
    setPartial(false);

    const brief = [
      "Who I am ringing: " + office,
      "What I need: " + need.trim(),
      "My Spanish: " + level,
      situation ? "Situation: " + situation : "",
      have.length ? "What I already have with me: " + have.join(", ") : "",
      where ? "Where I am: " + where : "",
    ]
      .filter(Boolean)
      .join("\n");

    /* Each half renders the moment it lands. Half A carries the opening lines
       and arrives well before half B, so the caller sees what to say first
       rather than waiting on the slower request. */
    let arrived = 0;
    let firstError = null;

    const take = (promise) =>
      promise
        .then((part) => {
          arrived += 1;
          setSheet((prev) => Object.assign({ office: office, goal_en: need.trim() }, prev || {}, part));
          setTab("sheet");
        })
        .catch((e) => {
          if (!firstError) firstError = e;
        });

    await Promise.all([
      take(ask("a", brief, shapeA)),
      take(ask("b", brief, shapeB)),
    ]);

    if (arrived === 0) {
      setError(describe(firstError));
      setSheet(null);
    } else {
      setPartial(arrived === 1);
    }
    setBusy(false);
  }

  const example = useMemo(() => EXAMPLES.find((e) => e.key === exKey), [exKey]);
  const callSheet = sheet || example.sheet;

  const spelled = useMemo(() => {
    return spellIn
      .toUpperCase()
      .split("")
      .map((ch, i) => ({ ch, name: LETTERS[ch] || ch, i }));
  }, [spellIn]);

  function renderSheet(s) {
    if (!s) return null;
    const missing = busy
      ? "Still being written."
      : "This part did not come back. Build it again to fill it in.";
    return (
      <div>
        <div className="card">
          <h3>{s.office}</h3>
          <p>{s.goal_en}</p>
        </div>

        <div className="step">
          <div className="num">1</div>
          <div className="stepbody">
            <div className="steptitle">Before you dial</div>
            {!(s.have_ready || []).length ? <div className="note">{missing}</div> : null}
            {(s.have_ready || []).map((h, i) => (
              <div className="qa" key={i}>
                <p className="q">{h.item}</p>
                <p className="qe">{h.why}</p>
                <p className="a">{h.es}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="step">
          <div className="num">2</div>
          <div className="stepbody">
            <div className="steptitle">The recorded menu</div>
            <p style={{ fontSize: 14.8, color: "#3C3557", marginTop: 0 }}>{(s.menu && s.menu.expect) || missing}</p>
            <ul className="plain">
              {((s.menu && s.menu.tips) || []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="step">
          <div className="num">3</div>
          <div className="stepbody">
            <div className="steptitle">Your first fifteen seconds</div>
            {s.opening ? <Phrase {...s.opening} /> : <div className="note">{missing}</div>}
          </div>
        </div>

        <div className="step">
          <div className="num">4</div>
          <div className="stepbody">
            <div className="steptitle">Why you are calling</div>
            {s.reason ? <Phrase {...s.reason} /> : <div className="note">{missing}</div>}
          </div>
        </div>

        <div className="step">
          <div className="num">5</div>
          <div className="stepbody">
            <div className="steptitle">What they will ask you back</div>
            {!(s.their_questions || []).length ? <div className="note">{missing}</div> : null}
            {(s.their_questions || []).map((q, i) => (
              <div className="qa" key={i}>
                <p className="q">{q.q_es}</p>
                <p className="qe">{q.q_en}</p>
                <p className="a">{q.answer_es}</p>
                <p className="ae">{q.answer_en}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="step">
          <div className="num">6</div>
          <div className="stepbody">
            <div className="steptitle">When you lose the thread</div>
            {!(s.rescue || []).length ? <div className="note">{missing}</div> : null}
            {(s.rescue || []).map((r, i) => (
              <Phrase key={i} {...r} />
            ))}
          </div>
        </div>

        <div className="step">
          <div className="num">7</div>
          <div className="stepbody">
            <div className="steptitle">Before you hang up</div>
            {!(s.before_hanging_up || []).length ? <div className="note">{missing}</div> : null}
            <ul className="plain">
              {(s.before_hanging_up || []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card">
          <h3>If the call goes nowhere</h3>
          {!(s.if_it_fails || []).length ? <div className="note">{missing}</div> : null}
          <ul className="plain">
            {(s.if_it_fails || []).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        {s.watch_out ? (
          <div className="flag">
            <p className="ft">Worth knowing</p>
            <p>{s.watch_out}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="dg">
      <style>{CSS}</style>

      <aside className="side">
        <div className="brand">
          <h1>Dígame</h1>
          <p>Phone calls in Spain, scripted before you dial.</p>
        </div>
        <nav className="nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={tab === s.id ? "navbtn on" : "navbtn"}
              onClick={() => setTab(s.id)}
            >
              <span className="t">{s.t}</span>
              <span className="d">{s.d}</span>
            </button>
          ))}
        </nav>
        <div className="sidefoot">
          Wording is generated for each call and can be imperfect. Nothing here is legal or tax advice.
        </div>
      </aside>

      <main className="main">
        <div className="wrap">

          {tab === "start" ? (
            <div>
              <div className="hero">
                <p className="say">¿Dígame?</p>
                <p className="gloss">
                  The first word you will hear when somebody picks up. It means go ahead, I'm listening. Press play and hear it once before you ever have to answer it.
                </p>
                <button onClick={() => speak("¿Dígame?")}>Hear it</button>
              </div>

              <p className="lede" style={{ marginBottom: 22 }}>
                Ringing a Spanish office when your Spanish is shaky is harder than any form, because you cannot pause and look things up. This writes the call out in advance, in the order it happens, so you are reading rather than translating.
              </p>

              <div className="card">
                <h3>How to use it</h3>
                <p>Fill in who you are ringing and what you need. You get a call sheet covering the recorded menu, your opening line, the sentence that gets you routed to the right desk, the questions they will fire back with answers already written, the phrases that rescue you mid-call, and what to write down before you hang up.</p>
                <p>Open the big-text view before you dial. It fits on a phone screen held next to your ear, and it has a pad for the reference number they read out at the end.</p>
              </div>

              <div className="card">
                <h3>The bit everyone gets caught by</h3>
                <p>They will ask you to spell your surname, and Spanish letter names are nothing like English ones. G and J sound the same to an English ear, V is uve, Y is i griega. The spelling section turns your name, NIE or email into what you actually say out loud.</p>
              </div>

              <div className="row">
                <button className="go" onClick={() => setTab("build")}>Build a call sheet</button>
                <button className="ghost" onClick={() => setTab("examples")}>See a finished one first</button>
              </div>
            </div>
          ) : null}

          {tab === "build" ? (
            <div>
              <h2 className="h2">Build your script</h2>
              <p className="sub">The more specific you are about what you need, the more useful the answers they will ask you for.</p>

              <div className="field">
                <div className="label">Who are you ringing?</div>
                <div className="hint">Pick the closest one, or add the name of the company or office.</div>
                <Chips options={OFFICES} value={office} onChange={setOffice} custom={officeCustom} setCustom={setOfficeCustom} />
              </div>

              <div className="field">
                <div className="label">What do you need from them?</div>
                <div className="hint">One or two sentences in English. Say what has already happened, not just what you want.</div>
                <textarea
                  className="ta"
                  rows={4}
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  placeholder="I applied for my TIE eight weeks ago and nothing has arrived. I want to know what stage it is at."
                />
              </div>

              <div className="field">
                <div className="label">How much Spanish do you have?</div>
                <div className="hint">This changes how long the sentences are, not how polite they are.</div>
                <Chips options={LEVELS} value={level} onChange={setLevel} />
              </div>

              <div className="field">
                <div className="label">Which kind of call is it?</div>
                <Chips options={SITUATIONS} value={situation} onChange={setSituation} />
              </div>

              <div className="field">
                <div className="label">What do you already have to hand?</div>
                <div className="hint">Pick everything you can put on the desk before you dial.</div>
                <Chips options={HAVE} value={have} onChange={setHave} multi custom={haveCustom} setCustom={setHaveCustom} />
              </div>

              <div className="field">
                <div className="label">Where are you? (optional)</div>
                <div className="hint">Procedures and offices vary by province, and it will say so where it matters.</div>
                <input className="inp" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Málaga" />
              </div>

              {error ? (
                <div className="err">
                  <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{error.msg}</p>
                  {error.detail ? (
                    <pre
                      style={{
                        margin: "0 0 12px",
                        fontSize: 12.4,
                        lineHeight: 1.45,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: 200,
                        overflow: "auto",
                        background: "#fff",
                        border: "1px solid #F0CFC9",
                        borderRadius: 12,
                        padding: "10px 12px",
                        fontFamily: "inherit",
                      }}
                    >
                      {error.detail}
                    </pre>
                  ) : null}
                  <button className="ghost" onClick={build} disabled={busy}>Try again</button>
                </div>
              ) : null}

              <div className="row" style={{ alignItems: "center", gap: 16 }}>
                <button className="go" disabled={!ready || busy} onClick={build}>
                  {busy ? "Writing your call sheet" : "Write my call sheet"}
                </button>
                {!ready ? <span className="hint" style={{ margin: 0 }}>Pick who you are ringing and say what you need.</span> : null}
              </div>
            </div>
          ) : null}

          {tab === "sheet" ? (
            <div>
              <h2 className="h2">Your call sheet</h2>
              {sheet ? (
                <div>
                  <p className="sub">Read it once through before you dial. Steps three, four and six are the ones you say out loud.</p>
                  {busy ? (
                    <div className="note" style={{ marginBottom: 16 }}>
                      The rest is still being written. What is here is ready to read.
                    </div>
                  ) : null}
                  {partial && !busy ? (
                    <div className="err">
                      <p style={{ margin: "0 0 10px", fontWeight: 700 }}>Half of this arrived. The rest was cut off.</p>
                      <button className="ghost" onClick={build} disabled={busy}>Fill in the missing part</button>
                    </div>
                  ) : null}
                  {renderSheet(sheet)}
                  <div className="row">
                    <button className="go" onClick={() => setTab("call")}>Open the big-text view</button>
                    <button className="ghost" onClick={() => setTab("build")}>Change something</button>
                  </div>
                </div>
              ) : (
                <div className="note">
                  Nothing built yet. Fill in the form under Build your script, or open Worked examples to see three finished ones.
                </div>
              )}
            </div>
          ) : null}

          {tab === "call" ? (
            <div>
              <h2 className="h2">On the call</h2>
              <p className="sub">
                {sheet ? "Your script, stripped back to what you have to say." : "Showing a worked example. Build your own and this fills with it."}
              </p>

              <div className="big">
                <p className="lbl">Open with</p>
                <p className="txt">{(callSheet.opening && callSheet.opening.es) || "Not written yet. Build a call sheet first."}</p>
                <p className="gl">{(callSheet.opening && callSheet.opening.en) || ""}</p>
                <div className="tools" style={{ marginTop: 12 }}>
                  <button className="tiny" onClick={() => speak((callSheet.opening && callSheet.opening.es) || "")}>Hear it</button>
                </div>
              </div>

              <div className="big">
                <p className="lbl">Then say why</p>
                <p className="txt">{(callSheet.reason && callSheet.reason.es) || "Not written yet."}</p>
                <p className="gl">{(callSheet.reason && callSheet.reason.en) || ""}</p>
                <div className="tools" style={{ marginTop: 12 }}>
                  <button className="tiny" onClick={() => speak((callSheet.reason && callSheet.reason.es) || "")}>Hear it</button>
                </div>
              </div>

              <div className="big">
                <p className="lbl">If you are lost</p>
                {(callSheet.rescue || []).map((r, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <p className="txt" style={{ fontSize: 21, marginBottom: 4 }}>{r.es}</p>
                    <p className="gl">{r.en}</p>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3>Write it down while they are still on the line</h3>
                <div className="padrow">
                  <label>Reference number</label>
                  <input className="inp" value={pad.ref} onChange={(e) => setPad({ ...pad, ref: e.target.value })} />
                </div>
                <div className="padrow">
                  <label>Who you spoke to</label>
                  <input className="inp" value={pad.who} onChange={(e) => setPad({ ...pad, who: e.target.value })} />
                </div>
                <div className="padrow">
                  <label>What happens next</label>
                  <input className="inp" value={pad.next} onChange={(e) => setPad({ ...pad, next: e.target.value })} />
                </div>
                <div className="padrow">
                  <label>By when</label>
                  <input className="inp" value={pad.when} onChange={(e) => setPad({ ...pad, when: e.target.value })} />
                </div>
                <div className="row" style={{ marginTop: 14 }}>
                  <button
                    className="ghost"
                    onClick={() =>
                      copy(
                        "Call to " + callSheet.office +
                        "\nReference: " + pad.ref +
                        "\nSpoke to: " + pad.who +
                        "\nNext: " + pad.next +
                        "\nBy: " + pad.when
                      )
                    }
                  >
                    Copy these notes
                  </button>
                </div>
                <p style={{ marginTop: 12, fontSize: 13.4, color: "var(--muted)" }}>
                  Nothing typed here is stored. Copy it somewhere before you close the page.
                </p>
              </div>
            </div>
          ) : null}

          {tab === "spell" ? (
            <div>
              <h2 className="h2">Spelling and numbers</h2>
              <p className="sub">Type your surname, your NIE, or your email address. This is how you read it out.</p>

              <div className="card">
                <input
                  className="inp"
                  value={spellIn}
                  onChange={(e) => setSpellIn(e.target.value)}
                  placeholder="Kakkar, or X1234567L, or name@gmail.com"
                />
                {spellIn ? (
                  <div>
                    <div className="spellout">
                      {spelled.map((s, i) => (
                        <div className="letter" key={i}>
                          <span className="c">{s.ch === " " ? "\u00A0" : s.ch}</span>
                          <span className="n">{s.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="row" style={{ marginTop: 16 }}>
                      <button className="tiny" onClick={() => speak(spelled.map((s) => s.name).join(", "))}>
                        Hear it spelt out
                      </button>
                      <button className="tiny" onClick={() => copy(spelled.map((s) => s.name).join(", "))}>
                        Copy
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="card">
                <h3>The three that trip everyone up</h3>
                <p>B and V sound almost identical, so Spanish speakers separate them by saying be de Barcelona and uve de Valencia. Do the same with your own letters and the confusion stops.</p>
                <p>H is hache and is silent in words, so nobody hears it unless you spell it. Double letters are said as doble: doble ele, doble ese.</p>
                <p>For an email, arroba is the at sign and punto is the dot. Say gmail punto com, not gmail dot com, or they will type the word.</p>
              </div>

              <div className="card">
                <h3>Reading a long number</h3>
                <p>Spanish offices read numbers in pairs, not digit by digit, and will often read yours back the same way. If that loses you, ask for it slowly: ¿Me lo puede decir número por número?</p>
              </div>
            </div>
          ) : null}

          {tab === "examples" ? (
            <div>
              <h2 className="h2">Worked examples</h2>
              <p className="sub">Three real situations, already built, so you can see the shape of a call sheet without running anything.</p>

              <div className="exrow">
                {EXAMPLES.map((e) => (
                  <button key={e.key} className={exKey === e.key ? "exbtn on" : "exbtn"} onClick={() => setExKey(e.key)}>
                    <span className="et">{e.tab}</span>
                    <span className="ed">{e.tabdesc}</span>
                  </button>
                ))}
              </div>

              {renderSheet(example.sheet)}
            </div>
          ) : null}

          {tab === "about" ? (
            <div>
              <h2 className="h2">How this works</h2>
              <p className="sub">Written plainly, because you should know what you are trusting before you say it to an official.</p>

              <div className="card">
                <h3>Where the wording comes from</h3>
                <p>The three worked examples are fixed text, written and checked by hand. Everything you build yourself is generated by Claude from what you typed into the form. It has no connection to any Spanish office and no access to your file, your account or any live system.</p>
              </div>

              <div className="card">
                <h3>What it will not do</h3>
                <p>It will not give you phone numbers, opening hours or fees, because those change constantly and a wrong one wastes your morning. Take them from the organisation's own site or from your bill.</p>
                <p>It will not tell you what the answer to your question is, only how to ask it. Immigration, tax and legal outcomes depend on facts it cannot see.</p>
                <p>It cannot book anything, and it cannot make the call for you.</p>
              </div>

              <div className="card">
                <h3>Where it can be wrong</h3>
                <p>Generated Spanish can be stiff or slightly off, and regional habits vary. Being understood matters more than being elegant here, and an official who hears a foreigner reading carefully will usually slow down to help.</p>
                <p>Procedures differ by province and by provider. Anything the script states as certain about a specific office is worth treating as a starting point rather than a fact.</p>
              </div>

              <div className="flag">
                <p className="ft">One safety rule</p>
                <p>No Spanish public office asks for card details, a transfer or a password by phone, and none of them will ring you to demand payment. If a call goes that way, hang up and dial the number printed on your own paperwork.</p>
              </div>
            </div>
          ) : null}

        </div>
      </main>
    </div>
  );
}
