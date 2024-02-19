import { db } from "../db/connection.js";
import collections from "../db/collections.js";
import { ObjectId } from "mongodb";

export default {
    newResponse: (prompt, { openai }, userId) => {
        return new Promise(async (resolve, reject) => {
            let chatId = new ObjectId().toHexString()
            let res = null
            try {
                await db.collection(collections.CHAT).createIndex({ user: 1 }, { unique: true })
                res = await db.collection(collections.CHAT).insertOne({
                    user: userId.toString(),
                    data: [{
                        chatId,
                        chats: [{
                            role:"user",
                            content: prompt
                        },{
                            role: "assistant",
                            content: openai
                        }],
                        chat:[
                            {
                                prompt: prompt,
                                content: openai
                            }
                        ]
                    }]
                })
            } catch (err) {
                if (err?.code === 11000) {
                    res = await db.collection(collections.CHAT).updateOne({
                        user: userId.toString(),
                    }, {
                        $push: {
                            data: {
                                chatId,
                                chats: [{
                                    role:"user",
                                    content: prompt,
                                },{
                                    role: "assistant",
                                    content: openai
                                }],
                                chat:[
                                    {
                                        prompt: prompt,
                                        content:openai
                                    }
                                ]

                            }
                        }
                    }).catch((err) => {
                        reject(err)
                    })
                } else {
                    reject(err)
                }
            } finally {
                if (res) {
                    res.chatId = chatId
                    resolve(res)
                } else {
                    reject({ text: "DB gets something wrong" })
                }
            }
        })
    },
    Response: (prompt, { openai }, userId, chatId) => {
        return new Promise(async (resolve, reject) => {
            let res = null;
            try  {
                    // If the chat exists, update it by pushing the new chat
                    res = await db.collection(collections.CHAT).updateOne({
                        user: userId.toString(),
                        "data.chatId": chatId
                    }, {
                        $push: {
                            "data.$.chats": {
                                $each: [
                                    { role: "user", content: prompt },
                                    { role: "assistant", content: openai }
                                ]

                            },
                            "data.$.chat":{
                                prompt:prompt,
                                content:openai
                            }
                        }
                    });
                } catch (err) {
                reject(err);
            } finally {
                if (res) {
                    res.chatId = chatId;
                    resolve(res);
                } else {
                    reject({ text: "DB gets something wrong" });
                }
            }
        });
    },
    
    updateChat: (chatId, prompt, { openai }, userId) => {
        return new Promise(async (resolve, reject) => {
            let res = await db.collection(collections.CHAT).updateOne({
                user: userId.toString(),
                'data.chatId': chatId
            }, {
                $push: {
                    data: {
                        chatId,
                        chats: [{
                            role:"user",
                            content: prompt,
                        },{
                            role: "assistant",
                            content: openai
                        }]
                    }
                }
            }).catch((err) => {
                reject(err)
            })

            if (res) {
                resolve(res)
            } else {
                reject({ text: "DB gets something wrong" })
            }
        })
    },
    getChat: (userId, chatId) => {
        return new Promise(async (resolve, reject) => {
            let res = await db.collection(collections.CHAT).aggregate([
                {
                    $match: {
                        user: userId.toString()
                    }
                }, {
                    $unwind: '$data'
                }, {
                    $match: {
                        'data.chatId': chatId
                    }
                }, {
                    $project: {
                        _id: 0,
                        chat: '$data.chat'
                    }
                }
            ]).toArray().catch((err) => [
                reject(err)
            ])

            if (res && Array.isArray(res) && res[0]?.chat) {
                resolve(res[0].chat)
            } else {
                reject({ status: 404 })
            }
        })
    },
    getHistory: (userId ) => {
        return new Promise(async (resolve, reject) => {
            let res = await db.collection(collections.CHAT).aggregate([
                {
                    $match: {
                        user: userId.toString()
                    }
                }, 
                {
                    $unwind: '$data'
                }, 
                {
                    $project: {
                        _id: 0,
                        chatId:'$data.chatId',
                        chat: '$data.chat' // Project the entire 'chats' array
                    }
                }
            ]).toArray().catch((err) => {
                reject(err)
            })

            if (Array.isArray(res)) {
                resolve(res)
            } else {
                reject({ text: "DB Getting Some Error" })
            }
        })
    },
    deleteAllChat: (userId) => {
        return new Promise((resolve, reject) => {
            db.collection(collections.CHAT).deleteOne({
                user: userId.toString()
            }).then((res) => {
                if (res?.deletedCount > 0) {
                    resolve(res)
                } else {
                    reject({ text: 'DB Getting Some Error' })
                }
            }).catch((err) => {
                reject(err)
            })
        })
    },
    Messages: (userId, chatId) => {
        return new Promise(async (resolve, reject) => {
            let res = await db.collection(collections.CHAT).aggregate([
                {
                    $match: {
                        user: userId.toString()
                    }
                }, {
                    $unwind: '$data'
                }, {
                    $match: {
                        'data.chatId': chatId
                    }
                }, 
                {
                    $project: {
                        _id: 0,
                        chats: '$data.chats' // Project the entire 'chats' array
                    }
                }
            ]).toArray().catch((err) => {
                reject(err)
            })

            if (Array.isArray(res)) {
                resolve(res)
            } else {
                reject({ text: "DB Getting Some Error" })
            }
        })
    },
    updateUserProfile : (email, firstName, lastName, image) => {
        return new Promise(async (resolve, reject) => {
            let check = db.collection(collections.USER).findOne({
                email:email
            }).catch((err) => {
                reject(err)
            })
            let done = null
    
            if (check) {
                try {
                    done = await db.collection(collections.USER).updateOne({email}, {
                        $set: {
                            fName: firstName,
                            lName: lastName
                        }
                    })
                } catch (err) {
                    reject(err)
                } finally {
                    if (done?.modifiedCount > 0) {
                        console.log("!").catch((err) => {
                            console.log(err)
                        })
    
                        resolve(done)
                    } else {
                        reject({ text: "Something Wrong" })
                    }
                }
            } else {
                reject({ status: 404 })
            }
        })
      },
      dump : (email, firstName, lastName, image) => {
        return new Promise((resolve, reject) => {
            db.collection(collections.USER).findOne({email}).then(existingUser => {
              if (existingUser) {
                if(firstName!="" && lastName!="")
                return db.collection(collections.USER).updateOne({email}, {
                  $set: {
                    fname: firstName,
                    lname: lastName
                  }
                });
              } 
            }).then(() => {
              if (image) {
                const uploadParams = {
                  Bucket: process.env.S3_BUCKET_NAME,
                  Key: `${email}-${Date.now()}`, // Unique key for the image
                  Body: image.data, // Assuming image is a buffer
                  ACL: 'public-read' // Make the image publicly accessible
                };
                return s3.upload(uploadParams).promise();
              } else {
                return Promise.resolve(); // Return a resolved promise if no image is present
              }
            }).then(uploadResult => {
              if (uploadResult) {
                return db.collection(collections.USER).updateOne({ email }, {
                  $set: {
                    profilePicture: uploadResult.Location // Store the URL of the uploaded image
                  }
                });
              }
            }).then(() => {
              resolve({ success: true });
            }).catch(error => {
              console.error("Error updating user profile:", error);
              reject({ success: false, error: "Error updating user profile" });
            });
          });
      }
}