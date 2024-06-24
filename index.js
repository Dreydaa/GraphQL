console.log("ici");

const loginSection = document.getElementById("loginSection");
const profileSection = document.getElementById("profileSection")/* [0] */;
const userInput = document.getElementById("userInput");
const passInput = document.getElementById("passInput");
const signInBtn = document.getElementById(".signInBtn");
const loginError = document.getElementById("loginError");
const displayUsername = document.getElementById("displayUsername")/* [0] */;
/* const usernameDisplay = document.getElementById("username");
const emailDisplay = document.getElementById("email"); */
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


        const totalXP = Math.round(xpData.reduce((acc, txn) => acc + txn.amount, 0));
        const auditData = await fetchAuditData(token);
        const totalAuditRatio = calculateTotalAuditRatio(auditData);

        displayUserInfo(user, totalXP, totalAuditRatio);

        /* console.log('a voir:', user.attrs.firstName);
        console.log('a voir:', user.attrs.lastName);
        console.log('a voir:', user.attrs.email); */

        renderXPChart(xpData);
        renderSkillChart(skillData);
        loginSection.style.display = 'none';
        profileSection.style.display = 'block';

    } catch (error) {
        loginError.textContent = `login failed: ${error.message}`;
        console.log('login error:', error)
    }
}

function displayUserInfo(user, totalXP, totalAuditRatio) {
    const firstNameElement = document.createElement('p');
    firstNameElement.textContent = `${user.attrs.firstName}`;

    const lastNameElement = document.createElement('p');
    lastNameElement.textContent = `${user.attrs.lastName}`;

    const emailElement = document.createElement('p');
    emailElement.textContent = `${user.attrs.email}`;

    const totalXPElement = document.createElement('p');
    totalXPElement.textContent = `${totalXP}`;

    const totalAuditRatioElement = document.createElement('p');
    totalAuditRatioElement.textContent = `${totalAuditRatio.toFixed(5)}`;

    displayUsername.appendChild(firstNameElement);
    displayUsername.appendChild(lastNameElement);
    displayUsername.appendChild(emailElement);
    displayUsername.appendChild(totalXPElement);
    displayUsername.appendChild(totalAuditRatioElement);
}

function calculateTotalAuditRatio(auditData) {
    let totalRatio = 0;

    auditData.forEach(audit => {
        totalRatio += (audit.amount / audit.total);
    });
    return totalRatio;
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

async function fetchAuditData(token) {
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

        return result.data.user[0].transactions.filter(txn => txn.type === 'audit');
    } catch (error) {
        throw new Error('Failed to fetch audit data');
    }
}

function formatDate(date) {
    const options = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

function renderXPChart(transactions) {
    console.log("Rendering XP chart with transactions:", transactions);

    const filteredTransactions = transactions.filter(txn => txn.path.includes("/div-01") && !txn.path.includes("piscine-js/"));
    const xpData = filteredTransactions.filter(txn => txn.type === "xp");
    const sortedXPData = xpData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    console.log("Filtered and sorted XP data:", sortedXPData);

    const svgContainer = document.getElementById('xpChartContainer');
    const svgWidth = 1000;
    const svgHeight = 500;
    console.log(`SVG container dimensions: width=${svgWidth}, height=${svgHeight}`);

    /* svgContainer.innerHTML = '';  // Clear any existing content */

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    svgContainer.appendChild(svg);

    const accumulatedXP = [];
    let totalXP = 0;
    sortedXPData.forEach((entry, index) => {
        totalXP += entry.amount;
        accumulatedXP.push({ x: index, y: totalXP });
    });
    console.log("Accumulated XP data:", accumulatedXP);

    const maxXP = Math.max(...accumulatedXP.map(d => d.y));
    if (maxXP === 0) {
        console.error("Max XP is 0, cannot render chart.");
        return;
    }

    const linePoints = accumulatedXP.map(d => `${(d.x / (sortedXPData.length - 1)) * svgWidth},${svgHeight - (d.y / maxXP) * svgHeight}`).join(' ');
    console.log("Line points for XP chart:", linePoints);

    if (linePoints.trim() === '') {
        console.error("Line points are empty, cannot render chart.");
        return;
    }

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', linePoints);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#4267B2');
    polyline.setAttribute('stroke-width', 2);
    svg.appendChild(polyline);

    // Create Y-axis ticks and labels
    for (let i = 0; i <= 10; i++) {
        const yAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisTick.setAttribute('x1', '0');
        yAxisTick.setAttribute('x2', svgWidth);
        yAxisTick.setAttribute('y1', (i / 10) * svgHeight);
        yAxisTick.setAttribute('y2', (i / 10) * svgHeight);
        yAxisTick.setAttribute('stroke', '#ccc');
        svg.appendChild(yAxisTick);

        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('x', '5');
        yAxisLabel.setAttribute('y', (i / 10) * svgHeight - 5);
        yAxisLabel.setAttribute('fill', '#333');
        yAxisLabel.textContent = Math.round(maxXP * (10- i) / 10);
        svg.appendChild(yAxisLabel);
    }

    // Create X-axis ticks and labels
    const dateStep = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const startDate = new Date(sortedXPData[0].createdAt);
    const endDate = new Date(sortedXPData[sortedXPData.length - 1].createdAt);
    const monthsDifference = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() + 1;
    
    console.log(`Date range: start=${startDate}, end=${endDate}, monthsDifference=${monthsDifference}`);

    for (let i = 0; i <= monthsDifference; i++) {
        const dateForTick = new Date(startDate.getTime() + (i / monthsDifference) * monthsDifference * dateStep);

        const xAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxisTick.setAttribute('x1', (i / monthsDifference) * svgWidth);
        xAxisTick.setAttribute('x2', (i / monthsDifference) * svgWidth);
        xAxisTick.setAttribute('y1', '0');
        xAxisTick.setAttribute('y2', svgHeight);
        xAxisTick.setAttribute('stroke', '#ccc');
        svg.appendChild(xAxisTick);

        const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xAxisLabel.setAttribute('x', (i / monthsDifference) * svgWidth);
        xAxisLabel.setAttribute('y', svgHeight - 5);
        xAxisLabel.setAttribute('fill', '#333');
        xAxisLabel.textContent = formatDate(dateForTick);
        svg.appendChild(xAxisLabel);
    }
}

function aggregateSkillData(skillData) {
    const aggregatedData = {};

    skillData.forEach(skill => {
        const skillType = skill.type;
        const skillAmount = skill.amount;
        
        if (aggregatedData[skillType]) {
            aggregatedData[skillType] += skillAmount;
        } else {
            aggregatedData[skillType] = skillAmount;
        }
    });

    return Object.entries(aggregatedData).map(([type, amount]) => ({ type, amount }));
}

function renderSkillChart(skillData) {
    console.log(skillData);

    const svglvlContainer = document.getElementById('skillsChartContainer');
    const svgWidth = 1000;
    const svgHeight = 700;
    const padding = 40;  // Padding for the axis labels and ticks

    if (isNaN(svgHeight) || isNaN(svgWidth) || svgHeight <= 0 || svgWidth <= 0) {
        console.error(`Invalid dimensions for SVG container: height=${svgHeight}, width=${svgWidth}`);
        return;
    }

    const chartWidth = svgWidth - 2 * padding;
    const chartHeight = svgHeight - 2 * padding;

    svglvlContainer.innerHTML = '';  // Clear any existing content

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);

    const aggregatedSkillData = aggregateSkillData(skillData);

    const numSkills = aggregatedSkillData   .length;
    const barWidth = chartWidth / numSkills;

    if (isNaN(barWidth) || barWidth <= 0) {
        console.error(`Invalid bar width calculated: barWidth=${barWidth}`);
        return;
    }

    aggregatedSkillData.forEach((skill, index) => {
        const skillType = skill.type;
        const skillAmount = skill.amount;
        if (isNaN(skillAmount)) {
            console.error(`Invalid skill amount for ${skillType}: amount=${skillAmount}`);
            return;
        }

        const barHeight = (skillAmount / 100) * chartHeight;
        const xPosition = padding + index * barWidth;
        const yPosition = padding + chartHeight - barHeight;

        if (isNaN(xPosition) || isNaN(yPosition) || isNaN(barHeight)) {
            console.error(`NaN detected in bar chart: x=${xPosition}, y=${yPosition}, width=${barWidth}, height=${barHeight}`);
            return;
        }

        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', xPosition);
        bar.setAttribute('y', yPosition);
        bar.setAttribute('width', barWidth - 10);  // Subtract some value for spacing
        bar.setAttribute('height', barHeight);
        bar.setAttribute('fill', '#4267B2');
        svg.appendChild(bar);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', xPosition + (barWidth - 10) / 2);
        label.setAttribute('y', svgHeight - padding + 5);
        label.setAttribute('fill', '#333');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('transform', `rotate(-70 ${xPosition + (barWidth - 5) / 2} ${svgHeight - padding + 5})`);
        label.setAttribute('font-size', '16px');
        label.textContent = skillType.substring(skillType.indexOf('_') + 1);
        svg.appendChild(label);
    });

    // Create Y-axis ticks and labels
    for (let i = 0; i <= 10; i++) {
        const yAxisTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisTick.setAttribute('x1', padding);
        yAxisTick.setAttribute('x2', svgWidth - padding);
        yAxisTick.setAttribute('y1', padding + (i / 10) * chartHeight);
        yAxisTick.setAttribute('y2', padding + (i / 10) * chartHeight);
        yAxisTick.setAttribute('stroke', '#ccc');
        svg.appendChild(yAxisTick);

        const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yAxisLabel.setAttribute('x', padding - 10);
        yAxisLabel.setAttribute('y', padding + (i / 10) * chartHeight + 5);
        yAxisLabel.setAttribute('text-anchor', 'end');
        yAxisLabel.setAttribute('fill', '#333');
        yAxisLabel.textContent = Math.round(100 * (10 - i) / 10);
        svg.appendChild(yAxisLabel);
    }

    svglvlContainer.appendChild(svg);
}
/* 
const skills = [
    { type: "skill_Abcdef", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_E", amount: 10 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_E", amount: 10 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_E", amount: 10 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_E", amount: 10 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_E", amount: 10 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_E", amount: 10 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_E", amount: 10 },
    { type: "skill_A", amount: 30 },
    { type: "skill_B", amount: 40 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_C", amount: 50 },
    { type: "skill_D", amount: 20 },
    { type: "skill_D", amount: 20 } 
];

renderSkillChart(skills); */

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
