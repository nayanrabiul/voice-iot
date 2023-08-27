import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const HandleActionFromUserQuery = (query: string) => {
    return FunciotnTrigeerFromQuery(query);
};

const FunciotnTrigeerFromQuery = async (query: string) => {
    //each possible function do a specific task
    const possibleFuncitonsAiToUse = [
        {
            name: "turn_on_light",
            description:
                "chose  blue, red or green or unknow light/bulb color ",
            parameters: {
                type: "object",
                properties: {
                    color: {
                        type: "string",
                        description:
                            "chose  blue, red or green or unknow light/bulb color ",
                        enum: ["red", "green", "blue", "unknown"],
                    },
                },
            },
        },
        {
            name: "turn_off_light",
            description: "turn off the light",
            parameters: {
                type: "object",
                properties: {
                    color: {
                        type: "string",
                        description:
                            "chose  blue, red or green or unknow light/bulb color ",
                        enum: ["red", "green", "blue", "unknown"],
                    },
                },
            },
        },
    ];

    //first get the general response from the chatgpt, then check if the response is a function call
    //if it is a function call then trigger the right function
    //or return the content of the response
    let messages = [{ role: "user", content: query }];
    console.log("start chating");
    let response = null;
    try {
        response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0613", // work on gpt-4-0613 and gpt-3.5-turbo-0613
            messages: messages,
            functions: possibleFuncitonsAiToUse,
            function_call: "auto",
        });
    } catch (e) {
        return {
            type: "error",
            content: e.message,
        };
    }

    //response can be a function call or a content
    //if content then return the content
    let content = response.choices[0].message.content
        ? response.choices[0].message.content
        : null;
    let function_call = response.choices[0].message.function_call
        ? response.choices[0].message.function_call
        : null;

    if (!!content && !function_call) {
        return {
            type: "content",
            content,
        };
    } else if (!content && !!function_call) {
        let functionName = function_call.name;
        let arguments_ = function_call.arguments;

        //handle the function based on the name
        switch (functionName) {
            case "turn_on_light":
                return turn_on_light(JSON.parse(arguments_).color ?? "unknown");

            case "turn_off_light":
                return turn_off_light(
                    JSON.parse(arguments_).color ?? "unknown"
                );

            default:
                return {
                    type: "color",
                    color: "unknown",
                };
        }
    }
};

let turn_on_light = (color) => {
    return {
        type: "turn_on_light",
        color,
    };
};

let turn_off_light = (color) => {
    return {
        type: "turn_off_light",
        color: color,
    };
};