// /git/GyanSetu/js/questGame.js
// Quest Game — Story-Based Adventure for GyanSetu
// Playful, error-free implementation for 6th graders

document.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("game-container");
  if (!gameContainer) return;

  // --- Achievements & Badges ---
  let achievements = [];
  function unlockAchievement(name) {
    if (!achievements.includes(name)) {
      achievements.push(name);
      showBadgeModal(name);
    }
  }
  function showBadgeModal(name) {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;
      background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:32px 48px;border-radius:32px;box-shadow:0 4px 32px #222;text-align:center;">
        <h2 style="font-family:'Fredoka One',Inter;font-size:2rem;color:#27ae60;">Achievement Unlocked!</h2>
        <div style="font-size:3rem;margin:18px 0;">🏅</div>
        <div style="font-size:1.3rem;color:#222;">${name}</div>
        <button style="margin-top:24px;padding:12px 32px;border-radius:18px;background:#27ae60;color:#fff;font-size:1.1rem;border:none;cursor:pointer;" id="closeBadgeBtn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#closeBadgeBtn").onclick = () => modal.remove();
  }

  // --- Inventory/Rewards ---
  let coins = 0;
  function addCoins(amount) {
    coins += amount;
    // Do not show inventory modal after every answer
  }
  function showInventoryModal() {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;
      background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:32px 48px;border-radius:32px;box-shadow:0 4px 32px #222;text-align:center;">
        <h2 style="font-family:'Fredoka One',Inter;font-size:2rem;color:#fdcb6e;">My Inventory</h2>
        <div style="font-size:2rem;margin:18px 0;">🪙</div>
        <div style="font-size:1.3rem;color:#222;">Coins: ${coins}</div>
        <div style="margin:18px 0;">
          <strong>Achievements:</strong>
          <div style="font-size:1.1rem;color:#27ae60;">${achievements.length ? achievements.join(", ") : "None yet!"}</div>
        </div>
        <button style="margin-top:24px;padding:12px 32px;border-radius:18px;background:#fdcb6e;color:#fff;font-size:1.1rem;border:none;cursor:pointer;" id="closeInventoryBtn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#closeInventoryBtn").onclick = () => modal.remove();
  }

  // --- Daily/Weekly Quests ---
  let dailyQuests = [
    { name: "Help Ramesh", completed: false },
    { name: "Build Irrigation", completed: false },
    { name: "Market Math", completed: false },
    { name: "Write a Letter", completed: false },
  ];
  function showQuestLog() {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;
      background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:32px 48px;border-radius:32px;box-shadow:0 4px 32px #222;text-align:center;">
        <h2 style="font-family:'Fredoka One',Inter;font-size:2rem;color:#0984e3;">Quest Log</h2>
        <ul style="list-style:none;padding:0;font-size:1.2rem;">
          ${dailyQuests.map((q) => `<li>${q.completed ? "✅" : "⬜"} ${q.name}</li>`).join("")}
        </ul>
        <button style="margin-top:24px;padding:12px 32px;border-radius:18px;background:#0984e3;color:#fff;font-size:1.1rem;border:none;cursor:pointer;" id="closeQuestLogBtn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#closeQuestLogBtn").onclick = () => modal.remove();
  }

  // --- Mini-Games: Unique for Each Quest ---
  function showMiniGameForQuest(questName, onComplete) {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;
      background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
    `;
    let pairs, title;
    if (questName === "Agricultural Scientist") {
      title = "Match Crops to Nutrients!";
      pairs = [
        { left: "Rice", right: "Nitrogen" },
        { left: "Wheat", right: "Rust" },
        { left: "Soil", right: "Trees" },
      ];
    } else if (questName === "Village Engineer") {
      title = "Match Pipes to Lengths!";
      pairs = [
        { left: "Short Pipe", right: "20m" },
        { left: "Long Pipe", right: "50m" },
        { left: "Tank", right: "250L" },
      ];
    } else if (questName === "Market Math") {
      title = "Match Items to Prices!";
      pairs = [
        { left: "Tomatoes", right: "₹15/kg" },
        { left: "Basket", right: "₹50" },
        { left: "Bananas", right: "₹20/kg" },
      ];
    } else if (questName === "Language Helper") {
      title = "Match Words to Meanings!";
      pairs = [
        { left: "Assist", right: "To help" },
        { left: "Easy", right: "Not difficult" },
        { left: "Environment", right: "Nature around us" },
      ];
    } else {
      title = "Mini-Game!";
      pairs = [
        { left: "A", right: "1" },
        { left: "B", right: "2" },
        { left: "C", right: "3" },
      ];
    }
    let matched = 0;
    modal.innerHTML = `
      <div style="background:#fff;padding:32px 48px;border-radius:32px;box-shadow:0 4px 32px #222;text-align:center;">
        <h2 style="font-family:'Fredoka One',Inter;font-size:2rem;color:#27ae60;">Mini-Game: ${title}</h2>
        <div id="matchArea" style="display:flex;gap:32px;justify-content:center;margin:24px 0;">
          <div id="leftCol" style="display:flex;flex-direction:column;gap:18px;">
            ${pairs
              .map((p, i) => {
                let bg;
                if (questName === "Agricultural Scientist") bg = "#a3e635";
                else if (questName === "Village Engineer") bg = "#60a5fa";
                else if (questName === "Market Math") bg = "#fbbf24";
                else if (questName === "Language Helper") bg = "#f472b6";
                else bg = "#e0f7fa";
                return `<div draggable="true" data-idx="${i}" style="padding:12px 24px;background:${bg};border-radius:12px;cursor:grab;font-size:1.1rem;">${p.left}</div>`;
              })
              .join("")}
          </div>
          <div id="rightCol" style="display:flex;flex-direction:column;gap:18px;">
            ${pairs
              .map((p, i) => {
                let bg;
                if (questName === "Agricultural Scientist") bg = "#bbf7d0";
                else if (questName === "Village Engineer") bg = "#bae6fd";
                else if (questName === "Market Math") bg = "#fef9c3";
                else if (questName === "Language Helper") bg = "#fce7f3";
                else bg = "#fdcb6e";
                return `<div data-idx="${i}" style="padding:12px 24px;background:${bg};border-radius:12px;min-width:100px;font-size:1.1rem;">${p.right}</div>`;
              })
              .join("")}
          </div>
        </div>
        <div id="matchFeedback" style="font-size:1.2rem;color:#27ae60;margin:18px 0;"></div>
        <button style="margin-top:24px;padding:12px 32px;border-radius:18px;background:#27ae60;color:#fff;font-size:1.1rem;border:none;cursor:pointer;display:none;" id="closeMiniGameBtn">Continue</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Drag and drop logic
    const leftCol = modal.querySelector("#leftCol");
    const rightCol = modal.querySelector("#rightCol");
    let draggedIdx = null;
    leftCol.querySelectorAll("div").forEach((el) => {
      el.ondragstart = (e) => {
        draggedIdx = el.getAttribute("data-idx");
      };
    });
    rightCol.querySelectorAll("div").forEach((el) => {
      el.ondragover = (e) => e.preventDefault();
      el.ondrop = (e) => {
        if (el.getAttribute("data-idx") === draggedIdx) {
          el.style.background = "#27ae60";
          el.textContent += " ✅";
          leftCol.querySelector(`div[data-idx="${draggedIdx}"]`).style.display =
            "none";
          matched++;
          modal.querySelector("#matchFeedback").textContent = "Matched!";
          if (matched === pairs.length) {
            modal.querySelector("#matchFeedback").textContent =
              "All matched! Well done!";
            modal.querySelector("#closeMiniGameBtn").style.display =
              "inline-block";
          }
        } else {
          modal.querySelector("#matchFeedback").textContent = "Try again!";
        }
      };
    });
    modal.querySelector("#closeMiniGameBtn").onclick = () => {
      modal.remove();
      if (onComplete) onComplete();
    };
  }

  // --- Sound Effects ---
  const sounds = {
    correct: new Audio("../assets/sfx/correct.mp3"),
    wrong: new Audio("../assets/sfx/wrong.mp3"),
    win: new Audio("../assets/sfx/win.mp3"),
    achievement: new Audio("../assets/sfx/achievement.mp3"),
  };

  // --- Quest Assets ---
  const questAssets = {
    "Agricultural Scientist": {
      bg: "../assets/img/bg-agriculture.png",
      avatar: "../assets/img/avatar-scientist.png",
      avatarName: "Dr. Ananya",
      color: "#00b894",
      description:
        "Discover the amazing world of plants and learn how they live and grow.",
    },
    "Village Engineer": {
      bg: "../assets/img/bg-engineer.png",
      avatar: "../assets/img/avatar-engineer.png",
      avatarName: "Arjun",
      color: "#0984e3",
      description:
        "Help farmers measure their fields and plan crop layouts using geometry.",
    },
    "Market Math": {
      bg: "../assets/img/bg-market.png",
      avatar: "../assets/img/avatar-shopkeeper.png",
      avatarName: "Priya",
      color: "#fdcb6e",
      description:
        "Help Shopkeeper Uncle solve daily math problems at the village market.",
    },
    "Language Helper": {
      bg: "../assets/img/bg-language.png",
      avatar: "../assets/img/avatar-teacher.png",
      avatarName: "Ravi",
      color: "#a55eea",
      description:
        "Follow water's amazing journey from lakes to clouds to rain!",
    },
  };

  // --- Story-based Question Sets ---
  const questionSets = {
    "Agricultural Scientist": [
      {
        question:
          "A farmer’s rice crop is turning yellow. Which nutrient deficiency could be the cause?",
        choices: ["Nitrogen", "Iron", "Calcium", "Potassium"],
        answer: 0,
        hint: "This nutrient is needed for green leaves.",
      },
      {
        question: "Which method is best to prevent soil erosion?",
        choices: [
          "Planting trees",
          "Burning crops",
          "Using pesticides",
          "Flooding fields",
        ],
        answer: 0,
        hint: "Roots hold the soil together.",
      },
      {
        question: "Sita's wheat has rust-colored spots. What disease is this?",
        choices: ["Rust", "Blight", "Wilt", "Mosaic"],
        answer: 0,
        hint: "Its name is the same as the color it causes.",
      },
      {
        question: "Which insect helps pollinate crops?",
        choices: ["Butterfly", "Mosquito", "Cockroach", "Ant"],
        answer: 0,
        hint: "It visits flowers for nectar.",
      },
      {
        question: "What gas do plants absorb during photosynthesis?",
        choices: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        answer: 1,
        hint: "It is exhaled by animals.",
      },
    ],
    "Village Engineer": [
      {
        question: "If a field is 50m long and 20m wide, what is its area?",
        choices: ["1000 sq m", "70 sq m", "500 sq m", "1200 sq m"],
        answer: 0,
        hint: "Area = length × width.",
      },
      {
        question:
          "Water flows through a pipe at 2 liters per minute. How much water flows in 30 minutes?",
        choices: ["60L", "30L", "90L", "120L"],
        answer: 0,
        hint: "Multiply flow rate by time.",
      },
      {
        question: "What is the perimeter of a rectangular field 40m by 30m?",
        choices: ["140m", "70m", "120m", "100m"],
        answer: 0,
        hint: "Perimeter = 2 × (length + width).",
      },
      {
        question: "Which tool is used to measure angles in construction?",
        choices: ["Protractor", "Ruler", "Compass", "Scale"],
        answer: 0,
        hint: "It is a semicircular instrument.",
      },
      {
        question:
          "A water tank holds 250 liters. If 50 liters are used, how much is left?",
        choices: ["200L", "250L", "150L", "100L"],
        answer: 0,
        hint: "Subtract used from total.",
      },
    ],
    "Market Math": [
      {
        question:
          "A farmer sells 12 kg of tomatoes at ₹15 per kg. How much does he earn?",
        choices: ["₹180", "₹120", "₹150", "₹90"],
        answer: 0,
        hint: "Multiply quantity by price per kg.",
      },
      {
        question:
          "A shopkeeper gives a discount of ₹10 on a ₹60 item. What is the final price?",
        choices: ["₹50", "₹60", "₹40", "₹70"],
        answer: 0,
        hint: "Subtract discount from original price.",
      },
      {
        question:
          "If a basket costs ₹50 and a farmer buys 4 baskets, what is the total cost?",
        choices: ["₹200", "₹100", "₹150", "₹250"],
        answer: 0,
        hint: "Multiply cost by number of baskets.",
      },
      {
        question: "If a farmer earns ₹500 and spends ₹350, what is his profit?",
        choices: ["₹150", "₹350", "₹500", "₹200"],
        answer: 0,
        hint: "Profit = earnings - expenses.",
      },
      {
        question:
          "A customer buys 3 kg of apples at ₹30 per kg and 2 kg of bananas at ₹20 per kg. What is the total cost?",
        choices: ["₹130", "₹110", "₹120", "₹100"],
        answer: 0,
        hint: "Add cost of apples and bananas.",
      },
    ],
    "Language Helper": [
      {
        question: "What is the plural of ‘child’?",
        choices: ["Childs", "Children", "Childes", "Childrens"],
        answer: 1,
        hint: "Irregular plural form.",
      },
      {
        question: "Which word means ‘to help’?",
        choices: ["Ignore", "Assist", "Harm", "Delay"],
        answer: 1,
        hint: "It is a synonym for support.",
      },
      {
        question: "Choose the correct spelling: Environment.",
        choices: ["Enviroment", "Environment", "Environmant", "Enviromentt"],
        answer: 1,
        hint: "It refers to nature around us.",
      },
      {
        question: "What is the opposite of ‘difficult’?",
        choices: ["Easy", "Hard", "Tough", "Strong"],
        answer: 0,
        hint: "It means simple.",
      },
      {
        question: "Fill in the blank: The sun ____ in the east.",
        choices: ["rises", "raise", "rose", "rising"],
        answer: 0,
        hint: "Present tense verb.",
      },
    ],
  };

  // --- Playful Quest Selection UI ---
  function showQuestSelection() {
    gameContainer.innerHTML = "";
    // Ensure #game-container is relative so absolute mute button works
    gameContainer.style.position = "relative";

    // Add mute/unmute button to bottom left corner inside quest game window
    const muteBtn = document.createElement("button");
    muteBtn.id = "quest-mute-btn";
    muteBtn.setAttribute("aria-label", "Mute/Unmute Music");
    muteBtn.style.cssText = `
      position: fixed;
      left: 32px;
      bottom: 32px;
      z-index: 2000;
      background: #222;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 56px;
      height: 56px;
      font-size: 2rem;
      box-shadow: 0 4px 16px #111;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    let muted = false;
    muteBtn.onclick = () => {
      muted = !muted;
      muteBtn.innerHTML = muted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
      // Mute/unmute all audio elements in the quest game window
      document.querySelectorAll("audio").forEach((audio) => {
        audio.muted = muted;
      });
    };
    gameContainer.appendChild(muteBtn);

    // Add dark blurred overlay for quest selection
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1000;
      background: linear-gradient(180deg, #16002a 0%, #2b0042 60%);
    `;
    gameContainer.appendChild(overlay);

    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-height:600px;position:relative;z-index:1001;gap:32px;";

    // Add headline for the page
    const headline = document.createElement("h2");
    headline.textContent = "Quest Games";
    headline.style.cssText =
      "font-family:'Fredoka One',Inter;font-size:2.6rem;color:#fff;margin-bottom:18px;letter-spacing:1px;text-shadow:0 2px 12px #222;";
    wrapper.appendChild(headline);

    const cardsRow = document.createElement("div");
    cardsRow.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 48px;
      width: 100%;
      margin-bottom: 32px;
    `;

    Object.keys(questAssets).forEach((quest) => {
      const card = document.createElement("div");
      card.style.cssText = `
        width: 360px;
        min-height: 400px;
        border-radius: 32px;
        background: rgba(255,255,255,0.10);
        backdrop-filter: blur(8px);
        box-shadow: 0 12px 40px rgba(44, 20, 80, 0.35);
        border: 2.5px solid #ffd86b;
        padding: 40px 28px 32px 28px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: transform 0.18s, box-shadow 0.18s;
        position: relative;
        overflow: hidden;
      `;
      card.onmouseover = () => {
        card.style.transform = "scale(1.05)";
        card.style.boxShadow = "0 16px 48px #ffd86b";
      };
      card.onmouseout = () => {
        card.style.transform = "scale(1)";
        card.style.boxShadow = "0 12px 40px rgba(44, 20, 80, 0.35)";
      };
      card.onclick = () => startQuest(quest);

      // Avatar
      const avatar = document.createElement("img");
      avatar.src = questAssets[quest].avatar;
      avatar.alt = questAssets[quest].avatarName;
      avatar.style.cssText = `
        width: 128px;
        height: 128px;
        border-radius: 50%;
        margin-bottom: 22px;
        box-shadow: 0 4px 24px #ffd86b;
        object-fit: cover;
        border: 5px solid #ffd86b;
        background: #fff;
        transition: box-shadow 0.2s;
      `;
      avatar.onmouseover = () => {
        avatar.style.boxShadow = "0 8px 32px #ffd86b";
      };
      avatar.onmouseout = () => {
        avatar.style.boxShadow = "0 4px 24px #ffd86b";
      };

      // Title
      const title = document.createElement("div");
      title.textContent = questAssets[quest].title;
      title.style.cssText = `
        font-family: 'Fredoka One', Inter, system-ui;
        font-size: 1.6rem;
        color: ${questAssets[quest].color};
        margin-bottom: 12px;
        font-weight: 700;
        text-align: center;
        letter-spacing: 1.5px;
        text-shadow: 0 2px 8px #222;
        border-bottom: 2px solid ${questAssets[quest].color};
        padding-bottom: 6px;
        width: 85%;
      `;

      // Description
      const desc = document.createElement("div");
      desc.textContent = questAssets[quest].avatarName + " needs your help!";
      desc.style.cssText = `
        font-size: 1.1rem;
        color: #ffd86b;
        margin-bottom: 10px;
        text-align: center;
        font-family: 'Fredoka One', Inter, system-ui;
        font-weight: 600;
        letter-spacing: 1px;
      `;

      // Quest Description
      const questDesc = document.createElement("div");
      questDesc.textContent = questAssets[quest].description || "";
      questDesc.style.cssText = `
        font-size: 1.12rem;
        color: #fff;
        background: rgba(255, 216, 107, 0.22);
        margin-bottom: 12px;
        text-align: center;
        line-height: 1.6;
        font-weight: 500;
        padding: 14px 12px;
        border-radius: 16px;
        box-shadow: 0 2px 12px #ffd86b;
        width: 95%;
      `;

      // Play Button
      const playBtn = document.createElement("button");
      playBtn.textContent = "Play Quest";
      playBtn.style.cssText = `
        margin-top: 18px;
        padding: 14px 32px;
        font-size: 1.15rem;
        font-family: 'Fredoka One', Inter, system-ui;
        border-radius: 18px;
        background: linear-gradient(90deg, #ffd86b, #fdcb6e, #a55eea);
        color: #222;
        font-weight: 700;
        border: none;
        cursor: pointer;
        box-shadow: 0 2px 8px #ffd86b;
        transition: background 0.2s, transform 0.15s;
      `;
      playBtn.onmouseover = () => {
        playBtn.style.background =
          "linear-gradient(90deg, #fdcb6e, #ffd86b, #a55eea)";
        playBtn.style.transform = "scale(1.07)";
      };
      playBtn.onmouseout = () => {
        playBtn.style.background =
          "linear-gradient(90deg, #ffd86b, #fdcb6e, #a55eea)";
        playBtn.style.transform = "scale(1)";
      };
      playBtn.onclick = () => startQuest(quest);

      card.appendChild(avatar);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(questDesc);
      card.appendChild(playBtn);

      cardsRow.appendChild(card);
    });
    wrapper.appendChild(cardsRow);
    gameContainer.appendChild(wrapper);
  }

  // --- Playful Quest Game UI ---
  function startQuest(questName) {
    // Clear container
    gameContainer.innerHTML = "";

    // --- Branching story structure for all quests ---
    const branchingStories = {
      "Agricultural Scientist": {
        intro:
          "You are Dr. Ananya, visiting Sundarpur village. Two farmers need your help: Ramesh (rice problem) and Sita (wheat problem). Who do you want to help first?",
        choices: [
          { label: "Help Ramesh (rice)", branch: "ramesh" },
          { label: "Help Sita (wheat)", branch: "sita" },
        ],
        branches: {
          ramesh: [
            {
              context:
                "Farmer Ramesh shows you his rice crop, which is turning yellow.",
              questionIdx: 0,
            },
            {
              context: "Ramesh also has a soil erosion problem.",
              questionIdx: 2,
            },
          ],
          sita: [
            {
              context: "Sita's wheat has rust-colored spots.",
              questionIdx: 1,
            },
            {
              context: "Which insect helps pollinate Sita’s crops?",
              questionIdx: 3,
            },
          ],
        },
        merge: [
          {
            context:
              "Both farmers want to know: What gas do plants absorb during photosynthesis?",
            questionIdx: 4,
          },
        ],
      },
      "Village Engineer": {
        intro:
          "You are Arjun, the village engineer. The villagers need your help to build a new irrigation system. Which field do you want to measure first?",
        choices: [
          { label: "Measure the big field (50m x 20m)", branch: "big" },
          { label: "Measure the small field (40m x 30m)", branch: "small" },
        ],
        branches: {
          big: [
            {
              context: "The big field is 50m long and 20m wide.",
              questionIdx: 0,
            },
            {
              context: "Water flows at 2 liters per minute.",
              questionIdx: 1,
            },
          ],
          small: [
            { context: "The small field is 40m by 30m.", questionIdx: 2 },
            {
              context: "Which tool measures angles in construction?",
              questionIdx: 3,
            },
          ],
        },
        merge: [
          {
            context: "The tank holds 250L, 50L used. How much is left?",
            questionIdx: 4,
          },
        ],
      },
      "Market Math": {
        intro:
          "You are Priya, helping villagers at the market. Who do you want to help first?",
        choices: [
          { label: "Help the tomato seller", branch: "tomato" },
          { label: "Help the basket seller", branch: "basket" },
        ],
        branches: {
          tomato: [
            { context: "12kg tomatoes at ₹15/kg.", questionIdx: 0 },
            { context: "Discount of ₹10 on ₹60 item.", questionIdx: 2 },
          ],
          basket: [
            { context: "Basket costs ₹50, farmer buys 4.", questionIdx: 1 },
            { context: "Farmer earns ₹500, spends ₹350.", questionIdx: 3 },
          ],
        },
        merge: [
          {
            context: "3kg apples at ₹30/kg, 2kg bananas at ₹20/kg.",
            questionIdx: 4,
          },
        ],
      },
      "Language Helper": {
        intro:
          "You are Ravi, helping villagers write letters and read signs. Which task do you want to do first?",
        choices: [
          { label: "Write a letter", branch: "letter" },
          { label: "Read a sign", branch: "sign" },
        ],
        branches: {
          letter: [
            { context: "What is the plural of ‘child’?", questionIdx: 0 },
            { context: "Which word means ‘to help’?", questionIdx: 1 },
          ],
          sign: [
            {
              context: "Choose the correct spelling: Environment.",
              questionIdx: 2,
            },
            { context: "Opposite of ‘difficult’?", questionIdx: 3 },
          ],
        },
        merge: [
          {
            context: "Fill in the blank: The sun ____ in the east.",
            questionIdx: 4,
          },
        ],
      },
    };

    // State
    const questions = questionSets[questName];
    let current = 0;
    let score = 0;
    let stars = 0;
    let completed = false;

    // --- Preload images ---
    const bgImg = questAssets[questName].bg;
    const avatarImg = questAssets[questName].avatar;
    const avatarName = questAssets[questName].avatarName;
    const questColor = questAssets[questName].color;
    const starImg = "../assets/img/star.png";

    // --- Main Render Function ---
    function render() {
      gameContainer.innerHTML = "";

      // Black semi-transparent overlay background
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-2;
        background: rgba(0,0,0,0.55);
      `;
      gameContainer.appendChild(overlay);

      // Main background image
      const bg = document.createElement("div");
      bg.style.cssText = `
        position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;
        background: url('${bgImg}') center center/cover no-repeat;
        opacity:0.18;
      `;
      gameContainer.appendChild(bg);

      // Main layout
      const layout = document.createElement("div");
      layout.style.cssText =
        "display:flex;flex-direction:row;align-items:flex-end;justify-content:center;min-height:600px;gap:0;background:transparent;";

      // Avatar (bigger)
      const avatar = document.createElement("img");
      avatar.src = avatarImg;
      avatar.alt = avatarName;
      avatar.style.cssText =
        "width:220px;height:270px;border-radius:32px;box-shadow:0 4px 24px #222;margin-bottom:32px;margin-right:0;";

      // Dialog bubble with white background and black shadow
      const bubble = document.createElement("div");
      bubble.style.cssText = `
        background: #fff;
        border-radius: 32px;
        box-shadow: 0 4px 24px #000;
        padding: 32px 32px;
        max-width: 520px;
        min-width: 320px;
        min-height: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        margin-bottom: 32px;
        font-family: Inter;
        border: 2px solid #222;
      `;

      // Progress bar with animated stars
      const progressBar = document.createElement("div");
      progressBar.style.cssText =
        "display:flex;gap:8px;justify-content:center;margin-bottom:12px;";
      for (let i = 0; i < questions.length; i++) {
        const star = document.createElement("img");
        star.src = starImg;
        star.alt = "star";
        star.style.cssText = `width:28px;height:28px;filter:drop-shadow(0 2px 4px #fdcb6e);opacity:${i < stars ? 1 : 0.3};transition:opacity 0.2s;`;
        if (i < stars) {
          star.animate(
            [
              { transform: "scale(1.2)", opacity: 0.5 },
              { transform: "scale(1)", opacity: 1 },
            ],
            {
              duration: 400,
              easing: "ease-out",
            },
          );
        }
        progressBar.appendChild(star);
      }
      bubble.appendChild(progressBar);

      // Dialog text
      const dialog = document.createElement("div");
      dialog.style.cssText =
        "font-size:1.2rem;color:#222;text-align:center;margin-bottom:18px;line-height:1.5;";

      // --- Branching story structure for all quests ---
      const branchingStories = {
        "Agricultural Scientist": {
          intro:
            "You are Dr. Ananya, visiting Sundarpur village. Two farmers need your help: Ramesh (rice problem) and Sita (wheat problem). Who do you want to help first?",
          choices: [
            { label: "Help Ramesh (rice)", branch: "ramesh" },
            { label: "Help Sita (wheat)", branch: "sita" },
          ],
          branches: {
            ramesh: [
              {
                context:
                  "Farmer Ramesh shows you his rice crop, which is turning yellow.",
                questionIdx: 0,
              },
              {
                context: "Ramesh also has a soil erosion problem.",
                questionIdx: 2,
              },
            ],
            sita: [
              {
                context: "Sita's wheat has rust-colored spots.",
                questionIdx: 1,
              },
              {
                context: "Which insect helps pollinate Sita’s crops?",
                questionIdx: 3,
              },
            ],
          },
          merge: [
            {
              context:
                "Both farmers want to know: What gas do plants absorb during photosynthesis?",
              questionIdx: 4,
            },
          ],
        },
        "Village Engineer": {
          intro:
            "You are Arjun, the village engineer. The villagers need your help to build a new irrigation system. Which field do you want to measure first?",
          choices: [
            { label: "Measure the big field (50m x 20m)", branch: "big" },
            { label: "Measure the small field (40m x 30m)", branch: "small" },
          ],
          branches: {
            big: [
              {
                context: "The big field is 50m long and 20m wide.",
                questionIdx: 0,
              },
              {
                context: "Water flows at 2 liters per minute.",
                questionIdx: 1,
              },
            ],
            small: [
              { context: "The small field is 40m by 30m.", questionIdx: 2 },
              {
                context: "Which tool measures angles in construction?",
                questionIdx: 3,
              },
            ],
          },
          merge: [
            {
              context: "The tank holds 250L, 50L used. How much is left?",
              questionIdx: 4,
            },
          ],
        },
        "Market Math": {
          intro:
            "You are Priya, helping villagers at the market. Who do you want to help first?",
          choices: [
            { label: "Help the tomato seller", branch: "tomato" },
            { label: "Help the basket seller", branch: "basket" },
          ],
          branches: {
            tomato: [
              { context: "12kg tomatoes at ₹15/kg.", questionIdx: 0 },
              { context: "Discount of ₹10 on ₹60 item.", questionIdx: 2 },
            ],
            basket: [
              { context: "Basket costs ₹50, farmer buys 4.", questionIdx: 1 },
              { context: "Farmer earns ₹500, spends ₹350.", questionIdx: 3 },
            ],
          },
          merge: [
            {
              context: "3kg apples at ₹30/kg, 2kg bananas at ₹20/kg.",
              questionIdx: 4,
            },
          ],
        },
        "Language Helper": {
          intro:
            "You are Ravi, helping villagers write letters and read signs. Which task do you want to do first?",
          choices: [
            { label: "Write a letter", branch: "letter" },
            { label: "Read a sign", branch: "sign" },
          ],
          branches: {
            letter: [
              { context: "What is the plural of ‘child’?", questionIdx: 0 },
              { context: "Which word means ‘to help’?", questionIdx: 1 },
            ],
            sign: [
              {
                context: "Choose the correct spelling: Environment.",
                questionIdx: 2,
              },
              { context: "Opposite of ‘difficult’?", questionIdx: 3 },
            ],
          },
          merge: [
            {
              context: "Fill in the blank: The sun ____ in the east.",
              questionIdx: 4,
            },
          ],
        },
      };

      // Feedback scripts remain unchanged
      const feedbackScripts = {
        "Agricultural Scientist": [
          "",
          "Great! Ramesh will add nitrogen fertilizer.",
          "Exactly! Let’s treat rust disease together.",
          "Well done! Planting trees will protect the soil.",
          "Butterflies are important for pollination!",
          "Correct! Plants need carbon dioxide.",
        ],
        "Village Engineer": [
          "",
          "Perfect! Now we know how much pipe we need.",
          "Good calculation! Let’s set up the water tank.",
          "Great! We’ll fence the field with 140 meters of wire.",
          "A protractor will help us build straight walls.",
          "200 liters left! Enough for the next crop.",
        ],
        "Market Math": [
          "",
          "₹180! The farmer is happy with the sale.",
          "₹200! The farmer can carry all his vegetables.",
          "₹50! The customer is pleased.",
          "₹150 profit! Good business.",
          "₹130! The shopper gets fresh fruits.",
        ],
        "Language Helper": [
          "",
          "Children! Now the letter is correct.",
          "Assist! The villagers appreciate your kindness.",
          "Well done! The sign will be clear.",
          "Easy! The villagers understand your explanation.",
          "Rises! The poem is complete.",
        ],
      };

      // --- Branching story logic ---
      if (!completed) {
        // Initial decision point
        if (current === 0 && !window.branchChoice) {
          dialog.textContent =
            questAssets[questName].avatarName +
            " says: " +
            branchingStories[questName].intro;

          // Show branching choices
          const choiceGroup = document.createElement("div");
          choiceGroup.style.cssText =
            "display:flex;flex-direction:column;gap:18px;margin-top:18px;";
          branchingStories[questName].choices.forEach((choiceObj) => {
            const btn = document.createElement("button");
            btn.textContent = choiceObj.label;
            btn.className = "quest-btn";
            btn.style.cssText = `
              font-family:Inter;font-size:1.3rem;padding:22px 0;border-radius:24px;border:none;background:${questColor};color:#fff;box-shadow:0 2px 8px #b2bec3;cursor:pointer;transition:transform 0.15s;width:340px;max-width:90vw;
            `;
            btn.onclick = () => {
              window.branchChoice = choiceObj.branch;
              window.branchProgress = 0;
              render();
            };
            choiceGroup.appendChild(btn);
          });
          bubble.appendChild(choiceGroup);
        }
        // Branch questions
        else if (
          window.branchChoice &&
          window.branchProgress <
            branchingStories[questName].branches[window.branchChoice].length
        ) {
          const branchStep =
            branchingStories[questName].branches[window.branchChoice][
              window.branchProgress
            ];
          dialog.textContent =
            branchStep.context +
            "\n\n" +
            questAssets[questName].avatarName +
            " asks: " +
            questions[branchStep.questionIdx].question;
        }
        // Merge questions after branch
        else if (
          window.branchChoice &&
          window.branchProgress >=
            branchingStories[questName].branches[window.branchChoice].length &&
          window.mergeProgress < branchingStories[questName].merge.length
        ) {
          const mergeStep =
            branchingStories[questName].merge[window.mergeProgress];
          dialog.textContent =
            mergeStep.context +
            "\n\n" +
            questAssets[questName].avatarName +
            " asks: " +
            questions[mergeStep.questionIdx].question;
        }
        // Completion
        else {
          completed = true;
          let completionMsg = "";
          if (questName === "Agricultural Scientist") {
            completionMsg =
              "You’ve helped Sundarpur’s farmers save their crops. The village celebrates your knowledge!";
          } else if (questName === "Village Engineer") {
            completionMsg =
              "You’ve helped design Sundarpur’s irrigation system. The villagers thank you for your engineering skills!";
          } else if (questName === "Market Math") {
            completionMsg =
              "You’ve helped villagers succeed at the market. Priya thanks you for your math skills!";
          } else if (questName === "Language Helper") {
            completionMsg =
              "You’ve helped villagers communicate better. Ravi thanks you for your language skills!";
          } else {
            completionMsg = `🎉 Well done! You completed the quest with ${score} points!`;
          }
          dialog.textContent = `🎉 ${completionMsg}\n\nCoins earned: ${coins}`;
          // Show inventory modal at quest completion
          showInventoryModal();
        }
        bubble.appendChild(dialog);
      } else {
        let completionMsg = "";
        if (questName === "Agricultural Scientist") {
          completionMsg =
            "You’ve helped Sundarpur’s farmers save their crops. The village celebrates your knowledge!";
        } else if (questName === "Village Engineer") {
          completionMsg =
            "You’ve helped design Sundarpur’s irrigation system. The villagers thank you for your engineering skills!";
        } else if (questName === "Market Math") {
          completionMsg =
            "You’ve helped villagers succeed at the market. Priya thanks you for your math skills!";
        } else if (questName === "Language Helper") {
          completionMsg =
            "You’ve helped villagers communicate better. Ravi thanks you for your language skills!";
        } else {
          completionMsg = `🎉 Well done! You completed the quest with ${score} points!`;
        }
        dialog.textContent = `🎉 ${completionMsg}`;
      }
      bubble.appendChild(dialog);

      // Answer buttons
      // Show answer buttons for branch/merge questions
      if (
        !completed &&
        ((window.branchChoice &&
          window.branchProgress <
            branchingStories[questName].branches[window.branchChoice].length) ||
          (window.branchChoice &&
            window.branchProgress >=
              branchingStories[questName].branches[window.branchChoice]
                .length &&
            window.mergeProgress < branchingStories[questName].merge.length))
      ) {
        let qObj;
        if (
          window.branchChoice &&
          window.branchProgress <
            branchingStories[questName].branches[window.branchChoice].length
        ) {
          const branchStep =
            branchingStories[questName].branches[window.branchChoice][
              window.branchProgress
            ];
          qObj = questions[branchStep.questionIdx];
        } else {
          const mergeStep =
            branchingStories[questName].merge[window.mergeProgress];
          qObj = questions[mergeStep.questionIdx];
        }
        const choices = qObj.choices;
        const btnGroup = document.createElement("div");
        btnGroup.style.cssText =
          "display:flex;flex-direction:column;gap:18px;margin-top:8px;";

        choices.forEach((choice, idx) => {
          const btn = document.createElement("button");
          btn.textContent = choice;
          btn.className = "quest-btn";
          btn.style.cssText = `
            font-family:Inter;font-size:1.3rem;padding:22px 0;border-radius:24px;border:none;background:${questColor};color:#fff;box-shadow:0 2px 8px #b2bec3;cursor:pointer;transition:transform 0.15s;width:340px;max-width:90vw;
          `;
          btn.onmouseover = () => (btn.style.transform = "scale(1.05)");
          btn.onmouseout = () => (btn.style.transform = "scale(1)");
          btn.onclick = () => handleBranchAnswer(idx);
          btnGroup.appendChild(btn);
        });
        bubble.appendChild(btnGroup);

        // Hint button
        const hintBtn = document.createElement("button");
        hintBtn.textContent = "Hint";
        hintBtn.style.cssText = `
          margin-top:12px;font-family:Inter;font-size:1rem;padding:8px 24px;border-radius:12px;border:none;background:#fdcb6e;color:#fff;box-shadow:0 2px 8px #b2bec3;cursor:pointer;
        `;
        hintBtn.onclick = () => {
          showHint(qObj.hint);
        };
        bubble.appendChild(hintBtn);
      }

      // Next button for story intro or after completion
      // Only show "Start Quest" button if no branch choice is required
      if ((current === 0 && !completed && !window.branchChoice) || completed) {
        // If branching is required, do not show the button
        if (completed) {
          const nextBtn = document.createElement("button");
          nextBtn.textContent = "Back to Quests";
          nextBtn.style.cssText = `
            margin-top:18px;font-family:Inter;font-size:1.1rem;padding:12px 32px;border-radius:18px;border:none;background:${questColor};color:#fff;box-shadow:0 2px 8px #b2bec3;cursor:pointer;
          `;
          nextBtn.onclick = () => {
            showQuestSelection();
          };
          bubble.appendChild(nextBtn);
        }
      }

      // Add avatar and bubble to layout
      layout.appendChild(avatar);
      layout.appendChild(bubble);
      gameContainer.appendChild(layout);
    }

    // --- Handle Answer Selection ---
    // Branching answer handler
    function handleBranchAnswer(idx) {
      let qObj;
      let isBranch = false;
      if (
        window.branchChoice &&
        window.branchProgress <
          branchingStories[questName].branches[window.branchChoice].length
      ) {
        const branchStep =
          branchingStories[questName].branches[window.branchChoice][
            window.branchProgress
          ];
        qObj = questions[branchStep.questionIdx];
        isBranch = true;
      } else {
        const mergeStep =
          branchingStories[questName].merge[window.mergeProgress];
        qObj = questions[mergeStep.questionIdx];
      }
      const isCorrect = idx === qObj.answer;
      if (isCorrect) {
        score += 10;
        stars += 1;
        if (sounds.correct) sounds.correct.play();
        showFeedback("Great job! ⭐");
      } else {
        if (sounds.wrong) sounds.wrong.play();
        showFeedback("Try again! 😅");
      }
      setTimeout(() => {
        // Mini-game after first branch question
        if (isBranch && window.branchProgress === 0) {
          showMiniGameForQuest(questName, () => {
            window.branchProgress = (window.branchProgress || 0) + 1;
            render();
          });
        } else {
          if (isBranch) {
            window.branchProgress = (window.branchProgress || 0) + 1;
          } else {
            window.mergeProgress = (window.mergeProgress || 0) + 1;
          }
          render();
        }
      }, 1200);

      // Achievements & Inventory
      if (isCorrect) {
        addCoins(5);
        if (score === 50) unlockAchievement("Perfect Score!");
        if (stars === 5) unlockAchievement("All Stars!");
      }
    }

    // --- Show Feedback and Move to Next Question ---
    function showFeedback(msg) {
      // Show feedback in dialog bubble, then move to next question
      const bubble = gameContainer.querySelector(
        "div[style*='border-radius:32px']",
      );
      if (bubble) {
        const dialog = bubble.querySelector("div");
        if (dialog) {
          // Show story-based feedback
          let feedbackMsg = "";
          if (
            feedbackScripts[questName] &&
            feedbackScripts[questName][current]
          ) {
            feedbackMsg = feedbackScripts[questName][current];
          }
          dialog.textContent = feedbackMsg ? feedbackMsg : msg;
          dialog.style.color = "#27ae60";
        }
      }
      setTimeout(() => {
        current++;
        if (current >= questions.length + 1) {
          completed = true;
          if (sounds.win) sounds.win.play();
          // Confetti animation on quest completion
          setTimeout(() => {
            showConfetti();
          }, 400);
        }
        render();
      }, 1200);
    }

    // --- Show Hint ---
    function showHint(hint) {
      const bubble = gameContainer.querySelector(
        "div[style*='border-radius:32px']",
      );
      if (bubble) {
        let hintBox = bubble.querySelector(".hint-box");
        if (!hintBox) {
          hintBox = document.createElement("div");
          hintBox.className = "hint-box";
          hintBox.style.cssText =
            "margin-top:10px;font-size:1rem;color:#0984e3;background:#e0f7fa;padding:8px 16px;border-radius:12px;";
          bubble.appendChild(hintBox);
        }
        hintBox.textContent = "Hint: " + hint;
      }
    }

    // --- Confetti Animation ---
    function showConfetti() {
      // Simple confetti using emoji
      const confettiContainer = document.createElement("div");
      confettiContainer.style.cssText =
        "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
      for (let i = 0; i < 40; i++) {
        const conf = document.createElement("div");
        conf.textContent = ["🎉", "✨", "🥳", "🌟"][
          Math.floor(Math.random() * 4)
        ];
        conf.style.cssText = `
          position:absolute;
          left:${Math.random() * 100}vw;
          top:${Math.random() * 100}vh;
          font-size:${Math.random() * 32 + 24}px;
          opacity:${Math.random() * 0.7 + 0.3};
          transition:top 2.2s cubic-bezier(.17,.67,.83,.67);
        `;
        confettiContainer.appendChild(conf);
        setTimeout(() => {
          conf.style.top = "110vh";
        }, 100);
      }
      document.body.appendChild(confettiContainer);
      setTimeout(() => {
        confettiContainer.remove();
      }, 2200);
    }

    // --- Initial Render ---
    // Reset branching state
    window.branchChoice = undefined;
    window.branchProgress = 0;
    window.mergeProgress = 0;

    // Add inventory and quest log buttons
    if (!document.getElementById("inventoryBtn")) {
      const inventoryBtn = document.createElement("button");
      inventoryBtn.id = "inventoryBtn";
      inventoryBtn.innerHTML = "Inventory";
      inventoryBtn.style.cssText =
        "position:fixed;bottom:32px;right:32px;z-index:1200;padding:12px 24px;border-radius:16px;background:#fdcb6e;color:#fff;font-size:1.1rem;border:none;box-shadow:0 2px 8px #b2bec3;cursor:pointer;";
      inventoryBtn.onclick = showInventoryModal;
      document.body.appendChild(inventoryBtn);
    }
    if (!document.getElementById("questLogBtn")) {
      const questLogBtn = document.createElement("button");
      questLogBtn.id = "questLogBtn";
      questLogBtn.innerHTML = "Quest Log";
      questLogBtn.style.cssText =
        "position:fixed;bottom:32px;right:180px;z-index:1200;padding:12px 24px;border-radius:16px;background:#0984e3;color:#fff;font-size:1.1rem;border:none;box-shadow:0 2px 8px #b2bec3;cursor:pointer;";
      questLogBtn.onclick = showQuestLog;
      document.body.appendChild(questLogBtn);
    }

    render();
  }
  // --- Start with Quest Selection ---
  showQuestSelection();
});
