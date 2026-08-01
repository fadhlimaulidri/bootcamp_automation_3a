import axios from 'axios';

const AGENTQ_API_URL = process.env.AGENTQ_API_URL || 'https://backend-app.agentq.id';
const AGENTQ_PROJECT_ID = process.env.AGENTQ_PROJECT_ID;
const AGENTQ_TESTRUN_ID = process.env.AGENTQ_TESTRUN_ID;
const AGENTQ_EMAIL = process.env.AGENTQ_EMAIL;
const AGENTQ_PASSWORD = process.env.AGENTQ_PASSWORD;

let accessToken: string;

async function getAccessToken(): Promise<string> {
  if (accessToken) {
    return accessToken;

  }
  try {
    console.log('🔐 Authenticating to AgentQ...');
    const response = await axios.post(`${AGENTQ_API_URL}/auth/login`, {
      email: AGENTQ_EMAIL,
      password: AGENTQ_PASSWORD
    }, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    accessToken = response.data.access_token;
    console.log('✅ AgentQ authentication successful');
    return accessToken;
  } catch (error: any) {
    console.error('❌ AgentQ authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function exportTestResult(tcId: string, result: any) {
  const token = await getAccessToken();
  const apiUrl = `${AGENTQ_API_URL}/projects/${AGENTQ_PROJECT_ID}/test-runs/${AGENTQ_TESTRUN_ID}/test-results/tcId/${tcId}`;

  try {
    console.log(`📤 Pushing result for TC-${tcId}...`);
    const response = await axios.patch(apiUrl, result, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ TC-${tcId} updated successfully`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`⚠️ TC-${tcId} not found in AgentQ test run. Test case may need to be created first.`);
    } else {
      console.error(`❌ Failed to push TC-${tcId}:`, error.response?.data || error.message);
    }
    // Don't throw error - allow test to continue
  }
}

export async function pushTestResultToAgentQ(testTitle: string, status: string, executionTime: number, errorDetails?: string, testCaseId?: string) {
  if (!AGENTQ_TESTRUN_ID) {
    console.log('⚠️ AGENTQ_TESTRUN_ID not set, skipping AgentQ update');
    return;
  }

  // Extract tcId from test title (format: "123-Test Title" or "TC123-Test Title")
  const match = testTitle.match(/^(\d+|-)/);
  if (!match || match[1] === '-') {
    console.log(`⚠️ No test case ID found in title: "${testTitle}"`);
    return;
  }

  const tcId = match[1];
  const isPassed = status === 'passed';

  await exportTestResult(tcId, {
    status: status,
    actualResult: isPassed ? `Test "${testTitle}" passed successfully` : `Test status: ${status}`,
    executionTime: executionTime / 1000, // convert to seconds
    notes: isPassed ? 'Test completed without errors' : (errorDetails || `Test failed with status: ${status}`)
  });
}
