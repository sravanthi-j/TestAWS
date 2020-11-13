const index = require('./exception-alerting');
const expect = require('expect');


var testInputNoMatching = {
    "messageType": "DATA_MESSAGE",
    "owner": "779191825743",
    "logGroup": "hilti-managed-carina/notification/notification",
    "logStream": "main/main/ad279cc44a46421aa3fb9e5df18df4d5",
    "subscriptionFilters": [
        "cwlsf-hilti-managed-carina_notification_notification"
    ],
    "logEvents": [
        {
            "id": "35507037370250737766392802662678519842492362686838933444",
            "timestamp": 1592190622069,
            "message": "[03:10:22 DBG] Execution plan of exception filters (in the following order): [\"None\"]"
        },
        {
            "id": "35507037370250737766392802662678519842492362686838933448",
            "timestamp": 1592190622069,
            "message": "[03:10:22 DBG] Execution plan of exception filters (in the following order): [\"None\"]"
        },
        {
            "id": "35507037370250737766392802662678519842492362686838933444",
            "timestamp": 1592190622069,
            "message": "--- End of inner exception stack trace ---"
        },
        {
            "id": "35507037370250737766392802662678519842492362686838933444",
            "timestamp": 1592190622069,
            "message": "--- End of stack trace from previous location where exception was thrown ---"
        }
    ]
};

 
var testInput = {
    "messageType": "DATA_MESSAGE",
    "owner": "779191825743",
    "logGroup": "hilti-managed-carina/notification/notification",
    "logStream": "main/main/ad279cc44a46421aa3fb9e5df18df4d5",
    "subscriptionFilters": [
        "cwlsf-hilti-managed-carina_notification_notification"
    ],
    "logEvents": [
        {
            "id": "35507037370250737766392802662678519842492362686838933444",
            "timestamp": 1592190622069,
            "message": "This was an exception I guess"
        },
        {
            "id": "35507037370250737766392802662678519842492362686838933448",
            "timestamp": 1592190622069,
            "message": "And another Exception!"
        }
    ]
};

var testInputDuplication = {
    "messageType": "DATA_MESSAGE",
    "owner": "779191825743",
    "logGroup": "hilti-managed-carina/notification/notification",
    "logStream": "main/main/ad279cc44a46421aa3fb9e5df18df4d5",
    "subscriptionFilters": [
        "cwlsf-hilti-managed-carina_notification_notification"
    ],
    "logEvents": [
        {
            "id": "35507037370250737766392802662678519842492362686838933444",
            "timestamp": 1592190622069,
            "message": "This was an exception I guess"
        },
        {
            "id": "35507037370250737766392802662678519842492362686838933448",
            "timestamp": 1592190622069,
            "message": "This was an exception I guess"
        }
    ]
};


test('Does not create message card when exclusions apply', () => {
    
    var messageCard = index.toMessageCard(testInputNoMatching);

    console.log(JSON.stringify(messageCard, null, 2));

    expect(messageCard).toBe(index.NULL_MESSAGE_CARD);
    expect( messageCard.sections ).toHaveLength(0);
});


test('Creates full message card', () => {
    

    var messageCard = index.toMessageCard(testInput);

    console.log(JSON.stringify(messageCard, null, 2));

  
    expect(messageCard.sections).toHaveLength(2);
    expect(messageCard).toMatchSnapshot();
});


test('Ensures messages are distinct', () => {
    

    var messageCard = index.toMessageCard(testInputDuplication);

    console.log(JSON.stringify(messageCard, null, 2));

    expect(messageCard.sections).toHaveLength(1);
    expect(messageCard).toMatchSnapshot();

});