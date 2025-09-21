// netlify/functions/install.js - OAuth Installation Handler
exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  const { code, state } = event.queryStringParameters || {};

  if (!code) {
    // Step 1: Redirect to Lightspeed for authorization
    const clientId = 'c5qsLva63BJKSuC245ClPwhaQdHmNRsc';
    const redirectUri = 'https://splendidrules.netlify.app/.netlify/functions/install';
    const stateParam = Math.random().toString(36).substring(2, 15);
    
    // NOTE: X-Series does not support scopes - removed scope parameter
    const authUrl = `https://secure.retail.lightspeed.app/connect` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${stateParam}`;

    console.log('Debug - Auth URL:', authUrl);

    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': authUrl
      },
      body: ''
    };
  }

  try {
    // Step 2: Exchange code for access token
    const clientId = 'c5qsLva63BJKSuC245ClPwhaQdHmNRsc';
    const clientSecret = 'V0fsbWwN27deW31Cmk53jLy3UoSlPuCW';
    const redirectUri = 'https://splendidrules.netlify.app/.netlify/functions/install'; // Hardcoded

    const tokenResponse = await fetch('https://secure.retail.lightspeed.app/api/1.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Step 3: Get retailer info from the token response
    // X-Series includes domain info in the token response
    let domainPrefix = 'unknown';
    
    if (tokenData.domain_prefix) {
      domainPrefix = tokenData.domain_prefix;
    } else if (tokenData.account_url) {
      // Extract domain from account_url if available
      const urlMatch = tokenData.account_url.match(/https:\/\/([^.]+)\.retail\.lightspeed\.app/);
      if (urlMatch) {
        domainPrefix = urlMatch[1];
      }
    }

    // Step 4: Set up the webhook rules
    const webhookUrl = `https://${event.headers.host}/.netlify/functions/lab-webhook`;
    const apiBase = `https://${domainPrefix}.retail.lightspeed.app/api/2.0`;

    // Create remote rule
    const remoteRuleResponse = await fetch(`${apiBase}/workflows/remote_rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl
      })
    });

    const remoteRule = await remoteRuleResponse.json();
    
    if (!remoteRule.data?.id) {
      throw new Error('Failed to create remote rule');
    }

    // Check for existing rules to avoid conflicts
    const existingRulesResponse = await fetch(`${apiBase}/workflows/rules`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const existingRules = await existingRulesResponse.json();
    const paymentRules = existingRules.data?.filter(rule => rule.event_type === 'sale.ready_for_payment') || [];
    const lineItemRules = existingRules.data?.filter(rule => rule.event_type === 'sale.line_items.added') || [];

    // Determine the best event to use
    const rulesToCreate = [];
    let conflictInfo = [];
    
    if (paymentRules.length === 0) {
      // Ideal - use payment screen trigger
      rulesToCreate.push('sale.ready_for_payment');
    } else if (lineItemRules.length === 0) {
      // Good alternative - trigger when lab items are added
      rulesToCreate.push('sale.line_items.added');
      conflictInfo.push('sale.ready_for_payment is used by other apps');
    } else {
      // Both events are taken - installation should fail with helpful message
      throw new Error(`Cannot install: Both sale.ready_for_payment and sale.line_items.added events are already in use by other apps. Please contact your system administrator to resolve workflow conflicts.`);
    }

    const createdRules = [];
    for (const eventType of rulesToCreate) {
      const ruleResponse = await fetch(`${apiBase}/workflows/rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventType,
          remote_rule_id: remoteRule.data.id
        })
      });

      const rule = await ruleResponse.json();
      if (rule.data?.id) {
        createdRules.push(eventType);
      }
    }

    // Success page
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Splendid Film Lab - Installation Complete</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 20px 0; }
          .info { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 15px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 15px 0; }
          h1 { color: #155724; }
          ul { margin: 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <h1>🎉 Splendid Film Lab - Installation Complete!</h1>
        
        <div class="success">
          <strong>Success!</strong> Your due date popup system has been installed and configured.
        </div>

        <div class="info">
          <h3>📋 What was set up:</h3>
          <ul>
            <li>Webhook endpoint: <code>${webhookUrl}</code></li>
            <li>Remote rule created: ${remoteRule.data.id}</li>
            <li>Active on events: ${createdRules.join(', ')}</li>
            <li>Store: ${domainPrefix}.retail.lightspeed.app</li>
          </ul>
          ${conflictInfo.length > 0 ? `
          <p><strong>Note:</strong> ${conflictInfo.join(', ')} - using alternative trigger for compatibility.</p>
          ` : ''}
        </div>

        <div class="info">
          <h3>🧪 How to test:</h3>
          <ol>
            <li>Open your Lightspeed POS</li>
            <li>Add a lab service product to a sale (e.g., C41 develop & scan)</li>
            ${createdRules.includes('sale.ready_for_payment') ? '<li>Click to go to payment screen</li>' : 
              createdRules.includes('sale.line_items.added') ? '<li>The popup should appear immediately after adding the lab service</li>' :
              '<li>Add or change the customer on the sale</li>'}
            <li>You should see: "📸 Splendid Film Lab - Set Due Date" popup</li>
            <li>Select your turnaround time and the due date will be automatically calculated and added to the sale notes</li>
          </ol>
        </div>

        <div class="info">
          <h3>📞 Support:</h3>
          <p>If you need help or want to modify the turnaround calculations, the webhook code is hosted on Netlify and can be updated as needed.</p>
        </div>

        <p><strong>You can now close this window and return to your Lightspeed POS.</strong></p>
      </body>
      </html>
    `;

    return {
      statusCode: 200,
      headers,
      body: successHtml
    };

  } catch (error) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .error { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; }
          h1 { color: #721c24; }
        </style>
      </head>
      <body>
        <h1>❌ Installation Error</h1>
        <div class="error">
          <strong>Sorry!</strong> There was an error during installation:
          <br><br>
          <code>${error.message}</code>
          <br><br>
          Please try again or contact support if the issue persists.
        </div>
      </body>
      </html>
    `;

    return {
      statusCode: 500,
      headers,
      body: errorHtml
    };
  }
};
