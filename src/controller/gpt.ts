import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const ActionFromUserQuery = (res, query: string) => {
    //define function descriptions for the chatgpt
    const functionDescriptions = [
        {
            name: "control_light",
            description:
                "Make green, blue, or red light turn on or off one at a time",
            parameters: {
                type: "object",
                properties: {
                    color: {
                        type: "string",
                        description:
                            "the color of the light, should be red or green or blue",
                        enum: ["red", "green", "blue"],
                    },
                },
            },
        },
    ];

    //this function is used to control the light
    function controlLight(color) {
        if (color === "red") {
            res.status(200).json({ color: "red" });
        } else if (color === "green") {
            res.status(200).json({ color: "green" });
        } else if (color === "blue") {
            res.status(200).json({ color: "blue" });
        }
    }

    //this function is used to call the function from the chatgpt response
    function functionCall(aiResponse) {
        const functionCall = aiResponse.choices[0].message.function_call;
        const functionName = functionCall.name;
        const arguments_ = functionCall.arguments;
        if (functionName === "control_light") {
            const state = JSON.parse(arguments_).state;
            return controlLight(state);
        } else {
            return;
        }
    }

    //this function is used to ask the chatgpt to call the function
    let messages = [{ role: "user", content: query }];
    async function askToCallFunction(query) {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0613", // work on gpt-4-0613 and gpt-3.5-turbo-0613
            messages: messages,
            functions: functionDescriptions,
            function_call: "auto",
        });

        console.log(response);

        return {
            color: "red  ",
        };

        // while (response.choices[0].finish_reason === "function_call") {
        //     const functionResponse = functionCall(response);
        //     messages.push({
        //         role: "function",
        //         name: response.choices[0].message.function_call.name,
        //         content: JSON.stringify(functionResponse),
        //     });

        //     let response = await openai.Completion.create({
        //         engine: "davinci",
        //         prompt: "",
        //         maxTokens: 1024,
        //         n: 1,
        //         stop: "\n",
        //         temperature: 0.5,
        //         presencePenalty: 0,
        //         frequencyPenalty: 0,
        //         bestOf: 1,
        //         functionDescriptions: functionDescriptions,
        //         messages: messages,
        //         functionCall: "auto",
        //     });

        //     console.log("response: ", response);
        // }
    }

    askToCallFunction(query);
};
