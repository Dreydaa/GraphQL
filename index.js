async function handleLogin() {
    const loginIdentifierInput = document.getElementById('loginIdentifier');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    const loginIdentifier = loginIdentifierInput.value;
    const password = passwordInput.value;

    if (!loginIdentifier || !password) {
        messageDiv.textContent = 'Both fields are required';
        return;
    }

    const credentials = btoa(`${loginIdentifier}:${password}`);
    const signinEndpoint = 'https://zone01normandie.org/api/auth/signin';

    try {
        const response = await fetch(signinEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.token) {
            localStorage.setItem('token', data.token);
            messageDiv.textContent = 'Login successful';
            fetchData();
        } else {
            messageDiv.textContent = 'Invalid username, email, or password';
        }
    } catch (error) {
        messageDiv.textContent = `Error: ${error.message}`;
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    document.getElementById('message').textContent = 'Logged out successfully';
    document.getElementById('dataContainer').innerHTML = '';
    document.getElementById('chartsContainer').innerHTML = '';
}

function getToken() {
    return localStorage.getItem('token');
}

async function fetchData() {
    const token = getToken();
    if (!token) {
        console.log('No token found');
        return;
    }

    try {
        const response = await fetch('https://zone01normandie.org/api/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: `{ users { id username xp skills { name level } } }` })
        });

        const result = await response.json();
        const users = result.data.users;
        displayData(users);
        drawCharts(users);
    } catch (error) {
        console.error('Error:', error);
    }
}

function displayData(users) {
    const dataContainer = document.getElementById('dataContainer');
    dataContainer.innerHTML = JSON.stringify(users, null, 2);
}

function drawCharts(users) {
    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML = '';

    // Example: Draw XP Chart
    const svgXp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgXp.setAttribute('width', 600);
    svgXp.setAttribute('height', 300);

    let maxXp = 0;
    users.forEach(user => { if (user.xp > maxXp) maxXp = user.xp; });

    users.forEach((user, index) => {
        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', 30 * index);
        bar.setAttribute('y', 300 - (user.xp / maxXp * 300));
        bar.setAttribute('width', 20);
        bar.setAttribute('height', user.xp / maxXp * 300);
        bar.setAttribute('fill', 'blue');
        svgXp.appendChild(bar);
    });

    chartsContainer.appendChild(svgXp);

    // Example: Draw Skills Chart
    const svgSkills = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgSkills.setAttribute('width', 600);
    svgSkills.setAttribute('height', 300);

    users.forEach((user, userIndex) => {
        user.skills.forEach((skill, skillIndex) => {
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', 30 * skillIndex + userIndex * 200); // Adjust x position for better spacing
            bar.setAttribute('y', 300 - (skill.level * 30));
            bar.setAttribute('width', 20);
            bar.setAttribute('height', skill.level * 30);
            bar.setAttribute('fill', 'green');
            svgSkills.appendChild(bar);
        });
    });

    chartsContainer.appendChild(svgSkills);
}
