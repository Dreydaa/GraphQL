console.log("ici");

const loginSection = document.getElementById("loginSection");
const profileSection = document.getElementById("profileSection")/* [0] */;
const userInput = document.getElementById("userInput");
const passInput = document.getElementById("passInput");
const signInBtn = document.getElementById(".signInBtn");
const loginError = document.getElementById("loginError");
const displayUsername = document.getElementById("displayUsername")/* [0] */;
const userDataContainer = document.getElementById("userData")/* [0] */;
const signOutBtn = document.getElementById("signOutBtn");

let jwtToken = null;

async function authentificateUser() {
    /* console.log("authUser"); */
    const username = userInput.value;
    const password = passInput.value;
    const base64Credentials = btoa(`${username}:${password}`);

    try {
        /* console.log("Sending login request" ); */
        const response = await fetch('https://zone01normandie.org/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64Credentials}`
            }
        });

        if (!response.ok) {
            throw new Error(`Invalid :  ${response.status} ${response.statusText}`);
        }

        token = await response.json();
        console.log("login successful:", token);

        const user = await fetchUserData(token);
        const xpData = await fetchXPData(token);
        const skillData = await fetchSkillData(token);

        displayUsername.textContent = user.attrs.firstName;
        renderXPChart(xpData);
        renderSkillPieChart(skillData);

        loginSection.style.display = 'none';
        profileSection.style.display = 'block';
    } catch (error) {
        loginError.textContent = `login failed: ${error.message}`;
        console.log('login error:', error)
    }
}

async function fetchUserData(token) {
   /*  console.log("fetch USER data with token:", token); */
    try {
        const response = await fetch('https://zone01normandie.org/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `
                query {
                    user {
                        id
                        attrs
                        transactions {
                            type
                            amount
                            path
                            createdAt
                        }
                    }
                }
                `
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.errors) {
            throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
        }

        console.log("user data fetch error:", result.data.user[0]);
        return result.data.user[0];
    } catch (error) {
        throw new Error('Failed to fetch user data');
    }
}

async function fetchXPData(token) {
   /*  console.log("fetch xp data", token); */
    try {
        const response = await fetch('https://zone01normandie.org/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `
                query {
                    user {
                        transactions {
                            type
                            amount
                            path
                            createdAt
                        }
                    }
                }
                `
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.errors) {
            throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
        }

        return result.data.user[0].transactions;
    } catch (error) {
        throw new Error('Failed to fetch XP data');
    }
}

async function fetchSkillData(token) {
    /* console.log("fetch SKILL DATA", token); */
    try {
        const response = await fetch('https://zone01normandie.org/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `
                query {
                    transaction(where: { type: { _ilike: "skill_%" } }) {
                        type
                        amount
                        createdAt
                        path
                    }
                }
                `
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        if (result.errors) {
            throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
        }

        return result.data.transaction;
    } catch (error) {
        throw new Error('Failed to fetch skill data');
    }
}


function renderXPChart(transactions) {
    console.log(transactions)
    const filteredTransactions = transactions.filter(transaction => {
        return transaction.path.includes("/div-01") && !transaction.path.includes("piscine-js/");
    });
    const data = filteredTransactions.filter(filteredTransaction => {
        return filteredTransaction.type === "xp";
    });
    const sortedData = data.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    // Create the SVG container

    const svgContainer = document.getElementById('xpChartContainer');
    const height = parseInt(svgContainer.style.height);
    const width = parseInt(svgContainer.style.width);



    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    


    // Create the line
    const accumulatedValues = [];
    let accumulatedTotal = 0;
    sortedData.forEach((entry, index) => {
        accumulatedTotal += entry.amount;
        accumulatedValues.push({ x: index, y: accumulatedTotal });
    });


    // Calculate Y-axis step size
    const yAxisStep = Math.ceil(Math.max(accumulatedTotal));

    // Calculate X-axis step size (assuming 30 days per month)
    const dateStep = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    // Calculate the number of months between the start and end date
    const startDate = new Date(sortedData[0].createdAt);
    const endDate = new Date(sortedData[sortedData.length - 1].createdAt);
    const monthsDifference = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() +1;
    // Create the line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const points = accumulatedValues.map(entry => `${(entry.x / (sortedData.length - 1)) * width},${height - (entry.y / yAxisStep) * height}`);
    line.setAttribute('points', points.join(' '));	
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#4267B2');
    line.setAttribute('stroke-width', '2');
    svg.appendChild(line);
    // Create Y-axis ticks and labels
    for (let i = 0; i <= 10; i++) {
        const yAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisTick.setAttribute('x1', '0');
        yAxisTick.setAttribute('x2', width);
        yAxisTick.setAttribute('y1', (i / 10) * height);
        yAxisTick.setAttribute('y2', (i / 10) * height);
        yAxisTick.setAttribute('stroke', '#ccc');
        svg.appendChild(yAxisTick);
        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('x', '5');
        yAxisLabel.setAttribute('y', (i / 10) * height - 5);
        yAxisLabel.setAttribute('fill', '#333');
        yAxisLabel.textContent = Math.round(yAxisStep * (10 - i) / 10);
        svg.appendChild(yAxisLabel);
    }
    // Create X-axis ticks and labels
    for (let i = 0; i <= monthsDifference; i++) {
        const dateForTick = new Date(startDate.getTime() + (i / monthsDifference) * monthsDifference * dateStep);
        const xAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxisTick.setAttribute('x1', (i / monthsDifference) * width);
        xAxisTick.setAttribute('x2', (i / monthsDifference) * width);
        xAxisTick.setAttribute('y1', '0');
        xAxisTick.setAttribute('y2', height);
        xAxisTick.setAttribute('stroke', '#ccc');
        svg.appendChild(xAxisTick);
        const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xAxisLabel.setAttribute('x', (i / monthsDifference) * width);
        xAxisLabel.setAttribute('y', height - 5);
        xAxisLabel.setAttribute('fill', '#333');
        xAxisLabel.textContent = formatDate(dateForTick);
        svg.appendChild(xAxisLabel);
    }
    svgContainer.appendChild(svg);
    return accumulatedTotal;
}

function formatDate(date) {
    const options = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }


function renderSkillPieChart(skillLevels) {

    console.log(skillLevels)

    const svglvlContainer = document.getElementById('skillsChartContainer');
    const height = parseInt(svglvlContainer.style.height);
    const width = parseInt(svglvlContainer.style.width);


    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    const barWidth = width / Object.keys(skillLevels).length;
    let index = 0;
    for (const [skillType, level] of Object.entries(skillLevels)) {
      const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      console.log(level.type, level.amount)
      const barHeight = (level.amount / 100) * height;
      const xPosition = index * barWidth;
      const yPosition = height - barHeight;
      bar.setAttribute('x', xPosition);
      bar.setAttribute('y', yPosition);
      bar.setAttribute('width', barWidth);
      bar.setAttribute('height', barHeight);
      bar.setAttribute('fill', '#4267B2');
      svg.appendChild(bar);
      // Display skill type labels
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', xPosition + barWidth / 2);
      label.setAttribute('y', height - 5);
      label.setAttribute('fill', '#333');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = level.type.substring(level.type.indexOf('_') + 1);

      label.style.writingMode = 'vertical-lr';


      label.style.fontSize = '14px';


      svg.appendChild(label);
      index++;
    }

    for (let i = 0; i <= 11; i++) {
        const yAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisTick.setAttribute('x1', '0');
        yAxisTick.setAttribute('x2', width);
        yAxisTick.setAttribute('y1', (i / 10) * height);
        yAxisTick.setAttribute('y2', (i / 10) * height);
        yAxisTick.setAttribute('stroke', '#ccc');
        svg.appendChild(yAxisTick);
      
        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('x', '5');
        yAxisLabel.setAttribute('y', height - (i / 10) * height - 5);
        yAxisLabel.setAttribute('fill', '#333');
        yAxisLabel.textContent = Math.round(100 * i / 10); // Adjusted here
        svg.appendChild(yAxisLabel);
      }
      svglvlContainer.appendChild(svg);
}


function logoutUser() {
    console.log("logout user");
    token = null;
    userInput.value = '';
    passInput.value = '';
    loginSection.style.display = 'block';
    profileSection.style.display = 'none';

    document.getElementById('xpChartContainer').innerHTML = '';
    document.getElementById('skillsChartContainer').innerHTML = '';
}
