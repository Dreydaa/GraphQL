console.log("ici");

const loginSection = document.querySelectorAll(".loginSection");
const profileSection = document.getElementById("profileSection")/* [0] */;
const userInput = document.getElementById("userInput");
const passInput = document.getElementById("passInput");
const signInBtn = document.querySelectorAll(".signInBtn");
const loginError = document.getElementById("loginError");
const displayUsername = document.getElementById("displayUsername")/* [0] */;
const userDataContainer = document.getElementById("userData")/* [0] */;
const signOutBtn = document.querySelectorAll("signOutBtn");

let jwtToken = null;

async function authentificateUser() {
    console.log("authUser");
    const username = userInput.value;
    const password = passInput.value;
    const base64Credentials = btoa(`${username}:${password}`);

    try {
        console.log("Sending login request", response);
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

        const data = await response.json();
        jwtToken = data.token;
        console.log("login successful:", jwtToken);

        const user = await fetchUserData(jwtToken);
        const xpData = await fetchXPData(jwtToken);
        const skillData = await fetchSkillData(jwtToken);

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
    console.log("fetch USER data with token:", token);
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
    console.log("fetch XP DATA");
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
    console.log("fetch SKILL DATA");
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
    console.log("RENDER XPXHART");
    const filteredTransactions = transactions.filter(txn => txn.path.includes("/div-01") && !txn.path.includes("piscine-js/"));
    const xpData = filteredTransactions.filter(txn => txn.type === "xp");
    const sortedXPData = xpData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const svgContainer = document.getElementById('xpChartContainer');
    const svgWidth = svgContainer.clientWidth;
    const svgHeight = svgContainer.clientHeight;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);

    const accumulatedXP = [];
    let totalXP = 0;
    sortedXPData.forEach((entry, index) => {
        totalXP += entry.amount;
        accumulatedXP.push({ x: index, y: totalXP });
    });

    const maxXP = Math.max(...accumulatedXP.map(d => d.y));
    const linePoints = accumulatedXP.map(d => `${(d.x / (sortedXPData.length - 1)) * svgWidth},${svgHeight - (d.y / maxXP) * svgHeight}`).join(' ');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', linePoints);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#4267B2');
    polyline.setAttribute('stroke-width', 2);

    svg.appendChild(polyline);
    svgContainer.appendChild(svg);
}

function renderSkillPieChart(skills) {
    console.log("RENDER SKILL PIE CHARTS");
    const svgContainer = document.getElementById('skillsChartContainer');
    const svgWidth = svgContainer.clientWidth;
    const svgHeight = svgContainer.clientHeight;
    const radius = Math.min(svgWidth, svgHeight) / 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${svgWidth / 2},${svgHeight / 2})`);

    const totalAmount = skills.reduce((acc, skill) => acc + skill.amount, 0);
    let startAngle = 0;

    skills.forEach(skill => {
        const sliceAngle = (skill.amount / totalAmount) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const x1 = radius * Math.cos(startAngle);
        const y1 = radius * Math.sin(startAngle);
        const x2 = radius * Math.cos(endAngle);
        const y2 = radius * Math.sin(endAngle);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L 0 0`
        ].join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', getRandomColor());

        const labelX = (radius / 2) * Math.cos(startAngle + sliceAngle / 2);
        const labelY = (radius / 2) * Math.sin(startAngle + sliceAngle / 2);

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
    console.log("get random color");
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function logoutUser() {
    console.log("logout user");
    jwtToken = null;
    userInput.value = '';
    passInput.value = '';
    loginSection.style.display = 'block';
    profileSection.style.display = 'none';

    document.getElementById('xpChartContainer').innerHTML = '';
    document.getElementById('skillsChartContainer').innerHTML = '';
}
