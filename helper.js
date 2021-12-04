// this is where it generates random string for the shortURL
function generateRandomString() {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// to check user by their email
function checkByEmail(email, users) {
  for (let user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
  return null;
}

// checks for returned url by user to make sure its coming from the user who is currebtly logged in
const urlsForUser = function(id, db) {
  let newData = {};
  for (let data in db) {
    if (id === db[data].userID) {
      newData[data] = db[data];
    }
  }
  return newData;
};

module.exports = { generateRandomString, checkByEmail, urlsForUser};