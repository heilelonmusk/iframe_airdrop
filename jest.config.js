module.exports = {
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  testEnvironment: "node",
  verbose: true,
  setupFilesAfterEnv: ["./jest.setup.js"] // Se serve un setup prima dei test
};