import { query } from "./query.js";
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


const profileHTML = (userData) => `
<div class="Page-Top">
  <div class="compus">
    <img src="/src/logo.png" alt="Logo" class="logo">
    <h1>Campus ${userData.campus}</h1>
  </div>
  <button id="logout">Logout</button>
</div>
<div class="profile-container">
  <div class="personal-info">
    <h2>Personal Information</h2>
    <p><strong>Username: </strong>${userData.username}</p>
    <p><strong>First Name: </strong>${userData.firstName}</p>
    <p><strong>Last Name: </strong>${userData.lastName}</p>
    <p><strong>Email: </strong>${userData.email}</p>
    <p><strong>Your XP: </strong> ${UserData.XP}</p>
  </div>
  <div class="projects-success">
    <h2>Number of projects: ${userData.successrojects}</h2>
    <h2>Projects Name</strong></h2>
      ${userData.finished_projects.map(project => {
  const path = (project.group.path).split('/').pop();
  return `<p>${path}</p>`
}).join('')
  }
  </div>
  <div class="current-projects">
      <h2>Current Projects</h2>
      ${userData.current_projects.map(project => {
    const path = (project.group.path).split('/').pop();
    return `<p>${path}</p>`
  }).join('')
  }
  </div>
  <div id="graph1">
    <div id="title">
      <h2>you worked with :</h2>
      <p id="NamesAndTimes"></p>
    </div>
  </div>
  <div id="graph2">
    <div id="title">
    <h2>Audits ratio</h2>

    </div>
  </div>
</div>
`;


let UserData = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  campus: "",
  auditRatio: "",
  totalUp: "",
  totalDown: "",
  successrojects: 0,
  current_projects: [],
  finished_projects: [],
  XP: 0,
  Skills: [],
};
let members = [];


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

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error("Failed to fetch user data");
    }

    const Data = result.data.user;
    UserData.Skills = result.data.sklis;

    Data.forEach(Element => {
      UserData.username = Element.login;
      UserData.firstName = Element.firstName;
      UserData.lastName = Element.lastName;
      UserData.email = Element.email;
      UserData.campus = Element.campus;
      UserData.auditRatio = (parseFloat(Element.auditRatio)).toFixed(1);
      UserData.totalUp = formatSize(parseFloat(Element.totalUp));
      UserData.totalDown = formatSize(parseFloat(Element.totalDown));
      UserData.current_projects = Element.current_projects;
      UserData.successrojects = Element.finished_projects.length;
      UserData.finished_projects = Element.finished_projects;
      UserData.XP = formatSize(parseFloat(Element.transactions_aggregate.aggregate.sum.amount), "XP");
    });

    UserData.finished_projects.forEach(project => {
      project.group.members.forEach(member => {
        const userlogin = member.userLogin;
        if (userlogin !== UserData.username) {
          let existingMember = members.find(m => m.userlogin === userlogin);
          if (!existingMember) {
            members.push({ userlogin, times: 1 });
          } else {
            existingMember.times++;
          }
        }
      });
    });


    document.body.innerHTML = profileHTML(UserData);
    const graph1 = document.getElementById("graph1");
    SVGCREATE(graph1, "graph1", members.length);
    const svg1 = document.getElementById("svg-graph1");
    GRAPH(svg1, members);
    const graph2 = document.getElementById("graph2");
    auditRatio(UserData, graph2);
    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("jwt");
      document.body.innerHTML = loginPage;
    });

  } catch (error) {
    console.error("Failed to render profile page:", error);
  }
}

function formatSize(sizeInBytes, xp) {
  var result;
  if (sizeInBytes < 1000) {
    result = sizeInBytes + " B";
  } else if (sizeInBytes < 1000 * 1000) {
    if (xp === "XP") {
      result = Math.floor(sizeInBytes / 1000) + " kB";
    } else {
      result = (sizeInBytes / 1000).toFixed(2) + " KB";
    }
  } else {
    if (xp === "XP") {
      result = Math.floor(sizeInBytes / 1000 / 1000) + " MB";
    } else {
      sizeInBytes = (sizeInBytes / 1000 / 1000).toFixed(3);
      result = sizeInBytes.slice(0, 4) + " MB";
    }
  }
  return result;
}

function SVGCREATE(graph, id, dataLength) {
  const barWidth = 30;
  const barSpacing = 15;
  const minWidth = 400;
  const graphHeight = 300;

  const graphWidth = Math.max(minWidth, dataLength * (barWidth + barSpacing) + 20);

  const svgString = ` 
    <svg xmlns="http://www.w3.org/2000/svg" id="svg-${id}" width="${graphWidth}" height="100%" 
         viewBox="0 0 ${graphWidth} ${graphHeight}" preserveAspectRatio="xMinYMin meet">
    </svg>`;
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const svgElement = svgDoc.documentElement;

  graph.appendChild(svgElement);
}

function GRAPH(svg, DATA) {
  if (!DATA.length) return; // Handle empty data

  DATA.sort((a, b) => b.times - a.times);

  const maxTimes = DATA[0].times;
  const barWidth = 30;
  const barSpacing = 15;
  const graphHeight = 280;
  const baseX = 10;
  const NamesAndTimes = document.getElementById("NamesAndTimes");

  DATA.forEach((item, index) => {
    const barHeight = (item.times / maxTimes) * 250; // Scale bars
    const x = baseX + index * (barWidth + barSpacing);
    const y = graphHeight - barHeight;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barWidth);
    rect.setAttribute("height", barHeight);
    rect.setAttribute("fill", "purple");
    rect.setAttribute("cursor", "pointer");

    rect.addEventListener("mouseover", () => {
      NamesAndTimes.textContent = `${item.userlogin}: ${item.times} times`;
    });

    svg.appendChild(rect);
  });
}

function auditRatio(UserData, graph2) {
  const widthUp = parseFloat(UserData.totalUp);
  const widthDown = parseFloat(UserData.totalDown);
  const totalwidth = widthUp + widthDown;


  const svgString = `
  <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="60" width="${(widthUp / (totalwidth)) * 200}" height="30" fill="green" />
    <rect x="${10 + (widthUp / (totalwidth)) * 200}" y="60" width="${(widthDown / (totalwidth)) * 200}" height="30" fill="red" />

    <text x="10" y="40" font-size="20" fill="black">Your ratio: <tspan fill="yellow">${UserData.auditRatio}</tspan></text>
    <text x="10" y="105" font-size="14" fill="black">🟩Up: ${UserData.totalUp}</text>
    <text x="110" y="105" font-size="14" fill="black">🟥Down: ${UserData.totalDown}</text>
  </svg>`
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const svgElement = svgDoc.documentElement;
  graph2.appendChild(svgElement);
}

// Initial Render
if (localStorage.getItem("jwt")) {
  renderProfilePage();
}
