var conversationHistory = [];
var totalTokenCount = 0;
var responseTimes = [];

// Function to initialize chat with a default bot message
function initializeChat() {
    var conversationDisplay = document.getElementById('conversation_display');
    var messageBubble = document.createElement('div');
    messageBubble.className = 'bot-message-bubble';
    messageBubble.textContent = "Hello! How can I assist you today?";
    conversationDisplay.appendChild(messageBubble);
    conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
}

// Add event listener for Enter key to send message
document.getElementById('user_input').addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

function addUserMessage(content) {
    var conversationDisplay = document.getElementById('conversation_display');
    var messageBubble = document.createElement('div');
    messageBubble.className = 'user-message-bubble';
    messageBubble.textContent = 'You: ' + content;
    conversationDisplay.appendChild(messageBubble);

    if (conversationDisplay.children.length > 10) {
        conversationDisplay.removeChild(conversationDisplay.children[0]);
    }

    conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
}

function addTypingIndicator() {
    var conversationDisplay = document.getElementById('conversation_display');
    var typingBubble = document.createElement('div');
    typingBubble.id = 'typing-indicator'; 
    typingBubble.className = 'bot-message-bubble';
    typingBubble.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    conversationDisplay.appendChild(typingBubble);

    conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
}

function removeTypingIndicator() {
    var typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function addBotMessage(rawContent) {
    removeTypingIndicator(); 
    var formattedContent = formatBotMessage(rawContent);
    var conversationDisplay = document.getElementById('conversation_display');
    var messageBubble = document.createElement('div');
    messageBubble.className = 'bot-message-bubble';
    messageBubble.innerHTML = formattedContent;
    conversationDisplay.appendChild(messageBubble);

    if (conversationDisplay.children.length > 10) {
        conversationDisplay.removeChild(conversationDisplay.children[0]);
    }

    conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
}

function formatBotMessage(content) {
    let formattedContent = content;

    formattedContent = formattedContent.replace(/(\n|^)(\s*[*\-•]\s+)(.*?)(?=\n|$)/g, '<ul><li>$3</li></ul>');
    formattedContent = formattedContent.replace(/(\n|^)(\d+\.)\s+(.*?)(?=\n|$)/g, '<ol><li>$3</li></ol>');

    formattedContent = formattedContent.replace(/<\/ul>(\s*)<ul>/g, '$1');
    formattedContent = formattedContent.replace(/<\/ol>(\s*)<ol>/g, '$1');

    return formattedContent;
}

function formatJson(json) {
    const rawJsonString = JSON.stringify(json, (key, value) => {
        if (Array.isArray(value)) {
            return JSON.stringify(value, null, 2);
        }
        return value;
    }, 2);

    let formattedString = rawJsonString.replace(/\\n/g, '\n')
        .replace(/,\n/g, ',\n')
        .replace(/(\*|-|•)\s/g, '\n$1 ')
        .replace(/(\\u2022|\\u2023|\\u25E6|\\u2043|\\u2219)/g, '\n\u2022');
        
    return formattedString;
}

function updateEstimatedCost(totalTokens) {
    var costPerMillionTokens = 9.97 / 1000000; // Cost per token based on $10 per 1M tokens
    var estimatedCost = totalTokens * costPerMillionTokens;

    // Convert estimated cost to string with enough precision
    var costString = estimatedCost.toFixed(12); 

    // Trim unnecessary zeros and ensure a max of 7 digits after the decimal
    costString = costString.replace(/([0]+)$/, ""); // Strip trailing zeroes
    var decimalIndex = costString.indexOf('.');
    
    // Ensure the length does not exceed 7 decimal places
    if (decimalIndex !== -1 && costString.length - decimalIndex - 1 > 7) {
        costString = costString.substr(0, decimalIndex + 8);
    }

    // Update the cost in the UI
    document.getElementById('estimated_cost').innerText = `$${costString}`;
}

function sendMessage() {
    var userInput = document.getElementById('user_input').value;
    document.getElementById('user_input').value = ""; 

    var submitButton = document.getElementById('submit_button');
    var buttonSpinner = submitButton.querySelector('.spinner');
    var buttonText = document.getElementById('button_text');
    var startTime = Date.now();

    if (userInput.trim() === "") {
        alert("Please enter a message.");
        return;
    }

    buttonSpinner.style.display = 'block';
    submitButton.style.backgroundColor = '#B0B0B0'; 
    buttonText.textContent = "...talking to ChatGPT...";

    addUserMessage(userInput);
    addTypingIndicator(); 
    conversationHistory.push({ role: "user", content: userInput });

    var ga = new GlideAjax('ChatGPT_via_REST');
    ga.addParam('sysparm_name', 'processConversation');
    ga.addParam('sysparm_conversation', JSON.stringify(conversationHistory));

    ga.getXMLAnswer(function(response) {
        console.log("Response from server: ", response);
        
        var fullJsonResponse;
        var botResponse = "No response from server.";

        try {
            fullJsonResponse = JSON.parse(response);
            botResponse = fullJsonResponse.choices[0].message.content || botResponse;

            if (fullJsonResponse.usage && fullJsonResponse.usage.total_tokens) {
                totalTokenCount += fullJsonResponse.usage.total_tokens;
                document.getElementById('token_count').innerText = totalTokenCount;
                updateEstimatedCost(totalTokenCount); // Update estimated cost
            }

            if (fullJsonResponse.created) {
                var endTime = Date.now();
                var responseTimeInSeconds = (endTime - startTime) / 1000;
                responseTimes.push(responseTimeInSeconds);
                let sum = responseTimes.reduce((a, b) => a + b, 0);
                let avgResponseTime = (sum / responseTimes.length).toFixed(2);
                document.getElementById('avg_response_time').innerText = avgResponseTime;
            }
        } catch (jsonError) {
            console.error("JSON parse error: ", jsonError);
            if (response.trim()) {
                botResponse = response.trim();
            }
        }

        addBotMessage(botResponse);
        conversationHistory.push({ role: "assistant", content: botResponse });

        document.getElementById('full_json_display').innerText = formatJson(fullJsonResponse);

        buttonSpinner.style.display = 'none';
        submitButton.style.backgroundColor = '#4CAF50';
        buttonText.textContent = "Chat with GPT!";
    });
}

// Initialize the chat interface with the default bot message
window.onload = initializeChat;