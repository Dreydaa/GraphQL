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
    console.log("Rendering XP chart with transactions:", transactions);

    const filteredTransactions = transactions.filter(txn => txn.path.includes("/div-01") && !txn.path.includes("piscine-js/"));
    const xpData = filteredTransactions.filter(txn => txn.type === "xp");
    const sortedXPData = xpData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    console.log("Filtered and sorted XP data:", sortedXPData);

    const svgContainer = document.getElementById('xpChartContainer');
    const svgWidth = svgContainer.clientWidth || svgContainer.offsetWidth;
    const svgHeight = svgContainer.clientHeight || svgContainer.offsetHeight;
    console.log(`SVG container dimensions: width=${svgWidth}, height=${svgHeight}`);

    svgContainer.innerHTML = '';  // Clear any existing content

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
        yAxisLabel.textContent = Math.round(maxXP * (10 - i) / 10);
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

function formatDate(date) {
    const options = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}


function renderSkillPieChart(skills) {
    console.log("Rendering skill pie chart with skills:", skills);
    const svgContainer = document.getElementById('skillsChartContainer');
    const svgWidth = svgContainer.clientWidth || svgContainer.offsetWidth;
    const svgHeight = svgContainer.clientHeight || svgContainer.offsetHeight;
    const radius = Math.min(svgWidth, svgHeight) / 2;

    console.log(`SVG container dimensions: width=${svgWidth}, height=${svgHeight}`);

    svgContainer.innerHTML = '';  // Clear any existing content

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${svgWidth / 2},${svgHeight / 2})`);

    const totalAmount = skills.reduce((acc, skill) => acc + skill.amount, 0);
    console.log("Total skill amount:", totalAmount);

    if (totalAmount === 0) {
        console.error("Total skill amount is 0, cannot render chart.");
        return;
    }

    let startAngle = 0;

    skills.forEach(skill => {
        const sliceAngle = (skill.amount / totalAmount) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const x1 = (radius * Math.cos(startAngle)).toFixed(2);
        const y1 = (radius * Math.sin(startAngle)).toFixed(2);
        const x2 = (radius * Math.cos(endAngle)).toFixed(2);
        const y2 = (radius * Math.sin(endAngle)).toFixed(2);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L 0 0`
        ].join(' ');

        console.log("Path data for slice:", pathData);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', getRandomColor());

        const labelX = (radius / 2 * Math.cos(startAngle + sliceAngle / 2)).toFixed(2);
        const labelY = (radius / 2 * Math.sin(startAngle + sliceAngle / 2)).toFixed(2);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#fff');
        text.textContent = skill.type.split('_')[1];

        g.appendChild(path);
        g.appendChild(text);

        startAngle += sliceAngle;
    });

    svg.appendChild(g);
    svgContainer.appendChild(svg);
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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
