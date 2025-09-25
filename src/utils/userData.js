// src/utils/userData.js
export const users = [
    { pin: '1', childName: 'Richie', childAge: '5' },
    { pin: '2', childName: 'CJ', childAge: '7' },
    { pin: '123', childName: 'Alex', childAge: '8' },
    { pin: '1234', childName: 'John', childAge: '9' },
    { pin: '12345', childName: 'arya', childAge: '6' },

    // Add more users here
];

export const getUserDataByPin = (pin) => {
    return users.find(user => user.pin === pin);
};