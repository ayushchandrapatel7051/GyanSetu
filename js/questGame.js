// /git/GyanSetu/js/questGame.js
// Quest Game — Story-Based Adventure for GyanSetu
// Playful, error-free implementation for 6th graders

document.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("game-container");
  if (!gameContainer) return;

  // --- Achievements & Badges ---
  let achievements = JSON.parse(localStorage.getItem('questAchievements') || '[]');
  function unlockAchievement(name) {
    if (!achievements.includes(name)) {
      achievements.push(name);
      localStorage.setItem('questAchievements', JSON.stringify(achievements));
      showBadgeModal(name);
    }
  }
  function showBadgeModal(name) {
    const modal = document.createElement("div");
    modal.className = "quest-modal";
    modal.innerHTML = `
      <div class="quest-modal-content">
        <h2 class="quest-modal-title">Achievement Unlocked!</h2>
        <div class="quest-modal-icon">🏅</div>
        <div class="quest-modal-text">${name}</div>
        <button class="quest-modal-btn" id="closeBadgeBtn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#closeBadgeBtn").onclick = () => modal.remove();
    modal.style.setProperty('--quest-color', '#27ae60');
  }

  // --- Inventory/Rewards ---
  let coins = 0;
  function addCoins(amount) {
    coins += amount;
    // Do not show inventory modal after every answer
  }
  function showInventoryModal() {
    const modal = document.createElement("div");
    modal.className = "quest-modal";
    modal.innerHTML = `
      <div class="quest-modal-content">
        <h2 class="quest-modal-title">My Inventory</h2>
        <div class="quest-modal-icon">🪙</div>
        <div class="quest-modal-text">Coins: ${coins}</div>
        <button class="quest-modal-btn" id="closeInventoryBtn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#closeInventoryBtn").onclick = () => modal.remove();
    modal.style.setProperty('--quest-color', '#fdcb6e');
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
    modal.className = "quest-modal";
    modal.innerHTML = `
      <div class="quest-modal-content">
        <h2 class="quest-modal-title">Quest Log</h2>
        <ul style="list-style:none;padding:0;font-size:1.2rem;text-align:left;">
          ${dailyQuests.map((q) => `<li>${q.completed ? "✅" : "⬜"} ${q.name}</li>`).join("")}
        </ul>
        <button class="quest-modal-btn" id="closeQuestLogBtn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#closeQuestLogBtn").onclick = () => modal.remove();
    modal.style.setProperty('--quest-color', '#0984e3');
  }

  // --- Mini-Games: Unique for Each Quest ---
  function showMiniGameForQuest(questName, onComplete) {
    const modal = document.createElement("div");
    modal.className = "mini-game-modal";
    let pairs, title, leftBg, rightBg;
    if (questName === "Agricultural Scientist") {
      title = "Match Crops to Nutrients!";
      pairs = [
        { left: "Rice", right: "Nitrogen" },
        { left: "Wheat", right: "Rust" },
        { left: "Soil", right: "Trees" },
      ];
      leftBg = "#a3e635";
      rightBg = "#bbf7d0";
    } else if (questName === "Village Engineer") {
      title = "Match Pipes to Lengths!";
      pairs = [
        { left: "Short Pipe", right: "20m" },
        { left: "Long Pipe", right: "50m" },
        { left: "Tank", right: "250L" },
      ];
      leftBg = "#60a5fa";
      rightBg = "#bae6fd";
    } else if (questName === "Market Math") {
      title = "Match Items to Prices!";
      pairs = [
        { left: "Tomatoes", right: "₹15/kg" },
        { left: "Basket", right: "₹50" },
        { left: "Bananas", right: "₹20/kg" },
      ];
      leftBg = "#fbbf24";
      rightBg = "#fef9c3";
    } else if (questName === "Language Helper") {
      title = "Match Words to Meanings!";
      pairs = [
        { left: "Assist", right: "To help" },
        { left: "Easy", right: "Not difficult" },
        { left: "Environment", right: "Nature around us" },
      ];
      leftBg = "#f472b6";
      rightBg = "#fce7f3";
    } else {
      title = "Mini-Game!";
      pairs = [
        { left: "A", right: "1" },
        { left: "B", right: "2" },
        { left: "C", right: "3" },
      ];
      leftBg = "#e0f7fa";
      rightBg = "#fdcb6e";
    }
    let matched = 0;
    modal.innerHTML = `
      <div class="mini-game-content">
        <h2 class="mini-game-title">Mini-Game: ${title}</h2>
        <div id="matchArea" class="mini-game-area">
          <div id="leftCol" class="mini-game-col">
            ${pairs
              .map((p, i) => `<div draggable="true" data-idx="${i}" class="mini-game-item draggable" style="--mini-bg-left: ${leftBg};">${p.left}</div>`)
              .join("")}
          </div>
          <div id="rightCol" class="mini-game-col">
            ${pairs
              .map((p, i) => `<div data-idx="${i}" class="mini-game-item target" style="--mini-bg-right: ${rightBg};">${p.right}</div>`)
              .join("")}
          </div>
        </div>
        <div id="matchFeedback" class="mini-game-feedback"></div>
        <button class="mini-game-continue" id="closeMiniGameBtn">Continue</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Drag and drop logic
    const leftCol = modal.querySelector("#leftCol");
    const rightCol = modal.querySelector("#rightCol");
    let draggedIdx = null;
    leftCol.querySelectorAll(".mini-game-item").forEach((el) => {
      el.ondragstart = (e) => {
        draggedIdx = el.getAttribute("data-idx");
      };
    });
    rightCol.querySelectorAll(".mini-game-item").forEach((el) => {
      el.ondragover = (e) => e.preventDefault();
      el.ondrop = (e) => {
        if (el.getAttribute("data-idx") === draggedIdx) {
          el.style.background = "#27ae60";
          el.innerHTML += " ✅";
          leftCol.querySelector(`[data-idx="${draggedIdx}"]`).style.display = "none";
          matched++;
          modal.querySelector("#matchFeedback").textContent = "Matched!";
          if (matched === pairs.length) {
            modal.querySelector("#matchFeedback").textContent = "All matched! Well done!";
            modal.querySelector("#closeMiniGameBtn").style.display = "inline-block";
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
      {
        question: "What is the main function of roots in plants?",
        choices: ["Absorb water and nutrients", "Make food", "Protect from sun", "Store seeds"],
        answer: 0,
        hint: "They take water from the soil.",
      },
      {
        question: "Which process do plants use to make their own food?",
        choices: ["Respiration", "Photosynthesis", "Digestion", "Transpiration"],
        answer: 1,
        hint: "It uses sunlight and happens in leaves.",
      },
      {
        question: "What is manure used for in farming?",
        choices: ["Chemical spray", "Organic fertilizer", "Harvesting tool", "Water pump"],
        answer: 1,
        hint: "It is made from animal waste and improves soil.",
      },
      {
        question: "Why do farmers practice crop rotation?",
        choices: ["To use more water", "To prevent soil diseases", "To plant same crop", "To reduce sunlight"],
        answer: 1,
        hint: "It keeps the soil healthy and nutrient-rich.",
      },
      {
        question: "What is the purpose of irrigation in agriculture?",
        choices: ["To remove weeds", "To supply water to crops", "To measure land", "To store seeds"],
        answer: 1,
        hint: "It helps plants get water when rain is not enough.",
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
      {
        question: "What is the sum of the interior angles of a triangle?",
        choices: ["90 degrees", "180 degrees", "360 degrees", "120 degrees"],
        answer: 1,
        hint: "It's always the same for any triangle.",
      },
      {
        question: "What is the volume of a cuboidal tank 5 m long, 3 m wide, and 2 m deep?",
        choices: ["30 cubic m", "10 cubic m", "15 cubic m", "20 cubic m"],
        answer: 0,
        hint: "Volume = length × width × height.",
      },
      {
        question: "Simplify the ratio 40:60 to its lowest terms.",
        choices: ["2:3", "4:6", "20:30", "10:15"],
        answer: 0,
        hint: "Divide both numbers by their greatest common divisor.",
      },
      {
        question: "What is the perimeter of a triangle with sides 3 cm, 4 cm, and 5 cm?",
        choices: ["12 cm", "9 cm", "15 cm", "18 cm"],
        answer: 0,
        hint: "Perimeter = sum of all sides.",
      },
      {
        question: "Solve for x in the equation 3x = 12.",
        choices: ["4", "3", "36", "15"],
        answer: 0,
        hint: "Divide both sides by 3.",
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
      {
        question: "What is the cost of 1.5 kg of rice at ₹40 per kg?",
        choices: ["₹60", "₹40", "₹50", "₹70"],
        answer: 0,
        hint: "Multiply 1.5 by 40.",
      },
      {
        question: "A shirt costs ₹200. After a 25% discount, what is the sale price?",
        choices: ["₹150", "₹200", "₹50", "₹175"],
        answer: 0,
        hint: "25% of 200 is 50, subtract from total.",
      },
      {
        question: "What is the average price of three items costing ₹10, ₹20, and ₹30?",
        choices: ["₹20", "₹15", "₹25", "₹60"],
        answer: 0,
        hint: "Add all prices and divide by 3.",
      },
      {
        question: "Half a dozen eggs cost ₹6 each. What is the total cost?",
        choices: ["₹36", "₹12", "₹6", "₹18"],
        answer: 0,
        hint: "Half a dozen is 6 eggs.",
      },
      {
        question: "A farmer buys goods for ₹80 and sells for ₹100. What is the profit?",
        choices: ["₹20", "₹180", "₹80", "₹10"],
        answer: 0,
        hint: "Profit = selling price - buying price.",
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
      {
        question: "What is the past tense of the verb 'run'?",
        choices: ["Runs", "Running", "Ran", "Runned"],
        answer: 2,
        hint: "It is an irregular verb.",
      },
      {
        question: "Fill in the blank with the correct preposition: The book is ___ the table.",
        choices: ["in", "on", "at", "by"],
        answer: 1,
        hint: "The book is located above the surface.",
      },
      {
        question: "Choose the correct article: ___ sun rises in the east.",
        choices: ["A", "An", "The", "No article"],
        answer: 2,
        hint: "Use 'the' for specific things.",
      },
      {
        question: "Which word is an adjective in the sentence 'The red house is big'?",
        choices: ["The", "Red", "House", "Is"],
        answer: 1,
        hint: "It describes the noun 'house'.",
      },
      {
        question: "Add the correct punctuation: I love my country",
        choices: [".", "!", "?", ","],
        answer: 0,
        hint: "It is a declarative sentence.",
      },
    ],
  };

  // --- Playful Quest Selection UI ---
  function showQuestSelection() {
    // Hide page title to avoid duplication
    document.querySelector('.page-title').style.display = 'none';
  
    // Ensure normal layout without scroll
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const body = document.body;
    sidebar.style.display = 'block';
    content.style.marginLeft = '260px';
    content.style.width = 'calc(100% - 260px)';
    content.style.padding = '0';
    content.style.overflow = 'hidden';
    content.style.height = '100vh';
    body.classList.remove('quest-active');
    gameContainer.style.position = 'relative';
    gameContainer.style.top = '';
    gameContainer.style.left = '';
    gameContainer.style.width = '';
    gameContainer.style.height = '';
    gameContainer.style.zIndex = '';
  
    // Reset background to general quest bg
    const questBg = document.querySelector('.quest-bg');
    questBg.style.backgroundImage = "url('../assets/img/quest-bg.png')";
    questBg.style.opacity = '0.18';
  
    // Remove black overlay if exists
    if (window.questBlackOverlay) {
      window.questBlackOverlay.remove();
      window.questBlackOverlay = null;
    }
  
    gameContainer.innerHTML = "";
    // Ensure #game-container is relative so absolute mute button works
    gameContainer.style.position = "relative";
    gameContainer.style.height = '100vh';
    gameContainer.style.overflow = 'hidden';

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
    overlay.className = "quest-overlay";
    gameContainer.appendChild(overlay);

    const wrapper = document.createElement("div");
    wrapper.className = "quest-wrapper";
    wrapper.style.cssText = 'display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; padding: 20px; gap: 32px;';

    // Add headline for the page
    const headline = document.createElement("h2");
    headline.className = "quest-headline";
    headline.textContent = "Quest Games";
    wrapper.appendChild(headline);

    const cardsRow = document.createElement("div");
    cardsRow.className = "quest-cards-row";
    cardsRow.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 32px; width: 100%; max-height: 70vh; overflow: hidden;';

    Object.keys(questAssets).forEach((quest) => {
      const card = document.createElement("div");
      card.className = "quest-card";
      card.style.setProperty('--quest-color', questAssets[quest].color);
      card.onclick = () => startQuest(quest);

      // Avatar
      const avatar = document.createElement("img");
      avatar.className = "quest-avatar";
      avatar.src = questAssets[quest].avatar;
      avatar.alt = questAssets[quest].avatarName;

      // Title
      const title = document.createElement("div");
      title.className = "quest-title";
      title.textContent = quest;

      // Description
      const desc = document.createElement("div");
      desc.className = "quest-desc";
      desc.textContent = questAssets[quest].avatarName + " needs your help!";

      // Quest Description
      const questDesc = document.createElement("div");
      questDesc.className = "quest-details";
      questDesc.textContent = questAssets[quest].description || "";

      // Play Button
      const playBtn = document.createElement("button");
      playBtn.className = "quest-play-btn";
      playBtn.textContent = "Play Quest";
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
    // Add fade out transition to selection
    gameContainer.classList.add('quest-screen');
    setTimeout(() => {
      // Full screen mode
      const sidebar = document.querySelector('.sidebar');
      const content = document.querySelector('.content');
      const body = document.body;
      sidebar.style.display = 'none';
      content.style.marginLeft = '0';
      content.style.width = '100vw';
      content.style.padding = '0';
      content.style.overflow = 'hidden';
      content.style.height = '100vh';
      body.classList.add('quest-active');
      gameContainer.style.position = 'fixed';
      gameContainer.style.top = '0';
      gameContainer.style.left = '0';
      gameContainer.style.width = '100vw';
      gameContainer.style.height = '100vh';
      gameContainer.style.zIndex = '1001';

      gameContainer.innerHTML = "";
      gameContainer.classList.remove('quest-screen');
      gameContainer.classList.add('active');

      // Set specific quest background
      const questBg = document.querySelector('.quest-bg');
      questBg.style.backgroundImage = `url('${questAssets[questName].bg}')`;
      questBg.style.opacity = '0.5';

      // Add black overlay for contrast
      const blackOverlay = document.createElement("div");
      blackOverlay.className = "quest-black-overlay";
      blackOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        z-index: -1;
      `;
      document.body.appendChild(blackOverlay);
      window.questBlackOverlay = blackOverlay;

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
              questionIdx: 1,
            },
            {
              context: "Ramesh asks about the role of roots in absorbing water for his crops.",
              questionIdx: 5,
            },
          ],
          sita: [
            {
              context: "Sita's wheat has rust-colored spots.",
              questionIdx: 2,
            },
            {
              context: "Which insect helps pollinate Sita’s crops?",
              questionIdx: 3,
            },
            {
              context: "Sita wonders why rotating crops is important for her farm.",
              questionIdx: 8,
            },
          ],
        },
        merge: [
          {
            context:
              "Both farmers want to know: What gas do plants absorb during photosynthesis?",
            questionIdx: 4,
          },
          {
            context: "Now, about how plants make their own food using sunlight.",
            questionIdx: 6,
          },
          {
            context: "What about using manure to enrich the soil for better growth?",
            questionIdx: 7,
          },
          {
            context: "Finally, how can irrigation help in dry seasons for the crops?",
            questionIdx: 9,
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
            {
              context: "For planning the channels, what is the sum of angles in a triangle?",
              questionIdx: 5,
            },
          ],
          small: [
            { context: "The small field is 40m by 30m.", questionIdx: 2 },
            {
              context: "Which tool measures angles in construction?",
              questionIdx: 3,
            },
            {
              context: "For the boundary fence, what is the perimeter of a triangular plot with sides 3m, 4m, 5m?",
              questionIdx: 8,
            },
          ],
        },
        merge: [
          {
            context: "The tank holds 250L, 50L used. How much is left?",
            questionIdx: 4,
          },
          {
            context: "For the storage tank design, what is the volume of a 5m x 3m x 2m cuboid?",
            questionIdx: 6,
          },
          {
            context: "The pipe ratio is 40:60, simplify it.",
            questionIdx: 7,
          },
          {
            context: "To find the length, solve 3x = 12 for x.",
            questionIdx: 9,
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
            { context: "Discount of ₹10 on ₹60 item.", questionIdx: 1 },
            {
              context: "For the rice sack, what is the cost of 1.5 kg at ₹40 per kg?",
              questionIdx: 5,
            },
          ],
          basket: [
            { context: "Basket costs ₹50, farmer buys 4.", questionIdx: 2 },
            { context: "Farmer earns ₹500, spends ₹350.", questionIdx: 3 },
            {
              context: "For the eggs, half a dozen at ₹6 each, total cost?",
              questionIdx: 8,
            },
          ],
        },
        merge: [
          {
            context: "3kg apples at ₹30/kg, 2kg bananas at ₹20/kg.",
            questionIdx: 4,
          },
          {
            context: "A shirt costs ₹200 with 25% discount, sale price?",
            questionIdx: 6,
          },
          {
            context: "Average price of items ₹10, ₹20, ₹30?",
            questionIdx: 7,
          },
          {
            context: "Farmer buys for ₹80, sells for ₹100, profit?",
            questionIdx: 9,
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
            {
              context: "In the letter, what is the past tense of 'run'?",
              questionIdx: 5,
            },
          ],
          sign: [
            {
              context: "Choose the correct spelling: Environment.",
              questionIdx: 2,
            },
            { context: "Opposite of ‘difficult’?", questionIdx: 3 },
            {
              context: "The sign says: The book is ___ the table. Fill with preposition.",
              questionIdx: 6,
            },
          ],
        },
        merge: [
          {
            context: "Fill in the blank: The sun ____ in the east.",
            questionIdx: 4,
          },
          {
            context: "For the sign: ___ sun rises in the east. Choose article.",
            questionIdx: 7,
          },
          {
            context: "In the sentence 'The red house is big', identify the adjective.",
            questionIdx: 8,
          },
          {
            context: "Add punctuation: I love my country",
            questionIdx: 9,
          },
        ],
      },
    };

    // State
    const questions = questionSets[questName];
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
      const previousScreen = gameContainer.querySelector('.quest-screen');
      if (previousScreen) {
        previousScreen.classList.remove('active');
      }
      gameContainer.innerHTML = "";
      gameContainer.classList.add('quest-screen', 'active');
  
      // Main layout
      const layout = document.createElement("div");
      layout.className = "quest-layout";

      // Avatar (bigger)
      const avatar = document.createElement("img");
      avatar.className = "quest-avatar-large";
      avatar.src = avatarImg;
      avatar.alt = avatarName;

      // Dialog bubble with white background and black shadow
      const bubble = document.createElement("div");
      bubble.className = "quest-bubble";

      // Progress bar with animated stars
      const progressBar = document.createElement("div");
      progressBar.className = "quest-progress";
      for (let i = 0; i < 5; i++) {
        const star = document.createElement("img");
        star.className = `quest-star ${i < stars ? 'active' : ''}`;
        star.src = starImg;
        star.alt = "star";
        progressBar.appendChild(star);
      }
      bubble.appendChild(progressBar);

      // Dialog text
      const dialog = document.createElement("div");
      dialog.className = "quest-dialog";

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
              {
                context: "Ramesh asks about the role of roots in absorbing water for his crops.",
                questionIdx: 5,
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
              {
                context: "Sita wonders why rotating crops is important for her farm.",
                questionIdx: 8,
              },
            ],
          },
          merge: [
            {
              context:
                "Both farmers want to know: What gas do plants absorb during photosynthesis?",
              questionIdx: 4,
            },
            {
              context: "Now, about how plants make their own food using sunlight.",
              questionIdx: 6,
            },
            {
              context: "What about using manure to enrich the soil for better growth?",
              questionIdx: 7,
            },
            {
              context: "Finally, how can irrigation help in dry seasons for the crops?",
              questionIdx: 9,
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
              {
                context: "For planning the channels, what is the sum of angles in a triangle?",
                questionIdx: 5,
              },
            ],
            small: [
              { context: "The small field is 40m by 30m.", questionIdx: 2 },
              {
                context: "Which tool measures angles in construction?",
                questionIdx: 3,
              },
              {
                context: "For the boundary fence, what is the perimeter of a triangular plot with sides 3m, 4m, 5m?",
                questionIdx: 8,
              },
            ],
          },
          merge: [
            {
              context: "The tank holds 250L, 50L used. How much is left?",
              questionIdx: 4,
            },
            {
              context: "For the storage tank design, what is the volume of a 5m x 3m x 2m cuboid?",
              questionIdx: 6,
            },
            {
              context: "The pipe ratio is 40:60, simplify it.",
              questionIdx: 7,
            },
            {
              context: "To find the length, solve 3x = 12 for x.",
              questionIdx: 9,
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
              {
                context: "For the rice sack, what is the cost of 1.5 kg at ₹40 per kg?",
                questionIdx: 5,
              },
            ],
            basket: [
              { context: "Basket costs ₹50, farmer buys 4.", questionIdx: 1 },
              { context: "Farmer earns ₹500, spends ₹350.", questionIdx: 3 },
              {
                context: "For the eggs, half a dozen at ₹6 each, total cost?",
                questionIdx: 8,
              },
            ],
          },
          merge: [
            {
              context: "3kg apples at ₹30/kg, 2kg bananas at ₹20/kg.",
              questionIdx: 4,
            },
            {
              context: "A shirt costs ₹200 with 25% discount, sale price?",
              questionIdx: 6,
            },
            {
              context: "Average price of items ₹10, ₹20, ₹30?",
              questionIdx: 7,
            },
            {
              context: "Farmer buys for ₹80, sells for ₹100, profit?",
              questionIdx: 9,
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
              {
                context: "In the letter, what is the past tense of 'run'?",
                questionIdx: 5,
              },
            ],
            sign: [
              {
                context: "Choose the correct spelling: Environment.",
                questionIdx: 2,
              },
              { context: "Opposite of ‘difficult’?", questionIdx: 3 },
              {
                context: "The sign says: The book is ___ the table. Fill with preposition.",
                questionIdx: 6,
              },
            ],
          },
          merge: [
            {
              context: "Fill in the blank: The sun ____ in the east.",
              questionIdx: 4,
            },
            {
              context: "For the sign: ___ sun rises in the east. Choose article.",
              questionIdx: 7,
            },
            {
              context: "In the sentence 'The red house is big', identify the adjective.",
              questionIdx: 8,
            },
            {
              context: "Add punctuation: I love my country",
              questionIdx: 9,
            },
          ],
        },
      };

      // --- Branching story logic ---
      if (!completed) {
        // Initial decision point
        if (!window.branchChoice) {
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
          if (sounds.win) sounds.win.play();
          setTimeout(() => {
            showConfetti();
          }, 400);
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
        if (sounds.win) sounds.win.play();
        setTimeout(() => {
          showConfetti();
        }, 400);
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
        btnGroup.className = "quest-btn-group";
        btnGroup.style.setProperty('--quest-color', questColor);

        choices.forEach((choice, idx) => {
          const btn = document.createElement("button");
          btn.className = "quest-btn";
          btn.textContent = choice;
          btn.onclick = () => handleBranchAnswer(idx);
          btnGroup.appendChild(btn);
        });
        bubble.appendChild(btnGroup);

        // Hint button
        const hintBtn = document.createElement("button");
        hintBtn.className = "quest-hint-btn";
        hintBtn.textContent = "Hint";
        hintBtn.onclick = () => {
          showHint(qObj.hint);
        };
        bubble.appendChild(hintBtn);
      }

      // Next button for story intro or after completion
      // Only show "Back to Quests" button on completion
      if (completed) {
        const nextBtn = document.createElement("button");
        nextBtn.className = "quest-next-btn";
        nextBtn.style.setProperty('--quest-color', questColor);
        nextBtn.textContent = "Back to Quests";
        nextBtn.onclick = () => {
          // Remove black overlay
          if (window.questBlackOverlay) {
            window.questBlackOverlay.remove();
            window.questBlackOverlay = null;
          }

          // Restore normal layout
          const sidebar = document.querySelector('.sidebar');
          const content = document.querySelector('.content');
          const body = document.body;
          sidebar.style.display = 'block';
          content.style.marginLeft = '260px';
          content.style.width = 'calc(100% - 260px)';
          content.style.padding = '0';
          content.style.overflow = 'hidden';
          content.style.height = '100vh';
          body.classList.remove('quest-active');
          gameContainer.style.position = '';
          gameContainer.style.top = '';
          gameContainer.style.left = '';
          gameContainer.style.width = '';
          gameContainer.style.height = '';
          gameContainer.style.zIndex = '';

          // Reset background to general quest bg
          const questBg = document.querySelector('.quest-bg');
          questBg.style.backgroundImage = "url('../assets/img/quest-bg.png')";
          questBg.style.opacity = '0.18';

          showQuestSelection();
        };
        bubble.appendChild(nextBtn);
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
        addCoins(5);
        if (score === 50) unlockAchievement("Perfect Score!");
        if (stars === 5) unlockAchievement("All Stars!");
      } else {
        if (sounds.wrong) sounds.wrong.play();
        showFeedback("Try again! 😅");
      }
    }

    // --- Show Feedback and Move to Next Question ---
    function showFeedback(msg) {
      const bubble = gameContainer.querySelector(".quest-bubble");
      if (bubble) {
        const dialog = bubble.querySelector(".quest-dialog");
        if (dialog) {
          dialog.textContent = msg;
          dialog.style.color = "#27ae60";
        }
      }
    }

    // --- Show Hint ---
    function showHint(hint) {
      const bubble = gameContainer.querySelector(".quest-bubble");
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
      const confettiContainer = document.createElement("div");
      confettiContainer.className = "confetti-container";
      document.body.appendChild(confettiContainer);
      const emojis = ["🎉", "✨", "🥳", "🌟", "⭐", "🎊"];
      for (let i = 0; i < 60; i++) {
        const particle = document.createElement("div");
        particle.className = "confetti-particle";
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.left = Math.random() * 100 + "vw";
        particle.style.animationDuration = (Math.random() * 3 + 2) + "s";
        particle.style.animationDelay = Math.random() * 2 + "s";
        confettiContainer.appendChild(particle);
      }
      setTimeout(() => {
        confettiContainer.remove();
      }, 5000);
    }

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

        // Add achievements button
        if (!document.getElementById("achievementsBtn")) {
          const achievementsBtn = document.createElement("button");
          achievementsBtn.id = "achievementsBtn";
          achievementsBtn.innerHTML = "Achievements";
          achievementsBtn.style.cssText =
            "position:fixed;bottom:32px;right:320px;z-index:1200;padding:12px 24px;border-radius:16px;background:#27ae60;color:#fff;font-size:1.1rem;border:none;box-shadow:0 2px 8px #b2bec3;cursor:pointer;";
          achievementsBtn.onclick = showAchievementsGallery;
          document.body.appendChild(achievementsBtn);
        }

        // Reset branching state
        window.branchChoice = undefined;
        window.branchProgress = 0;
        window.mergeProgress = 0;

        render();
      }, 300);
  }
  function showAchievementsGallery() {
    const modal = document.createElement("div");
    modal.className = "quest-modal";
    modal.innerHTML = `
      <div class="quest-modal-content" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
        <h2 class="quest-modal-title">Achievement Gallery</h2>
        <div class="quest-modal-icon">🏆</div>
        ${achievements.length > 0
          ? achievements.map(name => `
            <div class="achievement-badge" style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 12px; margin: 8px 0; border-radius: 12px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <strong>${name}</strong>
            </div>
          `).join('')
          : '<p style="text-align: center; color: #bdc3c7;">No achievements unlocked yet! Keep playing to earn badges.</p>'
        }
        <button class="quest-modal-btn" id="closeAchievementsBtn" style="margin-top: 20px;">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#closeAchievementsBtn").onclick = () => modal.remove();
    modal.style.setProperty('--quest-color', '#27ae60');
  }

  // --- Start with Quest Selection ---
  showQuestSelection();
});
