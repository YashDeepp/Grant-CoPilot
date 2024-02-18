import { Router } from "express";
import dotnet from 'dotenv'
import user from '../helpers/user.js'
import jwt from 'jsonwebtoken'
import chat from "../helpers/chat.js";
import OpenAI from "openai";
import { db } from "../db/connection.js";
import collections from "../db/collections.js";

dotnet.config()

let router = Router()

const CheckUser = async (req, res, next) => {
    jwt.verify(req.cookies?.userToken, process.env.JWT_PRIVATE_KEY, async (err, decoded) => {
        if (decoded) {
            let userData = null

            try {
                userData = await user.checkUserFound(decoded)
            } catch (err) {
                if (err?.notExists) {
                    res.clearCookie('userToken')
                        .status(405).json({
                            status: 405,
                            message: err?.text
                        })
                } else {
                    res.status(500).json({
                        status: 500,
                        message: err
                    })
                }
            } finally {
                if (userData) {
                    req.body.userId = userData._id
                    next()
                }
            }

        } else {
            res.status(405).json({
                status: 405,
                message: 'Not Logged'
            })
        }
    })
}

// const configuration = new Configuration({
//     organization: process.env.OPENAI_ORGANIZATION,
//     apiKey: process.env.OPENAI_API_KEY
// });

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
router.get('/', (req, res) => {
    res.send("Welcome to chatGPT api v1")
})

router.post('/', CheckUser, async (req, res) => {
    const { prompt, userId } = req.body
    const messages= [{
        "role":"assistant", 
        "content":prompt,
        
     }]
    
    let response = {}
    try {
        console.log("POST is being called")
        response.openai = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages:[{
                "role":"assistant", 
                "content":prompt
             }],
             "top_p":0.5
        });
      //  console.log(response.openai.choices[0].message)
        if (response.openai.choices[0].message) {
            response.openai =response.openai.choices[0].message.content
            let index = 0
            //console.log(response['openai'])
            for (let c of response['openai']) {
                if (index <= 1) {
                    if (c == '\n') {
                        response.openai = response.openai.slice(1, response.openai.length)
                    }
                } else {
                    break;
                }
                index++
            }
            response.db = await chat.newResponse(prompt, response, userId)
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response?.db && response?.openai) {
            res.status(200).json({
                status: 200,
                message: 'Success',
                data: {
                    _id: response.db['chatId'],
                    content: response.openai
                }
            })
        }
    }
})

router.put('/', CheckUser, async (req, res) => {
    const { prompt, userId, chatId } = req.body
    let mes= [{
        "role": "system",
        "content": "You are a very interactive and helpful assistant ",
     }]
    let message = await chat.Messages(userId,chatId)
    message=message[0].chats
    mes.push(...message)
    mes.push(...[{
        role:"user",
        content: prompt
    }])
    console.log(mes)
    let response = {}
    try { 
        console.log("PUT is called")
        response.openai = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages:mes,
            "top_p":0.5
        });
       // console.log(response.openai.choices[0].message)
        if (response.openai.choices[0].message) {
            response.openai =response.openai.choices[0].message.content
            let index = 0
          //  console.log(response['openai'])
            for (let c of response['openai']) {
                if (index <= 1) {
                    if (c == '\n') {
                        response.openai = response.openai.slice(1, response.openai.length)
                    }
                } else {
                    break;
                }
                index++
            }
            response.db = await chat.Response(prompt, response, userId, chatId)
        }
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response?.db && response?.openai) {
            res.status(200).json({
                status: 200,
                message: 'Success',
                data: {
                    content: response.openai
                }
            })
        }
    }
})

router.get('/saved', CheckUser, async (req, res) => {
    const { userId } = req.body
    const { chatId = null } = req.query

    let response = null

    try {
        response = await chat.getChat(userId, chatId)
    } catch (err) {
        if (err?.status === 404) {
            res.status(404).json({
                status: 404,
                message: 'Not found'
            })
        } else {
            res.status(500).json({
                status: 500,
                message: err
            })
        }
    } finally {
        if (response) {
            res.status(200).json({
                status: 200,
                message: 'Success',
                data: response
            })
        }
    }
})

router.get('/history', CheckUser, async (req, res) => {
    const { userId } = req.body

    let response = null

    try {
        response = await chat.getHistory(userId)
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response) {
            res.status(200).json({
                status: 200,
                message: "Success",
                data: response
            })
        }
    }
})

router.delete('/all', CheckUser, async (req, res) => {
    const { userId } = req.body

    let response = null

    try {
        response = await chat.deleteAllChat(userId)
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err
        })
    } finally {
        if (response) {
            res.status(200).json({
                status: 200,
                message: 'Success'
            })
        }
    }
})

export default router
