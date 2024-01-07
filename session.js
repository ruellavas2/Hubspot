const axios = require('axios'); 

async function fetchEventData() {
    const url = "https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=79721660d7b07abfff20d0c92332";
    const response = await axios.get(url);
    return response.data.events;
}

async function sendResult(result) {
    const resultUrl = "https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=79721660d7b07abfff20d0c92332";
    try {
        const response = await axios.post(resultUrl, result, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Successfully sent data!");
        return response.status;
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Server Response:', error.response.data);
            return error.response.status;
        }
        return -1; 
    }
}

async function generateSessions() {
    const events = await fetchEventData();

    // Sort events by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    const sessionsByUser = {};

    events.forEach(event => {
        const { visitorId, timestamp, url } = event;

        if (!sessionsByUser[visitorId]) {
            sessionsByUser[visitorId] = [{
                duration: 0,
                pages: [url],
                startTime: timestamp
            }];
        } else {
            const lastSession = sessionsByUser[visitorId][sessionsByUser[visitorId].length - 1];
            const lastEventTimestamp = lastSession.pages[lastSession.pages.length - 1];

            if (timestamp - lastEventTimestamp <= 10 * 60 * 1000) {
                lastSession.pages.push(url);
            } else {
                sessionsByUser[visitorId].push({
                    duration: 0,
                    pages: [url],
                    startTime: timestamp
                });
            }
        }
    });

    // Calculate session durations
    for (const visitorId in sessionsByUser) {
        sessionsByUser[visitorId].forEach(session => {
            session.duration = session.pages[session.pages.length - 1] - session.pages[0];
        });
    }

    const result = { sessionsByUser };
    
    console.log(JSON.stringify(result, null, 2));

    return sendResult(result);
}

generateSessions().then(status => {
    if (status == 200) {
        console.log("Successfully processed and sent data!");
    } else {
        console.log("There was an issue with processing or sending the data.");
    }
});
