var ChatGPT_via_REST = Class.create();
ChatGPT_via_REST.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    processConversation: function() {
        var conversationData = this.getParameter('sysparm_conversation');
        
        // Log received data
        gs.info('Received conversation data: ' + conversationData);
        
        // Parse the JSON safely
        var conversationHistory;
        try {
            conversationHistory = JSON.parse(conversationData);
            gs.info('Parsed conversation history: ' + JSON.stringify(conversationHistory));
        } catch (e) {
            gs.error('Failed to parse conversation JSON: ' + e.getMessage());
            return 'Error: Invalid JSON format.';
        }

        var restMessage = new sn_ws.RESTMessageV2('Openai_REST_Message', 'Default POST');

        // Set the request body to include the conversation history and model
        var requestBody = {};
        requestBody.model = "gpt-4o";  // Specify your model
        requestBody.messages = conversationHistory; // All messages in the conversation

        // Set the formatted JSON as the REST message body
        restMessage.setRequestBody(JSON.stringify(requestBody));
        restMessage.setRequestHeader("Content-Type", "application/json");
        
        try {
            var response = restMessage.execute();
            var responseBody = JSON.parse(response.getBody());
            gs.info('Received response: ' + JSON.stringify(responseBody));

            // Instead of returning botResponse, return the entire responseBody
            return JSON.stringify(responseBody);
        } catch (ex) {
            // Detailed error logging
            gs.error('Error during API call: ' + ex.getMessage());
            return '{"error": "An error occurred during the API call. Check logs for details."}';
        }
    }
});