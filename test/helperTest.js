const { assert } = require('chai');

const { checkByEmail, urlsForUser } = require('../helper');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDb = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  m12345: {
    longURL: "https://www.telus.com",
    userID: "m123"
  }
};

// test case for checking valid email
describe('checkByEmail', function() {
  it('should return a user with valid email', function() {
    const user = checkByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput);
  });
});

// test case for checking invalid email
describe('checkByEmail', function() {
  it('should return undefined', function() {
    const user = checkByEmail("abc@abc.com", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});

// test case for checking urls attached with specific user_id
describe('urlsForUser', function() {
  it('should return a url attached to this user_id', function() {
    const url = urlsForUser("m123", testUrlDb);
    const expectedOutput = {
      m12345: {
        longURL: "https://www.telus.com",
        userID: "m123"
      }
    };
    assert.deepEqual(url, expectedOutput);
  });

});