const openai = require('openai');
const dotenv = require('dotenv');
const Table = require('pyairtable').Table;
const request = require('request');

dotenv.config();
openai.api_key = process.env.OPENAI_API_KEY;
const rapidApiKey = process.env.X_RAPIDAPI_KEY;
const smartLightApiKey = process.env.SMART_LIGHT_API_KEY;

const airtableApiKey = process.env.AIRTABLE_API_KEY;
const table = new Table(airtableApiKey, "appHojHIE4y8gVBgc", "tbldUUKZFngr78ogg");

const functionDescriptions = [
  {
    "name": "get_stock_movers",
    "description": "Get the stocks that has biggest price/volume moves, e.g. actives, gainers, losers, etc.",
    "parameters": {
      "type": "object",
      "properties": {},
    }
  },
  {
    "name": "get_stock_news",
    "description": "Get the latest news for a stock",
    "parameters": {
      "type": "object",
      "properties": {
        "performanceId": {
          "type": "string",
          "description": "id of the stock, which is referred as performanceID in the API"
        },
      },
      "required": ["performanceId"]
    }
  },
  {
    "name": "add_stock_news_airtable",
    "description": "Add the stock, news summary & price move to Airtable",
    "parameters": {
      "type": "object",
      "properties": {
        "stock": {
          "type": "string",
          "description": "stock ticker"
        },
        "move": {
          "type": "string",
          "description": "price move in %"
        },
        "news_summary": {
          "type": "string",
          "description": "news summary of the stock"
        },
      }
    }
  },
  {
    "name": "control_light",
    "description": "Turn on/off the light",
    "parameters": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "description": "the state of the light, should be on or off",
          "enum": ["on", "off"]
        }
      }
    }
  }
];

function addStockNewsAirtable(stock, move, newsSummary) {
  table.create({"stock": stock, "move%": move, "news_summary": newsSummary});
}

function getStockNews(performanceId) {
  const url = "https://morning-star.p.rapidapi.com/news/list";

  const querystring = {"performanceId": performanceId};

  const headers = {
    "X-RapidAPI-Key": rapidApiKey,
    "X-RapidAPI-Host": "morning-star.p.rapidapi.com"
  };

  return new Promise((resolve, reject) => {
    request.get({url: url, headers: headers, qs: querystring}, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        const shortNewsList = JSON.parse(body).slice(0, 5);
        resolve(shortNewsList);
      }
    });
  });
}

function getStockMovers() {
  const url = "https://morning-star.p.rapidapi.com/market/v2/get-movers";

  const headers = {
    "X-RapidAPI-Key": rapidApiKey,
    "X-RapidAPI-Host": "morning-star.p.rapidapi.com"
  };

  return new Promise((resolve, reject) => {
    request.get({url: url, headers: headers}, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        const stockMovers = JSON.parse(body);
        resolve(stockMovers);
      }
    });
  });
}

function controlLight(state) {
  const token = smartLightApiKey;

  const headers = {
    "Authorization": `Bearer ${token}`,
  };

  const payload = {
    "power": state,
  };

  const options = {
    url: 'https://api.lifx.com/v1/lights/all/state',
    headers: headers,
    form: payload
  };

  return new Promise((resolve, reject) => {
    request.put(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        const lightState = JSON.parse(body);
        resolve(lightState);
      }
    });
  });
}

function functionCall(aiResponse) {
  const functionCall = aiResponse.choices[0].message.function_call;
  const functionName = functionCall.name;
  const arguments = functionCall.arguments;
  if (functionName === "get_stock_movers") {
    return getStockMovers();
  } else if (functionName === "get_stock_news") {
    const performanceId = JSON.parse(arguments).performanceId;
    return getStockNews(performanceId);
  } else if (functionName === "add_stock_news_airtable") {
    const stock = JSON.parse(arguments).stock;
    const newsSummary = JSON.parse(arguments).news_summary;
    const move = JSON.parse(arguments).move;
    return addStockNewsAirtable(stock, move, newsSummary);
  } else if (functionName === "control_light") {
    const state = JSON.parse(arguments).state;
    return controlLight(state);
  } else {
    return;
  }
}

async function askFunctionCalling(query) {
  const messages = [{"role": "user", "content": query}];

  //initial query 
  const response = await openai.Completion.create({
    engine: "davinci",
    prompt: "",
    maxTokens: 1024,
    n: 1,
    stop: "\n",
    temperature: 0.5,
    presencePenalty: 0,
    frequencyPenalty: 0,
    bestOf: 1,
    functionDescriptions: functionDescriptions,
    messages: messages,
    functionCall: "auto"
  });


  //if initial query is a function call, then call the function repeatedly until the response is not a function call
  while (response.choices[0].finish_reason === "function_call") {
    const functionResponse = functionCall(response);
    messages.push({
      "role": "function",
      "name": response.choices[0].message.function_call.name,
      "content": JSON.stringify(functionResponse)
    });

    response = await openai.Completion.create({
      engine: "davinci",
      prompt: "",
      maxTokens: 1024,
      n: 1,
      stop: "\n",
      temperature: 0.5,
      presencePenalty: 0,
      frequencyPenalty: 0,
      bestOf: 1,
      functionDescriptions: functionDescriptions,
      messages: messages,
      functionCall: "auto"
    });

    console.log("response: ", response);
  }
  else {
    console.log(response);
  }
}

const userQuery = "Turn on the light";

askFunctionCalling(userQuery);