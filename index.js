const loginIdentifierInput = document.getElementById("loginIdentifer");
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');


async function handleLogin() {
    
    if (!loginIdentifer || !password) {
        messageDiv.textContent('both fields are required')
        return;
    }
    
    const loginIdentifer = loginIdentifierInput.value;
    const password = passwordInput.value;

    const credentials = btoa(`${loginIdentifer}:${password}`);
    const signinEndPoint = 'https://zone01normandie.org/api/auth/signin';

   try {
    const response = await fetch(signinEndPoint, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (data.token) {
        localStorage.setItem('token', data.token);
        messageDiv.textContent = 'Login successful'
        fetchData();
    }else {
        messageDiv.textContent = 'Invalid username, email or password';
    }
   } catch (error) {
    messageDiv.textContent = `Error: $ {error.message}`;
   }
}

async function handleLogout() {
    localStorage.removeItem('token');
    document.getElementById('message').textContent = 'Logged out successfully';
    document.getElementById('dataContainer').innerHTML = '';
    document.getElementById('ChartsContainer').innerHTML = '';
} 


function getToken() {
    return localStorage.getItem('token');
}

async function fetchData() {
    const token = getToken();
    console.log('token', token);
    if(!token) {
        console.log('No token found');
        return;
    }

    try {
        const response = await fetch('https://zone01normandie.org/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                {
                    user {
                        id
                        attrs
                        transaction {
                            type
                        amount
                        path
                        createdAt
                        }
                    }
                }`
            })
        });

        const result = await response.json();
        const users = result.data.users;
        displayData(users);
        drawCharts(users);
    } catch(error) {
        console.error('Error:', error);
    }
}

function displayData(users) {
    const dataContainer = document.getElementById('dataContainer');
    dataContainer.innerHTML = JSON.stringify(users, null, 2);
}

function drawCharts(users) {
    const ChartsContainer = document.getElementById('chartsContainer');
    ChartsContainer.innerHTML = '';

    const svgXp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgXp.setAttribute('width', '600');
    svgXp.setAttribute('height', '300');

    let maxXp = 0;
    users.forEach(user => { if (user.xp > maxXp) maxXp = user.xp;});

    users.forEach((user, index) => {
        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', 30 * index);
        bar.setAttribute('y', 300 - (user.xp / maxXp * 300));
        bar.setAttribute('width', 20);
        bar.setAttribute('height', user.xp / maxXp * 300);
        bar.setAttribute('fill', 'blue');
        svgXp.appendChild(bar);
    });

    ChartsContainer.appendChild(svgXp);

    const svgSkills = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgSkills.setAttribute('width', 600);
    svgSkills.setAttribute('height', 300);

    users.forEach((user, userIndex) => {
        user.skills.forEach((skill, skillIndex) => {
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', 30 * skillIndex);
            bar.setAttribute('y', 300 - (skill.level / 5 * 300));
            bar.setAttribute('width', 20);
            bar.setAttribute('height', skill.level / 5 * 300);
            bar.setAttribute('fill', 'red');
            svgSkills.appendChild(bar);
        });
    });

    ChartsContainer.appendChild(svgSkills);

}

async function makeGraphQLQuery(query) {
    const token = getToken();
    if (!token) {
        console.log('No token found: makeGraphQLQuery');
        return;
    }

    try {
        const response = await fetch('https://zone01normandie.org/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({query: query})
        });

        const data = await response.json();
        console.log('GraphQL data:', data)
    } catch (error) {
        console.error('Error:', error);
    }
}