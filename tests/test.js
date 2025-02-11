const logQuestion = require('./logQuestion');

async function runTests() {
    const testQuestion = "What is Helon?";
    const response = await logQuestion(testQuestion);
    
    if (response.answer) {
        console.log("✅ Test Passed: Answer Received.");
    } else {
        console.error("❌ Test Failed: No answer received.");
    }
}

runTests();