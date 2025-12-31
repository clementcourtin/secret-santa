const groupsDiv = document.getElementById("groups");
const participantDiv = document.getElementById("participants");
const participantListDiv = document.getElementById("participantList");

document.getElementById("addGroup").addEventListener("click", addGroup);
document.getElementById("draw").addEventListener("click", draw);

let tirage = {};
let nameMap = {};

// Normalisation : minuscules + suppression accents + trim
function normalize(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Ajouter un groupe
function addGroup() {
  const div = document.createElement("div");
  div.className = "group";

  div.innerHTML = `
    <input type="text" placeholder="Papa (Maman), Maman">
  `;

  // bouton supprimer
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Supprimer le groupe";
  deleteBtn.className = "deleteGroupBtn";
  deleteBtn.addEventListener("click", () => {
    div.remove(); // supprime le groupe
  });

  div.appendChild(deleteBtn);
  groupsDiv.appendChild(div);
}


// Lancer le tirage
function draw() {
  const groupes = [];
  const previousDraw = {};
  nameMap = {};

  document.querySelectorAll(".group input").forEach(input => {
    const entries = input.value.split(/\s*,\s*/).filter(e => e !== "");
    const group = [];
    entries.forEach(entry => {
      const match = entry.match(/^(.+?)(?:\s*\((.+)\))?$/);
      if (!match) return;

      const originalName = match[1].trim();
      const prevOriginal = match[2]?.trim();

      const normName = normalize(originalName);
      group.push(originalName);
      nameMap[normName] = originalName;

      if (prevOriginal) previousDraw[normName] = normalize(prevOriginal);
    });

    if (group.length > 0) groupes.push(group);
  });

  try {
    tirage = secretSanta(groupes, previousDraw, nameMap);
    startSecretMode(Object.values(nameMap));
  } catch (e) {
    alert(e.message);
  }
}

// Secret Santa algorithm
function secretSanta(groupes, previousDraw, nameMap) {
  const participants = [...new Set(groupes.flat())];
  if (participants.length < 2) throw new Error("Il faut au moins 2 participants");

  const normParticipants = participants.map(p => normalize(p));

  const interdits = {};
  groupes.forEach(groupe => {
    groupe.forEach(p => {
      const normP = normalize(p);
      interdits[normP] = new Set(groupe.filter(x => x !== p).map(x => normalize(x)));
    });
  });

  for (let essais = 0; essais < 10000; essais++) {
    const shuffledNorm = [...normParticipants].sort(() => Math.random() - 0.5);
    let valide = true;

    for (let i = 0; i < normParticipants.length; i++) {
      const d = normParticipants[i];
      const r = shuffledNorm[i];
      if (d === r) { valide = false; break; }
      if (interdits[d]?.has(r)) { valide = false; break; }
      if (previousDraw[d] && r === previousDraw[d]) { valide = false; break; }
    }

    if (valide) {
      const res = {};
      normParticipants.forEach((normD, i) => {
        res[nameMap[normD]] = nameMap[shuffledNorm[i]];
      });
      return res;
    }
  }

  throw new Error("Aucun tirage possible avec ces contraintes");
}

// Mode “un par un” sur bouton avec flip + fondu
function startSecretMode(names) {
  // cacher les boutons "Ajouter un groupe" et "Faire le tirage"
  document.getElementById("addGroup").style.display = "none";
  document.getElementById("draw").style.display = "none";

  participantDiv.classList.remove("hidden");

  // cacher les groupes et mettre le bouton "Modifier les groupes" à leur place
  groupsDiv.style.display = "none";

  const editBtn = document.createElement("button");
  editBtn.id = "editGroupsBtn";
  editBtn.textContent = "✏️ Modifier les groupes";
  editBtn.className = "btn-primary";
  groupsDiv.parentNode.insertBefore(editBtn, participantDiv); // place au-dessus des participants

  editBtn.addEventListener("click", () => {
    groupsDiv.style.display = "block";       // montrer les groupes
    editBtn.remove();                         // supprimer le bouton
    document.getElementById("addGroup").style.display = "block"; // montrer les boutons
    document.getElementById("draw").style.display = "block";
  });

  // création des boutons participants comme avant
  participantListDiv.innerHTML = "";
  names.forEach(name => {
    const btn = document.createElement("button");
    btn.className = "participantBtn";

    const front = document.createElement("div");
    front.className = "front";
    front.textContent = name;

    const back = document.createElement("div");
    back.className = "back";
    back.textContent = "";

    btn.appendChild(front);
    btn.appendChild(back);

    btn.addEventListener("click", () => revealRecipientFlip(name, btn));

    participantListDiv.appendChild(btn);
  });
}



function revealRecipientFlip(name, btn) {
  const front = btn.querySelector(".front");
  const back = btn.querySelector(".back");

  // afficher le destinataire sur la back
  back.textContent = tirage[name];

  // flip + fondu
  btn.classList.add("flipped");

  // après 3 secondes, revenir à la face avant
  setTimeout(() => {
    btn.classList.remove("flipped");
    back.textContent = "";
  }, 3000);
}
