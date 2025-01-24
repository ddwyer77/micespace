exports.handler = async (event, context) => {
    const { variableName } = event.queryStringParameters;
  
    if (!variableName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing variableName query parameter" }),
      };
    }
  
    const envVariableValue = process.env[variableName];
  
    if (!envVariableValue) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Environment variable ${variableName} not found` }),
      };
    }
  
    return {
      statusCode: 200,
      body: JSON.stringify({ [variableName]: envVariableValue }),
    };
  };