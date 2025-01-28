// Entry Point for GraphQL Profile Page Project

// **Step 1: Setup Login Page**
// HTML Structure for Login Page
const loginPage = `
  <div class="login-container">
    <h1>Login</h1>
    <form id="login-form">
      <input type="text" id="username" placeholder="Username or Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <p id="error-message" class="hidden">Invalid credentials. Please try again.</p>
  </div>
`;

document.body.innerHTML = loginPage;

// API Endpoints
const BASE_URL = "https://learn.zone01oujda.ma/api";
const SIGNIN_URL = `${BASE_URL}/auth/signin`;
const GRAPHQL_URL = `${BASE_URL}/graphql-engine/v1/graphql`;

// Login Functionality
async function login(username, password) {
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(SIGNIN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) throw new Error("Login failed");

    const jwt = await response.json();
    localStorage.setItem("jwt", jwt);
    renderProfilePage();
  } catch (error) {
    document.getElementById("error-message").classList.remove("hidden");
  }
}

// Event Listener for Login Form
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  login(username, password);
});

// **Step 2: Profile Page Rendering**
async function renderProfilePage() {
  const jwt = localStorage.getItem("jwt");

  if (!jwt) {
    document.body.innerHTML = loginPage;
    return;
  }

  const query = `
       query {
    user {
      login
      firstName
      lastName
      campus
      auditRatio
    }
    xp_view(
      where: {
        path: { _like: "%/oujda/div-01%" }
        _and: [
          { path: { _nlike: "%checkpoint%" } }
          { path: { _nlike: "%piscine-js-2%" } }
          { path: { _nlike: "%piscine-rust%" } }
        ]
      }
      order_by: { amount: desc }
      limit: 10
    ) {
      amount
      originEventId
      path
      userId
    }
    transaction_xp: transaction(
      where: { type: { _eq: "xp" }, eventId: { _eq: 56 } }
    ) {
      createdAt
      amount
      path
      type
    }
    transaction_audits: transaction(
      order_by: { createdAt: asc }
      where: { type: { _regex: "up|down" } }
    ) {
      type
      amount
      path
      createdAt
    }
    transaction_skills: transaction(
      where: { eventId: { _eq: 56 }, _and: { type: { _like: "skill_%" } } }
    ) {
      type
      amount
      path
    }
    transaction_aggregate {
      aggregate {
        sum {
          amount
        }
      }
    }
  }

`
;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    console.log("result",result.data);

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error("Failed to fetch user data");
    }

    const user = result.data.user;
    // console.log("user",user);
    
    let login ;
    let transactions = [];
    user.forEach((user) => {
      login = user.login; 
      transactions = user.transactions;
    });

    const profileHTML = `
      <div class="profile-container">
        <h1>Welcome, ${login}</h1>
        <button id="logout">Logout</button>
        <section>
          <h2>Statistics</h2>
          <div id="graphs">
            <svg id="graph1" width="400" height="200"></svg>
            <svg id="graph2" width="400" height="200"></svg>
          </div>
        </section>
      </div>
    `;

    document.body.innerHTML = profileHTML;

    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("jwt");
      document.body.innerHTML = loginPage;
    });

    renderGraphs(transactions);
  } catch (error) {
    console.error("Failed to render profile page:", error);
  }
}


// Graph Rendering
function renderGraphs(transactions) {
  console.log("Rendering graphs...", transactions);
  
  const svg1 = document.getElementById("graph1");
  const svg2 = document.getElementById("graph2");

  // Example: XP over time
  const xpOverTime = transactions.map((tx) => ({
    x: new Date(tx.createdAt).getTime(),
    y: tx.amount,
  }));

  // SVG Drawing logic for line graph (XP over time)
  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.setAttribute("points", xpOverTime.map((p) => `${p.x},${p.y}`).join(" "));
  line.setAttribute("stroke", "blue");
  line.setAttribute("fill", "black");
  
  svg1.appendChild(line);

  // Example: Pie Chart for XP distribution
  const totalXP = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  let cumulativeXP = 0;
  transactions.forEach((tx) => {
    const percentage = (tx.amount / totalXP) * 100;
    const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // SVG path generation logic for pie chart goes here
    svg2.appendChild(arc);
    cumulativeXP += tx.amount;
  });
}

// Initial Render
if (localStorage.getItem("jwt")) {
  renderProfilePage();
}
