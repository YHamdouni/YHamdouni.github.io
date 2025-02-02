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
<header class="header">
  Campus ${userData.campus}
  <button id="logout">Logout</button>
</header>
<div class="main-content">
    <details>
    <summary><strong>Username:</strong> ${userData.username}</strong></summary>
    <article>
      <p>First Name: ${userData.firstName}</p>
      <p>Last Name: ${userData.lastName}</p>
      <p>Email: ${userData.email}</p>
      <p>Audit Ratio: ${userData.auditRatio}</p>
      <p>Total Uploads: ${userData.totalUp}</p>
      <p>Total Downloads: ${userData.totalDown}</p>
      <p>Successful Projects: ${userData.successrojects}</p>
    </article>
    </details>
    <div id="graphs">graph place</div>
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
  finished_projects: []
};


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
    id
    login
    firstName
    lastName
    email
    campus
    auditRatio
    totalUp
    totalDown
    finished_projects: groups(
      where: {group: {status: {_eq: finished}, _and: [{path: {_like: "%module%"}}, {path: {_nilike: "%piscine-js%"}}]}}
    ) {
      group {
        path
        status
        members{
          userLogin
        }
      }
    }
    current_projects: groups(where: {group: {status: {_eq: working}}}) {
      group {
        path
        status
        members {
          userLogin
        }
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
    console.log("result", result.data);

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error("Failed to fetch user data");
    }

    const Data = result.data.user;


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
    });


    document.body.innerHTML = profileHTML(UserData);

    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("jwt");
      document.body.innerHTML = loginPage;
    });

  } catch (error) {
    console.error("Failed to render profile page:", error);
  }
}


// Initial Render
if (localStorage.getItem("jwt")) {
  renderProfilePage();
}





// Convert totalUp and totalDown, deciding between B, KB, and MB
function formatSize(sizeInBytes) {
  if (sizeInBytes < 1000) {
    return sizeInBytes + " B";
  } else if (sizeInBytes < 1000 * 1000) {
    return (sizeInBytes / 1000).toFixed(2) + " KB";
  } else {
    sizeInBytes = (sizeInBytes / 1000 / 1000).toFixed(3);
    return sizeInBytes.slice(0, 4) + " MB";
  }
}
















////////////////////////////////////////////
// i will use this query to get the data i need
// query {
//   user {
//       id
//       login
//       firstName
//       lastName
//       email
//       campus
//       auditRatio
//       totalUp
//       totalDown
//       xpTotal: transactions_aggregate(where: {type: {_eq: "xp"}, eventId: {_eq: 41}}) {
//         aggregate {
//           sum {
//             amount
//           }
//         }
//       }
//       events(where:{eventId:{_eq:56}}) {
//         level
//       }
//       xp: transactions(order_by: {createdAt: asc}
//         where: {type: {_eq: "xp"}, eventId: {_eq: 56}}) {
//           createdAt
//           amount
//           path
//       }
//       finished_projects: groups(where:{group:{status:{_eq:finished}}}) {
//           group {
//           path
//           status
//         }
//       }
//       current_projects: groups(where:{group:{status:{_eq:working}}}) {
//           group {
//           path
//           status
//           members {
//             userLogin
//           }
//         }
//       }
//       setup_project: groups(where:{group:{status:{_eq:setup}}}) {
//           group {
//           path
//           status
//           members {
//             userLogin
//           }
//         }
//       }
//       skills: transactions(
//           order_by: {type: asc, amount: desc}
//           distinct_on: [type]
//           where: {eventId: {_eq: 41}, _and: {type: {_like: "skill_%"}}}
//       ) {
//           type
//           amount
//       }
//   }
// }


















///////////////////
{/* <h2>Current Projects</h2>
    <div>
      ${userData.current_projects.length > 0 ?
    userData.current_projects.map(project => `
          <div>
            <strong>Project Path:</strong> ${project.group.path}
            <div><strong>Status:</strong> ${project.group.status}</div>
          </div>
        `).join('') :
    '<p>No current projects.</p>'
  }
    </div> */}



{/* <h2>Finished Projects</h2>
    <div>
      ${userData.finished_projects.length > 0 ?
    userData.finished_projects.map(project => `
          <div>
            <strong>Project Path:</strong> ${project.group.path}
            <div><strong>Status:</strong> ${project.group.status}</div>
          </div>
        `).join('') :
    '<p>No finished projects.</p>'
  }
    </div> */}